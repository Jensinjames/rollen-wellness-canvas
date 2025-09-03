import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkEntry {
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  activity: string;
  category_id: string;
  subcategory_id: string;
  notes?: string;
  is_completed?: boolean;
}

interface ValidationRule {
  enforce_15_min_increments: boolean;
  auto_round_15_min: boolean;
  sleep_cutoff_hour: number; // 4 for 04:00
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

    const { entries, validation_rules = {} } = await req.json();

    if (!entries || !Array.isArray(entries)) {
      return new Response(JSON.stringify({ error: 'entries array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing bulk entry for ${entries.length} entries`);

    const rules: ValidationRule = {
      enforce_15_min_increments: validation_rules.enforce_15_min_increments ?? true,
      auto_round_15_min: validation_rules.auto_round_15_min ?? true,
      sleep_cutoff_hour: validation_rules.sleep_cutoff_hour ?? 4,
    };

    // Validate and process entries
    const processedEntries = [];
    const validationErrors = [];
    const warnings = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const result = await validateAndProcessEntry(entry, rules, user.id, supabase);
      
      if (result.success) {
        processedEntries.push(result.processedEntry);
        if (result.warnings?.length > 0) {
          warnings.push(...result.warnings.map(w => ({ entry: i, warning: w })));
        }
      } else {
        validationErrors.push({ entry: i, errors: result.errors });
      }
    }

    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors: validationErrors,
        processed: processedEntries.length,
        total: entries.length,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check category guardrails
    const guardrailErrors = await checkCategoryGuardrails(processedEntries, user.id, supabase);
    if (guardrailErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors: guardrailErrors,
        message: 'Category daily goal limits exceeded',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert entries in batches
    const batchSize = 100;
    const insertedEntries = [];
    
    for (let i = 0; i < processedEntries.length; i += batchSize) {
      const batch = processedEntries.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('activities')
        .insert(batch)
        .select();

      if (error) {
        console.error('Error inserting batch:', error);
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to insert entries: ${error.message}`,
          inserted: insertedEntries.length,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      insertedEntries.push(...(data || []));
    }

    // Update category mappings for better future parsing
    await updateCategoryMappings(entries, user.id, supabase);

    return new Response(JSON.stringify({
      success: true,
      inserted: insertedEntries.length,
      total: entries.length,
      warnings: warnings.length > 0 ? warnings : undefined,
      entries: insertedEntries,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in entries-bulk function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateAndProcessEntry(
  entry: BulkEntry,
  rules: ValidationRule,
  userId: string,
  supabase: any
): Promise<{ success: boolean; processedEntry?: any; errors?: string[]; warnings?: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!entry.activity || !entry.category_id || !entry.subcategory_id) {
    errors.push('Missing required fields: activity, category_id, subcategory_id');
  }

  if (!entry.date) {
    errors.push('Date is required');
  }

  if (entry.duration_minutes < 0) {
    errors.push('Duration cannot be negative');
  }

  if (entry.duration_minutes > 1440) {
    errors.push('Duration cannot exceed 24 hours');
  }

  // Validate categories exist and belong to user
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, level, parent_id, daily_time_goal_minutes')
    .eq('user_id', userId)
    .in('id', [entry.category_id, entry.subcategory_id]);

  if (catError || !categories || categories.length !== 2) {
    errors.push('Invalid category or subcategory');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Apply validation rules
  let duration = entry.duration_minutes;

  // 15-minute increment validation
  if (rules.enforce_15_min_increments && duration % 15 !== 0) {
    if (rules.auto_round_15_min) {
      const rounded = Math.round(duration / 15) * 15;
      warnings.push(`Duration rounded from ${duration}m to ${rounded}m for 15-minute compliance`);
      duration = rounded;
    } else {
      errors.push(`Duration must be in 15-minute increments (got ${duration}m)`);
    }
  }

  // Sleep cutoff logic
  let effectiveDate = entry.date;
  if (entry.start_time) {
    const hour = parseInt(entry.start_time.split(':')[0]);
    if (hour < rules.sleep_cutoff_hour) {
      // Move to previous day
      const date = new Date(entry.date);
      date.setDate(date.getDate() - 1);
      effectiveDate = date.toISOString().split('T')[0];
      warnings.push(`Entry moved to previous day due to sleep cutoff rule (before ${rules.sleep_cutoff_hour}:00)`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Create datetime
  let dateTime: string;
  if (entry.start_time) {
    dateTime = `${effectiveDate}T${entry.start_time}:00`;
  } else {
    // Default to current time for entries without specific time
    const now = new Date();
    dateTime = `${effectiveDate}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
  }

  const processedEntry = {
    user_id: userId,
    category_id: entry.category_id,
    subcategory_id: entry.subcategory_id,
    name: entry.activity,
    date_time: dateTime,
    duration_minutes: duration,
    is_completed: entry.is_completed ?? false,
    notes: entry.notes || null,
  };

  return { success: true, processedEntry, warnings };
}

async function checkCategoryGuardrails(
  entries: any[],
  userId: string,
  supabase: any
): Promise<string[]> {
  const errors: string[] = [];

  // Group entries by date and category
  const entriesByDateAndCategory = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    const date = entry.date_time.split('T')[0];
    const categoryId = entry.category_id;

    if (!entriesByDateAndCategory.has(date)) {
      entriesByDateAndCategory.set(date, new Map());
    }

    const dateMap = entriesByDateAndCategory.get(date)!;
    const currentTotal = dateMap.get(categoryId) || 0;
    dateMap.set(categoryId, currentTotal + entry.duration_minutes);
  }

  // Get category goals
  const categoryIds = [...new Set(entries.map(e => e.category_id))];
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, daily_time_goal_minutes')
    .eq('user_id', userId)
    .in('id', categoryIds);

  if (error || !categories) {
    console.error('Error fetching category goals:', error);
    return ['Failed to validate category goals'];
  }

  // Check each date/category combination
  for (const [date, categoryTotals] of entriesByDateAndCategory.entries()) {
    for (const [categoryId, totalMinutes] of categoryTotals.entries()) {
      const category = categories.find(c => c.id === categoryId);
      if (category?.daily_time_goal_minutes && totalMinutes > category.daily_time_goal_minutes) {
        errors.push(
          `Category "${category.name}" on ${date}: ${totalMinutes}m exceeds daily goal of ${category.daily_time_goal_minutes}m`
        );
      }
    }
  }

  return errors;
}

async function updateCategoryMappings(
  entries: BulkEntry[],
  userId: string,
  supabase: any
): Promise<void> {
  try {
    const mappings = entries
      .filter(entry => entry.activity && entry.category_id && entry.subcategory_id)
      .map(entry => ({
        user_id: userId,
        text_input: entry.activity.toLowerCase(),
        category_id: entry.category_id,
        subcategory_id: entry.subcategory_id,
        confidence_score: 1.0,
      }));

    if (mappings.length > 0) {
      // Use upsert to avoid duplicates
      await supabase
        .from('category_mappings')
        .upsert(mappings, { onConflict: 'user_id,text_input' });
    }
  } catch (error) {
    console.error('Error updating category mappings:', error);
    // Don't fail the main operation if mapping update fails
  }
}