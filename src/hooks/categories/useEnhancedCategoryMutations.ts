
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { Category } from './types';
import { 
  validateCategoryUpdatePayload, 
  sanitizeCategoryPayload,
  CategoryUpdatePayload 
} from '@/utils/categoryValidation';

// Enhanced error handling with structured logging
const logCategoryOperation = (operation: string, payload: any, result?: any, error?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    categoryId: payload.id,
    categoryName: payload.name,
    success: !error,
    fieldsUpdated: payload ? Object.keys(payload).filter(k => k !== 'id') : [],
    error: error?.message,
    result: result ? { id: result.id, name: result.name } : undefined
  };
  
  console.log('[Category Operation]', logData);
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Category> & { id: string }) => {
      if (!user || !session) {
        throw new Error('User not authenticated');
      }

      // Validate that we have required fields
      if (!updates.id) {
        throw new Error('Category ID is required for update');
      }

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

      // Enhanced logging for debugging - Phase 3 implementation
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
        // Phase 1 Fix: Send raw object directly to supabase.functions.invoke()
        // Remove manual JSON.stringify() and let Supabase handle serialization
        console.log('[Request Payload Debug]', {
          cleanPayload,
          payloadType: typeof cleanPayload,
          payloadKeys: Object.keys(cleanPayload),
          hasRequiredId: !!cleanPayload.id,
          sessionValid: !!session.access_token
        });

        // Phase 1 Fix: Remove explicit Content-Type header, only send Authorization
        const { data, error } = await supabase.functions.invoke('update-category', {
          body: cleanPayload, // Send as raw object, not stringified
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            // Removed explicit Content-Type - let Supabase handle it
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
        // Phase 2: Enhanced error logging and handling with better categorization
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
        
        // Phase 2: Provide more user-friendly error messages with better categorization
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
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      const fieldsUpdated = Object.keys(variables).filter(k => k !== 'id' && variables[k] !== undefined);
      const successMessage = `Category updated successfully (${fieldsUpdated.length} field${fieldsUpdated.length === 1 ? '' : 's'})`;
      
      toast.success(successMessage);
      
      console.log('[Category Update Success Toast]', {
        categoryId: data.id,
        categoryName: data.name,
        fieldsUpdated,
        successTimestamp: new Date().toISOString()
      });
    },
    onError: (error, variables) => {
      console.error('[Category Update Error Toast]', {
        error: error.message,
        categoryId: variables.id,
        categoryName: variables.name,
        errorTimestamp: new Date().toISOString()
      });
      
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

// Export validation utilities for use in components
export { validateCategoryUpdatePayload, sanitizeCategoryPayload } from '@/utils/categoryValidation';
