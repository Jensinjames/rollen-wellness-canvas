
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Enhanced validation functions
const validateHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

const validateGoalType = (goalType: string): boolean => {
  return ['time', 'boolean', 'both'].includes(goalType);
};

const validateString = (value: string, minLength = 1, maxLength = 100): boolean => {
  return typeof value === 'string' && 
         value.trim().length >= minLength && 
         value.trim().length <= maxLength;
};

const validateNumber = (value: number, min = 0, max = Number.MAX_SAFE_INTEGER): boolean => {
  return typeof value === 'number' && 
         !isNaN(value) && 
         value >= min && 
         value <= max;
};

// Structured logging function
const logOperation = (level: 'info' | 'warn' | 'error', message: string, context: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    function: 'update-category',
    ...context
  };
  console.log(JSON.stringify(logEntry));
};

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    logOperation('warn', 'Invalid method', { requestId, method: req.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    logOperation('info', 'Processing category update request', { requestId });

    // Initialize Supabase client with user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logOperation('warn', 'Missing authorization header', { requestId });
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

    // Enhanced request body parsing with detailed logging
    let body;
    let bodyText = '';
    try {
      // Get content-type for debugging
      const contentType = req.headers.get('content-type') || 'not-specified';
      
      bodyText = await req.text();
      logOperation('info', 'Raw request received', { 
        requestId, 
        bodyLength: bodyText.length,
        contentType: contentType,
        hasAuthHeader: !!authHeader,
        bodyPreview: bodyText.length > 0 ? bodyText.substring(0, 100) : 'empty'
      });
      
      if (!bodyText || bodyText.trim() === '') {
        logOperation('warn', 'Empty request body', { 
          requestId,
          contentType,
          headers: Object.fromEntries(req.headers.entries())
        });
        return new Response(JSON.stringify({ 
          error: 'Request body is required',
          details: 'The request body appears to be empty or missing',
          requestId 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      body = JSON.parse(bodyText);
      logOperation('info', 'Request body parsed successfully', { 
        requestId, 
        fieldsProvided: Object.keys(body),
        categoryId: body.id 
      });
    } catch (parseError) {
      logOperation('error', 'JSON parse error', { 
        requestId, 
        error: parseError.message,
        bodyText: bodyText.substring(0, 200),
        bodyLength: bodyText.length
      });
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message,
        requestId
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

    // Enhanced field validation
    const validationErrors: string[] = [];

    // Required field validation
    if (!id) {
      validationErrors.push('Category ID is required');
    }

    // Color validation
    if (color !== undefined && !validateHexColor(color)) {
      validationErrors.push('Color must be a valid 6-digit hex code (e.g., #FF0000)');
    }

    // Goal type validation
    if (goal_type !== undefined && !validateGoalType(goal_type)) {
      validationErrors.push('Goal type must be one of: time, boolean, both');
    }

    // Name validation
    if (name !== undefined && !validateString(name, 1, 100)) {
      validationErrors.push('Name must be between 1 and 100 characters');
    }

    // Description validation
    if (description !== undefined && description !== null && !validateString(description, 0, 500)) {
      validationErrors.push('Description must be no more than 500 characters');
    }

    // Boolean goal label validation
    if (boolean_goal_label !== undefined && boolean_goal_label !== null && !validateString(boolean_goal_label, 0, 100)) {
      validationErrors.push('Boolean goal label must be no more than 100 characters');
    }

    // Time goal validation
    if (daily_time_goal_minutes !== undefined && daily_time_goal_minutes !== null && 
        !validateNumber(daily_time_goal_minutes, 0, 1440)) {
      validationErrors.push('Daily time goal must be between 0 and 1440 minutes');
    }

    if (weekly_time_goal_minutes !== undefined && weekly_time_goal_minutes !== null && 
        !validateNumber(weekly_time_goal_minutes, 0, 10080)) {
      validationErrors.push('Weekly time goal must be between 0 and 10080 minutes');
    }

    // Sort order validation
    if (sort_order !== undefined && sort_order !== null && 
        !validateNumber(sort_order, 0, 999)) {
      validationErrors.push('Sort order must be between 0 and 999');
    }

    // Level validation
    if (level !== undefined && level !== null && 
        !validateNumber(level, 0, 1)) {
      validationErrors.push('Level must be 0 (top-level) or 1 (subcategory)');
    }

    if (validationErrors.length > 0) {
      logOperation('warn', 'Validation errors', { requestId, errors: validationErrors });
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: validationErrors,
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      logOperation('error', 'Authentication error', { requestId, error: userError?.message });
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        requestId 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logOperation('info', 'User authenticated', { requestId, userId: user.id });

    // Verify the category exists and belongs to the user
    const { data: existingCategory, error: fetchError } = await supabaseClient
      .from('categories')
      .select('id, user_id, name, parent_id, level')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      logOperation('error', 'Error fetching category', { 
        requestId, 
        error: fetchError.message,
        categoryId: id 
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch category',
        details: fetchError.message,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingCategory) {
      logOperation('warn', 'Category not found or access denied', { 
        requestId, 
        categoryId: id, 
        userId: user.id 
      });
      return new Response(JSON.stringify({ 
        error: 'Category not found or access denied',
        requestId 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced parent_id validation
    if (parent_id !== undefined && parent_id !== null && parent_id !== 'none' && parent_id !== '') {
      const { data: parentCategory, error: parentError } = await supabaseClient
        .from('categories')
        .select('id, level, user_id')
        .eq('id', parent_id)
        .eq('user_id', user.id)
        .single();

      if (parentError || !parentCategory) {
        logOperation('warn', 'Invalid parent category', { 
          requestId, 
          parentId: parent_id,
          error: parentError?.message 
        });
        return new Response(JSON.stringify({ 
          error: 'Parent category not found or access denied',
          requestId 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (parentCategory.level !== 0) {
        logOperation('warn', 'Parent must be top-level category', { 
          requestId, 
          parentId: parent_id,
          parentLevel: parentCategory.level 
        });
        return new Response(JSON.stringify({ 
          error: 'Parent category must be a top-level category (level 0)',
          requestId 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Prepare update data with enhanced sanitization
    const updateData: any = {};
    
    // Handle string fields with proper sanitization
    if (name !== undefined && name !== null && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (color !== undefined && color !== null && color.trim() !== '') {
      updateData.color = color.trim().toUpperCase(); // Normalize to uppercase
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

    // Handle parent_id with enhanced logic
    if (parent_id !== undefined) {
      if (parent_id === 'none' || parent_id === null || parent_id === '') {
        updateData.parent_id = null;
      } else {
        updateData.parent_id = parent_id;
      }
    }

    // Always update the timestamp
    updateData.updated_at = new Date().toISOString();

    // Ensure we have something meaningful to update
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updated_at');
    if (fieldsToUpdate.length === 0) {
      logOperation('warn', 'No valid fields to update', { requestId });
      return new Response(JSON.stringify({ 
        error: 'No valid fields to update',
        requestId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logOperation('info', 'Performing category update', { 
      requestId, 
      categoryId: id,
      fieldsToUpdate,
      updateData: { ...updateData, updated_at: undefined } // Don't log timestamp
    });

    // Perform the update
    const { data: updatedCategory, error: updateError } = await supabaseClient
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logOperation('error', 'Database update error', {
        requestId,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to update category',
        details: updateError.message,
        code: updateError.code,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logOperation('info', 'Category updated successfully', {
      requestId,
      categoryId: updatedCategory.id,
      categoryName: updatedCategory.name,
      fieldsUpdated: fieldsToUpdate
    });

    return new Response(JSON.stringify({ 
      data: updatedCategory,
      message: 'Category updated successfully',
      fieldsUpdated: fieldsToUpdate,
      requestId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logOperation('error', 'Unexpected error in update-category function', {
      requestId,
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString(),
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
