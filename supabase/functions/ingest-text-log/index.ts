import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEntry {
  date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  activity: string;
  category?: string;
  subcategory?: string;
  raw_text: string;
}

interface CategoryMapping {
  category_id: string;
  subcategory_id: string;
  confidence_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text_log, date } = await req.json();

    if (!text_log) {
      return new Response(JSON.stringify({ error: 'text_log is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing text log:', text_log);

    // Parse the text log into structured entries
    const parsedEntries = parseTextLog(text_log, date);
    console.log('Parsed entries:', parsedEntries);

    // Get user's categories for mapping
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing category mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('category_mappings')
      .select('*')
      .eq('user_id', user.id);

    if (mappingsError) {
      console.error('Error fetching mappings:', mappingsError);
    }

    // Map each entry to categories
    const mappedEntries = await Promise.all(
      parsedEntries.map(async (entry) => {
        const mapping = await findCategoryMapping(entry, categories || [], mappings || []);
        return {
          ...entry,
          mapping,
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      entries: mappedEntries,
      total: mappedEntries.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest-text-log function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseTextLog(textLog: string, baseDate?: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = textLog.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    console.log('Parsing line:', trimmedLine);

    // Try different parsing patterns
    const parsed = 
      parseTimeRangeFormat(trimmedLine, baseDate) ||
      parseDurationFormat(trimmedLine, baseDate) ||
      parseSimpleFormat(trimmedLine, baseDate);

    if (parsed) {
      entries.push(parsed);
    } else {
      console.warn('Could not parse line:', trimmedLine);
      // Still add as raw entry for manual review
      entries.push({
        duration_minutes: 0,
        activity: trimmedLine,
        raw_text: trimmedLine,
      });
    }
  }

  return entries;
}

function parseTimeRangeFormat(line: string, baseDate?: string): ParsedEntry | null {
  // Pattern: "9:00-10:30 Faith - Prayer" or "09:00 AM - 10:30 AM Work - Meeting"
  const timeRangePattern = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\s*-\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\s+(.+)$/i;
  const match = line.match(timeRangePattern);
  
  if (!match) return null;

  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod, activity] = match;
  
  // Convert to 24-hour format
  let start24 = parseInt(startHour);
  let end24 = parseInt(endHour);
  
  if (startPeriod?.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
  if (startPeriod?.toLowerCase() === 'am' && start24 === 12) start24 = 0;
  if (endPeriod?.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
  if (endPeriod?.toLowerCase() === 'am' && end24 === 12) end24 = 0;

  const startTime = `${start24.toString().padStart(2, '0')}:${startMin}`;
  const endTime = `${end24.toString().padStart(2, '0')}:${endMin}`;
  
  // Calculate duration
  const startMinutes = start24 * 60 + parseInt(startMin);
  const endMinutes = end24 * 60 + parseInt(endMin);
  let duration = endMinutes - startMinutes;
  
  // Handle overnight entries
  if (duration < 0) duration += 24 * 60;

  const { category, subcategory, activityName } = parseActivityString(activity);

  return {
    date: baseDate,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: duration,
    activity: activityName,
    category,
    subcategory,
    raw_text: line,
  };
}

function parseDurationFormat(line: string, baseDate?: string): ParsedEntry | null {
  // Pattern: "2h 15m Faith - Prayer" or "90m Work - Meeting"
  const durationPattern = /^(?:(\d+)h\s*)?(?:(\d+)m\s*)?(.+)$/;
  const match = line.match(durationPattern);
  
  if (!match) return null;

  const [, hours, minutes, activity] = match;
  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  
  if (totalMinutes === 0) return null;

  const { category, subcategory, activityName } = parseActivityString(activity);

  return {
    date: baseDate,
    duration_minutes: totalMinutes,
    activity: activityName,
    category,
    subcategory,
    raw_text: line,
  };
}

function parseSimpleFormat(line: string, baseDate?: string): ParsedEntry | null {
  // Pattern: "Faith - Prayer" (default to 30 minutes)
  const simplePattern = /^([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*-\s*(.+)$/;
  const match = line.match(simplePattern);
  
  if (!match) return null;

  const [, category, activity] = match;

  return {
    date: baseDate,
    duration_minutes: 30, // Default duration
    activity: activity.trim(),
    category: category.trim(),
    raw_text: line,
  };
}

function parseActivityString(activityString: string): { category?: string; subcategory?: string; activityName: string } {
  // Try to extract category and subcategory from patterns like "Faith - Prayer" or "Work - Meeting - Client Call"
  const parts = activityString.split(' - ').map(part => part.trim());
  
  if (parts.length >= 2) {
    return {
      category: parts[0],
      subcategory: parts[1],
      activityName: parts.slice(1).join(' - '),
    };
  }
  
  return {
    activityName: activityString.trim(),
  };
}

async function findCategoryMapping(
  entry: ParsedEntry,
  categories: any[],
  existingMappings: any[]
): Promise<CategoryMapping | null> {
  // First, check existing mappings
  const activityKey = entry.category || entry.activity;
  const existingMapping = existingMappings.find(m => 
    m.text_input.toLowerCase() === activityKey.toLowerCase()
  );

  if (existingMapping) {
    return {
      category_id: existingMapping.category_id,
      subcategory_id: existingMapping.subcategory_id,
      confidence_score: existingMapping.confidence_score,
    };
  }

  // Try to match categories by name similarity
  const parentCategories = categories.filter(cat => cat.level === 0);
  const subcategories = categories.filter(cat => cat.level === 1);

  // Look for category match
  let matchedCategory = null;
  if (entry.category) {
    matchedCategory = parentCategories.find(cat => 
      cat.name.toLowerCase().includes(entry.category?.toLowerCase()) ||
      entry.category?.toLowerCase().includes(cat.name.toLowerCase())
    );
  }

  // Look for subcategory match
  let matchedSubcategory = null;
  if (entry.subcategory && matchedCategory) {
    matchedSubcategory = subcategories.find(sub => 
      sub.parent_id === matchedCategory.id &&
      (sub.name.toLowerCase().includes(entry.subcategory?.toLowerCase()) ||
       entry.subcategory?.toLowerCase().includes(sub.name.toLowerCase()))
    );
  }

  if (matchedCategory && matchedSubcategory) {
    return {
      category_id: matchedCategory.id,
      subcategory_id: matchedSubcategory.id,
      confidence_score: 0.8,
    };
  }

  // Fallback: try to match activity name to any category/subcategory
  const allCategories = [...parentCategories, ...subcategories];
  const fuzzyMatch = allCategories.find(cat => {
    const activityWords = entry.activity.toLowerCase().split(/\s+/);
    const categoryWords = cat.name.toLowerCase().split(/\s+/);
    return activityWords.some(word => categoryWords.some(catWord => 
      word.includes(catWord) || catWord.includes(word)
    ));
  });

  if (fuzzyMatch) {
    if (fuzzyMatch.level === 0) {
      // It's a parent category - need to find a subcategory
      const firstSubcategory = subcategories.find(sub => sub.parent_id === fuzzyMatch.id);
      if (firstSubcategory) {
        return {
          category_id: fuzzyMatch.id,
          subcategory_id: firstSubcategory.id,
          confidence_score: 0.6,
        };
      }
    } else {
      // It's a subcategory
      return {
        category_id: fuzzyMatch.parent_id,
        subcategory_id: fuzzyMatch.id,
        confidence_score: 0.6,
      };
    }
  }

  return null;
}