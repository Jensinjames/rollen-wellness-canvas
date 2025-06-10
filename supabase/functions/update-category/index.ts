
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
    // Enhanced logging for debugging
    console.log('Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Initialize Supabase client with user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse request body with improved error handling
    let body;
    try {
      const bodyText = await req.text();
      console.log('Raw request body received:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Empty request body received');
        return new Response(JSON.stringify({ error: 'Request body is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
      console.error('Category ID missing from request');
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

    console.log('User authenticated:', user.id);

    // Verify the category exists and belongs to the user
    const { data: existingCategory, error: fetchError } = await supabaseClient
      .from('categories')
      .select('id, user_id, name, parent_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching category:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch category',
        details: fetchError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingCategory) {
      console.error('Category not found for user:', { categoryId: id, userId: user.id });
      return new Response(JSON.stringify({ error: 'Category not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data with improved null/undefined handling
    const updateData: any = {};
    
    // Handle string fields
    if (name !== undefined && name !== null && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (color !== undefined && color !== null && color.trim() !== '') {
      updateData.color = color.trim();
    }
    if (description !== undefined) {
      updateData.description = description === null ? null : description.trim();
    }
    if (boolean_goal_label !== undefined) {
      updateData.boolean_goal_label = boolean_goal_label === null ? null : boolean_goal_label.trim();
    }
    if (goal_type !== undefined && goal_type !== null) {
      updateData.goal_type = goal_type;
    }

    // Handle boolean fields
    if (is_boolean_goal !== undefined && is_boolean_goal !== null) {
      updateData.is_boolean_goal = Boolean(is_boolean_goal);
    }
    if (is_active !== undefined && is_active !== null) {
      updateData.is_active = Boolean(is_active);
    }

    // Handle numeric fields
    if (daily_time_goal_minutes !== undefined) {
      updateData.daily_time_goal_minutes = daily_time_goal_minutes === null ? null : Number(daily_time_goal_minutes);
    }
    if (weekly_time_goal_minutes !== undefined) {
      updateData.weekly_time_goal_minutes = weekly_time_goal_minutes === null ? null : Number(weekly_time_goal_minutes);
    }
    if (sort_order !== undefined && sort_order !== null) {
      updateData.sort_order = Number(sort_order);
    }
    if (level !== undefined && level !== null) {
      updateData.level = Number(level);
    }

    // Handle parent_id with special logic for 'none' string
    if (parent_id !== undefined) {
      if (parent_id === 'none' || parent_id === null || parent_id === '') {
        updateData.parent_id = null;
      } else {
        updateData.parent_id = parent_id;
      }
    }

    // Always update the timestamp
    updateData.updated_at = new Date().toISOString();

    console.log('Sanitized update data:', updateData);

    // Ensure we have something meaningful to update
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updated_at');
    if (fieldsToUpdate.length === 0) {
      console.error('No valid fields to update');
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform the update with detailed logging
    console.log('Attempting to update category:', { id, updateData });
    
    const { data: updatedCategory, error: updateError } = await supabaseClient
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to update category',
        details: updateError.message,
        code: updateError.code
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Category updated successfully:', {
      id: updatedCategory.id,
      name: updatedCategory.name,
      fieldsUpdated: fieldsToUpdate
    });

    return new Response(JSON.stringify({ 
      data: updatedCategory,
      message: 'Category updated successfully',
      fieldsUpdated: fieldsToUpdate
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Unexpected error in update-category function:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
