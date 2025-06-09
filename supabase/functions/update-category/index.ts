
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body = await req.json();
    const {
      id,
      name,
      color,
      description,
      goal_type,
      is_boolean_goal,
      boolean_goal_label,
      daily_time_goal_minutes,
      weekly_time_goal_minutes,
      is_active,
      sort_order,
      parent_id,
      level
    } = body;

    // Validate required fields
    if (!id) {
      return new Response(JSON.stringify({ error: 'Category ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the category exists and belongs to the user
    const { data: existingCategory, error: fetchError } = await supabaseClient
      .from('categories')
      .select('id, user_id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching category:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch category' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingCategory) {
      return new Response(JSON.stringify({ error: 'Category not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (goal_type !== undefined) updateData.goal_type = goal_type;
    if (is_boolean_goal !== undefined) updateData.is_boolean_goal = is_boolean_goal;
    if (boolean_goal_label !== undefined) updateData.boolean_goal_label = boolean_goal_label;
    if (daily_time_goal_minutes !== undefined) updateData.daily_time_goal_minutes = daily_time_goal_minutes;
    if (weekly_time_goal_minutes !== undefined) updateData.weekly_time_goal_minutes = weekly_time_goal_minutes;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (level !== undefined) updateData.level = level;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform the update
    const { data: updatedCategory, error: updateError } = await supabaseClient
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating category:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update category',
        details: updateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Category updated successfully: ${updatedCategory.name} (${updatedCategory.id})`);

    return new Response(JSON.stringify({ 
      data: updatedCategory,
      message: 'Category updated successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Unexpected error in update-category function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
