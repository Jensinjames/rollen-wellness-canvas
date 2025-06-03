
import { supabase } from '@/integrations/supabase/client';
import { securityLogger } from './enhancedSecurityLogger';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  blockDuration?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}

class EnhancedRateLimiter {
  private localCache = new Map<string, { count: number; resetTime: number; blocked?: boolean }>();

  async checkRateLimit(
    identifier: string, 
    config: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
  ): Promise<RateLimitResult> {
    try {
      // Check database rate limit first
      const { data } = await supabase.rpc('check_rate_limit', {
        identifier,
        max_requests: config.maxRequests,
        window_seconds: config.windowSeconds,
      });

      if (data) {
        const result = data as any;
        
        // Log rate limit check
        if (!result.allowed) {
          await securityLogger.logSecurityEvent('security.rate_limit_exceeded', {
            identifier,
            current_count: result.current_count,
            max_requests: config.maxRequests,
            window_seconds: config.windowSeconds,
          });
        }

        return {
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: new Date(result.reset_time),
          blocked: false,
        };
      }
    } catch (error) {
      console.error('Database rate limit check failed, falling back to local cache:', error);
    }

    // Fallback to local rate limiting
    return this.localRateLimit(identifier, config);
  }

  private localRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const cached = this.localCache.get(identifier);

    // Check if blocked
    if (cached?.blocked && now < cached.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(cached.resetTime),
        blocked: true,
      };
    }

    // Reset window if expired
    if (!cached || now > cached.resetTime) {
      this.localCache.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now + windowMs),
        blocked: false,
      };
    }

    // Increment count
    cached.count++;
    
    if (cached.count > config.maxRequests) {
      // Block if configured
      if (config.blockDuration) {
        cached.blocked = true;
        cached.resetTime = now + (config.blockDuration * 1000);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(cached.resetTime),
        blocked: !!config.blockDuration,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - cached.count,
      resetTime: new Date(cached.resetTime),
      blocked: false,
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now > value.resetTime) {
        this.localCache.delete(key);
      }
    }
  }
}

export const enhancedRateLimiter = new EnhancedRateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  enhancedRateLimiter.cleanup();
}, 5 * 60 * 1000);
