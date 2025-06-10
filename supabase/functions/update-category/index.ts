
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
    // Check if request has body
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      console.error('Empty request body received');
      return new Response(JSON.stringify({ error: 'Request body is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Parse request body with error handling
    let body;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      
      body = JSON.parse(bodyText);
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Prepare update data - only include fields that are provided and valid
    const updateData: any = {};
    if (name !== undefined && name !== null) updateData.name = name;
    if (color !== undefined && color !== null) updateData.color = color;
    if (description !== undefined && description !== null) updateData.description = description;
    if (goal_type !== undefined && goal_type !== null) updateData.goal_type = goal_type;
    if (is_boolean_goal !== undefined && is_boolean_goal !== null) updateData.is_boolean_goal = is_boolean_goal;
    if (boolean_goal_label !== undefined && boolean_goal_label !== null) updateData.boolean_goal_label = boolean_goal_label;
    if (daily_time_goal_minutes !== undefined && daily_time_goal_minutes !== null) updateData.daily_time_goal_minutes = daily_time_goal_minutes;
    if (weekly_time_goal_minutes !== undefined && weekly_time_goal_minutes !== null) updateData.weekly_time_goal_minutes = weekly_time_goal_minutes;
    if (is_active !== undefined && is_active !== null) updateData.is_active = is_active;
    if (sort_order !== undefined && sort_order !== null) updateData.sort_order = sort_order;
    if (parent_id !== undefined) updateData.parent_id = parent_id; // Allow null values for parent_id
    if (level !== undefined && level !== null) updateData.level = level;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    console.log('Update data to be sent:', updateData);

    // Ensure we have something to update
    if (Object.keys(updateData).length <= 1) { // Only updated_at
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
