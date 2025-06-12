
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateCategoryFields } from './validation.ts';
import { logOperation } from './logger.ts';
import { corsHeaders, handleCorsOptions } from './cors.ts';
import { validateAuthHeader, authenticateUser } from './auth.ts';
import { parseRequestBody } from './request-parser.ts';
import { createErrorResponse, createSuccessResponse } from './response-handler.ts';
import { performCategoryUpdate } from './database-operations.ts';

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  if (req.method !== 'POST') {
    logOperation('warn', 'Invalid method', { requestId, method: req.method });
    return createErrorResponse('Method not allowed', undefined, requestId, 405);
  }

  try {
    logOperation('info', 'Processing category update request', { requestId });

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    validateAuthHeader(authHeader, requestId);

    // Initialize Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse and validate request body
    const body = await parseRequestBody(req, requestId);

    // Validate request body fields
    const validationErrors = validateCategoryFields(body);
    if (validationErrors.length > 0) {
      logOperation('warn', 'Validation errors detected', { 
        requestId, 
        errors: validationErrors,
        categoryId: body.id
      });
      return createErrorResponse('Validation failed', validationErrors.join(', '), requestId);
    }

    // Authenticate user
    const user = await authenticateUser(supabaseClient, authHeader, requestId);

    // Perform the category update
    const { updatedCategory, fieldsToUpdate } = await performCategoryUpdate(
      supabaseClient, 
      body, 
      user, 
      requestId
    );

    return createSuccessResponse(updatedCategory, fieldsToUpdate, requestId);

  } catch (error: any) {
    logOperation('error', 'Unexpected error in update-category function', {
      requestId,
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return createErrorResponse(
      'Internal server error', 
      error.message, 
      requestId, 
      500
    );
  }
});
