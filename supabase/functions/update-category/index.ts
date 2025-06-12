
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateCategoryFields } from './validation.ts';
import { logOperation } from './logger.ts';
import { sanitizeUpdateData, validateParentCategory, validateCategoryExists } from './data-processing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    logOperation('warn', 'Invalid method', { requestId, method: req.method });
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      requestId 
    }), {
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
      return new Response(JSON.stringify({ 
        error: 'Authorization header required',
        requestId 
      }), {
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

    // Phase 3: Enhanced request body parsing with comprehensive logging
    let body;
    let bodyText = '';
    try {
      const contentType = req.headers.get('content-type') || 'not-specified';
      
      bodyText = await req.text();
      logOperation('info', 'Raw request body received', { 
        requestId, 
        bodyLength: bodyText.length,
        contentType: contentType,
        hasAuthHeader: !!authHeader,
        bodyPreview: bodyText.length > 0 ? bodyText.substring(0, 200) : 'empty',
        headers: Object.fromEntries(req.headers.entries())
      });
      
      if (!bodyText || bodyText.trim() === '') {
        logOperation('error', 'Empty or missing request body', { 
          requestId,
          contentType,
          bodyLength: bodyText.length,
          rawBody: bodyText
        });
        return new Response(JSON.stringify({ 
          error: 'Request body is required and cannot be empty',
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
        categoryId: body.id,
        bodySize: JSON.stringify(body).length
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

    // Validate request body fields
    const validationErrors = validateCategoryFields(body);
    if (validationErrors.length > 0) {
      logOperation('warn', 'Validation errors detected', { 
        requestId, 
        errors: validationErrors,
        categoryId: body.id
      });
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: validationErrors,
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Phase 3: Enhanced user authentication with session validation
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      logOperation('error', 'Authentication error', { 
        requestId, 
        error: userError?.message,
        hasAuthHeader: !!authHeader
      });
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - invalid or expired session',
        requestId 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logOperation('info', 'User authenticated successfully', { 
      requestId, 
      userId: user.id,
      userEmail: user.email 
    });

    // Verify the category exists and belongs to the user
    await validateCategoryExists(supabaseClient, body.id, user.id, requestId);

    // Enhanced parent_id validation
    await validateParentCategory(supabaseClient, body.parent_id, user.id, requestId);

    // Prepare update data with enhanced sanitization
    const updateData = sanitizeUpdateData(body);

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
      categoryId: body.id,
      fieldsToUpdate,
      updateData: { ...updateData, updated_at: undefined } // Don't log timestamp
    });

    // Perform the update
    const { data: updatedCategory, error: updateError } = await supabaseClient
      .from('categories')
      .update(updateData)
      .eq('id', body.id)
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
