
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsHeaders = (origin?: string | null) => {
  const allowOrigin = allowedOrigins.length
    ? (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
    : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;
};

interface CacheEntry {
  data: any;
  expiry: number;
  userId: string;
}

interface CacheConfig {
  duration: number; // in milliseconds
  userSpecific: boolean;
}

// Cache configurations for different data types
const cacheConfigs: Record<string, CacheConfig> = {
  'activities': { duration: 5 * 60 * 1000, userSpecific: true }, // 5 minutes
  'categories': { duration: 30 * 60 * 1000, userSpecific: true }, // 30 minutes
  'category-activity-data': { duration: 10 * 60 * 1000, userSpecific: true }, // 10 minutes
  'analytics-summary': { duration: 15 * 60 * 1000, userSpecific: true }, // 15 minutes
  'daily-scores': { duration: 60 * 60 * 1000, userSpecific: true }, // 1 hour
  'habits': { duration: 30 * 60 * 1000, userSpecific: true }, // 30 minutes
  'habit-logs': { duration: 10 * 60 * 1000, userSpecific: true }, // 10 minutes
};

const cache = new Map<string, CacheEntry>();

function getCacheKey(queryType: string, userId: string, params?: string): string {
  const config = cacheConfigs[queryType];
  if (!config) return `${queryType}:${params || 'default'}`;
  
  if (config.userSpecific) {
    return `${queryType}:${userId}:${params || 'default'}`;
  }
  return `${queryType}:${params || 'default'}`;
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiry) {
      cache.delete(key);
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req.headers.get('Origin')) });
  }

  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      });
    }

    const queryType = url.searchParams.get('type');
    const params = url.searchParams.get('params') || undefined;
    const invalidate = url.searchParams.get('invalidate') === 'true';

    if (!queryType) {
      return new Response(JSON.stringify({ error: 'Query type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey = getCacheKey(queryType, user.id, params);

    // Handle cache invalidation
    if (invalidate) {
      // Remove specific cache entry or pattern
      if (params === 'all') {
        // Clear all cache entries for this user and query type
        for (const key of cache.keys()) {
          if (key.startsWith(`${queryType}:${user.id}`)) {
            cache.delete(key);
          }
        }
      } else {
        cache.delete(cacheKey);
      }
      
      return new Response(JSON.stringify({ success: true, message: 'Cache invalidated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean on each request
      cleanExpiredCache();
    }

    // Server-side rate limiting per user
    const { data: rate, error: rateErr } = await supabase.rpc('check_rate_limit', {
      identifier: user.id,
      max_requests: 120,
      window_seconds: 60,
    });

    if (rateErr) {
      console.error('Rate limit check error:', rateErr.message);
    }

    if (rate && rate.allowed === false) {
      return new Response(JSON.stringify({ error: 'Too many requests', reset_time: rate.reset_time, remaining: rate.remaining }), {
        status: 429,
        headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      });
    }

    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedEntry = cache.get(cacheKey)!;
      if (Date.now() < cachedEntry.expiry && cachedEntry.userId === user.id) {
        return new Response(JSON.stringify({ 
          data: cachedEntry.data, 
          cached: true,
          cacheKey 
        }), {
          headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
        });
      } else {
        cache.delete(cacheKey);
      }
    }

    // Fetch fresh data based on query type
    let data;
    let error;

    switch (queryType) {
      case 'activities':
        ({ data, error } = await supabase
          .from('activities')
          .select('*')
          .order('date_time', { ascending: false }));
        break;

      case 'categories':
        ({ data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('level', { ascending: true })
          .order('sort_order', { ascending: true }));
        break;

      case 'daily-scores':
        const limit = params ? parseInt(params) : undefined;
        let query = supabase
          .from('daily_scores')
          .select('*')
          .order('score_date', { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        ({ data, error } = await query);
        break;

      case 'habits':
        ({ data, error } = await supabase
          .from('habits')
          .select('*')
          .order('name', { ascending: true }));
        break;

      case 'habit-logs':
        ({ data, error } = await supabase
          .from('habit_logs')
          .select(`
            *,
            habits (
              id,
              name,
              color,
              target_value,
              target_unit
            )
          `)
          .order('log_date', { ascending: false }));
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unsupported query type' }), {
          status: 400,
          headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
        });
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      });
    }

    // Cache the response
    const config = cacheConfigs[queryType];
    if (config) {
      cache.set(cacheKey, {
        data,
        expiry: Date.now() + config.duration,
        userId: user.id
      });
    }

    return new Response(JSON.stringify({ 
      data, 
      cached: false,
      cacheKey,
      cacheExpiry: config ? new Date(Date.now() + config.duration).toISOString() : null
    }), {
      headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cache layer error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
