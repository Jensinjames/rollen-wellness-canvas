
import { supabase } from '@/integrations/supabase/client';
import { Category } from './types';
import { 
  validateCategoryUpdatePayload, 
  sanitizeCategoryPayload,
  CategoryUpdatePayload 
} from '@/utils/categoryValidation';
import { logCategoryOperation } from './categoryLogger';

export const updateCategoryRequest = async (
  updates: Partial<Category> & { id: string },
  session: any,
  user: any
) => {
  // Create payload for validation
  const payload: CategoryUpdatePayload = {
    id: updates.id,
    name: updates.name,
    color: updates.color,
    description: updates.description,
    goal_type: updates.goal_type,
    is_boolean_goal: updates.is_boolean_goal,
    boolean_goal_label: updates.boolean_goal_label,
    daily_time_goal_minutes: updates.daily_time_goal_minutes,
    weekly_time_goal_minutes: updates.weekly_time_goal_minutes,
    is_active: updates.is_active,
    sort_order: updates.sort_order,
    parent_id: updates.parent_id,
    level: updates.level
  };

  // Client-side validation
  const validation = validateCategoryUpdatePayload(payload);
  if (!validation.isValid) {
    const errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
    logCategoryOperation('update', payload, null, { message: errorMessage });
    throw new Error(errorMessage);
  }

  // Show warnings if any
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => {
      console.warn(`[Category Update Warning]`, warning);
    });
  }

  // Sanitize the payload
  const sanitizedPayload = sanitizeCategoryPayload(payload);

  // Filter out undefined values to only send fields that are being updated
  const cleanPayload = Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([_, value]) => value !== undefined)
  );

  // Ensure we have at least the id field
  if (!cleanPayload.id) {
    cleanPayload.id = updates.id;
  }

  logCategoryOperation('update', cleanPayload);

  // Enhanced logging for debugging
  console.log('[Enhanced Category Update Request]', {
    payload: cleanPayload,
    payloadSize: JSON.stringify(cleanPayload).length,
    hasSession: !!session.access_token,
    userId: user.id,
    validationWarnings: validation.warnings,
    sessionExpiry: session.expires_at,
    requestTimestamp: new Date().toISOString()
  });

  try {
    // Send raw object directly to supabase.functions.invoke()
    console.log('[Request Payload Debug]', {
      cleanPayload,
      payloadType: typeof cleanPayload,
      payloadKeys: Object.keys(cleanPayload),
      hasRequiredId: !!cleanPayload.id,
      sessionValid: !!session.access_token
    });

    // Send as raw object, not stringified, only send Authorization header
    const { data, error } = await supabase.functions.invoke('update-category', {
      body: cleanPayload,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    console.log('[Edge Function Response Debug]', {
      data,
      error,
      hasData: !!data,
      hasError: !!error,
      responseTimestamp: new Date().toISOString()
    });

    if (error) {
      console.error('[Edge Function Error]', error);
      logCategoryOperation('update', cleanPayload, null, error);
      throw new Error(error.message || 'Failed to call update function');
    }

    if (!data) {
      const noDataError = new Error('No response received from server');
      logCategoryOperation('update', cleanPayload, null, noDataError);
      throw noDataError;
    }

    if (!data.data) {
      const invalidResponseError = new Error(data.error || 'Invalid response from server');
      logCategoryOperation('update', cleanPayload, null, invalidResponseError);
      throw invalidResponseError;
    }

    logCategoryOperation('update', cleanPayload, data.data);
    console.log('[Category Update Success]', {
      category: data.data,
      fieldsUpdated: data.fieldsUpdated,
      requestId: data.requestId,
      successTimestamp: new Date().toISOString()
    });

    return data.data;
  } catch (error: any) {
    // Enhanced error logging and handling
    console.error('[Update Category Error]', {
      error: error.message,
      payload: cleanPayload,
      hasSession: !!session,
      userId: user?.id,
      errorType: error.name,
      stack: error.stack,
      errorTimestamp: new Date().toISOString()
    });
    
    logCategoryOperation('update', cleanPayload, null, error);
    
    // Provide user-friendly error messages
    if (error.message.includes('timeout') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }

    if (error.message.includes('Validation failed')) {
      throw error; // Pass validation errors as-is
    }

    if (error.message.includes('Empty request body') || error.message.includes('400')) {
      throw new Error('Invalid request format. Please try again or contact support.');
    }
    
    throw error;
  }
};
