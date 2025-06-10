import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { validateCategoryData, logCategoryOperation } from '@/components/categories/CategoryValidation';
import { Category } from './types';

// Utility to sanitize payload before sending to edge function
const sanitizePayload = (updates: Partial<Category> & { id: string }) => {
  const sanitized: any = {};
  
  // Always include the ID
  sanitized.id = updates.id;
  
  // Handle each field with proper type conversion and validation
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id') return; // Already handled above
    
    switch (key) {
      case 'parent_id':
        // Handle parent_id conversion: 'none' -> null, keep actual UUIDs
        if (value === 'none' || value === null || value === undefined) {
          sanitized.parent_id = null;
        } else if (typeof value === 'string' && value.trim() !== '') {
          sanitized.parent_id = value.trim();
        }
        break;
        
      case 'name':
      case 'color':
      case 'goal_type':
        // Required string fields - only include if non-empty
        if (typeof value === 'string' && value.trim() !== '') {
          sanitized[key] = value.trim();
        }
        break;
        
      case 'description':
      case 'boolean_goal_label':
        // Optional string fields - include null values
        if (value === null || value === undefined) {
          sanitized[key] = null;
        } else if (typeof value === 'string') {
          sanitized[key] = value.trim() === '' ? null : value.trim();
        }
        break;
        
      case 'is_boolean_goal':
      case 'is_active':
        // Boolean fields
        if (typeof value === 'boolean') {
          sanitized[key] = value;
        }
        break;
        
      case 'daily_time_goal_minutes':
      case 'weekly_time_goal_minutes':
        // Optional numeric fields
        if (value === null || value === undefined) {
          sanitized[key] = null;
        } else if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        }
        break;
        
      case 'sort_order':
      case 'level':
        // Required numeric fields
        if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        }
        break;
        
      default:
        // For other fields, include if not undefined
        if (value !== undefined) {
          sanitized[key] = value;
        }
    }
  });
  
  // Ensure we have at least one field to update besides id
  const fieldsToUpdate = Object.keys(sanitized).filter(key => key !== 'id');
  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields to update');
  }
  
  console.log('Sanitized payload for edge function:', sanitized);
  return sanitized;
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => {
      if (!user) throw new Error('User not authenticated');

      // Validate category data
      const isSubcategory = categoryData.level === 1 || !!categoryData.parent_id;
      // Pass null as currentId since this is a new category (no existing ID to exclude)
      const validation = validateCategoryData(categoryData, isSubcategory, [], null);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Log the operation
      logCategoryOperation('create', categoryData, isSubcategory ? 'subcategory' : 'top-level category');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const categoryType = data.level === 1 ? 'Subcategory' : 'Category';
      toast.success(`${categoryType} created successfully`);
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Category> & { id: string }) => {
      if (!user || !session) throw new Error('User not authenticated');

      // Validate that we have required fields
      if (!updates.id) {
        throw new Error('Category ID is required for update');
      }

      // Sanitize the payload before sending
      let sanitizedPayload;
      try {
        sanitizedPayload = sanitizePayload(updates);
      } catch (error: any) {
        throw new Error(`Payload validation failed: ${error.message}`);
      }

      // Log the operation
      logCategoryOperation('update', sanitizedPayload);

      console.log('Sending update request:', {
        payload: sanitizedPayload,
        hasSession: !!session.access_token,
        userId: user.id
      });

      try {
        // Call the edge function with improved error handling
        const { data, error } = await supabase.functions.invoke('update-category', {
          body: JSON.stringify(sanitizedPayload),
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Edge function invocation error:', error);
          throw new Error(error.message || 'Failed to call update function');
        }

        if (!data) {
          console.error('No response data from edge function');
          throw new Error('No response received from server');
        }

        if (!data.data) {
          console.error('Invalid response format:', data);
          throw new Error(data.error || 'Invalid response from server');
        }

        console.log('Category update successful:', data.data);
        return data.data;
      } catch (error: any) {
        // Enhanced error logging and handling
        console.error('Update category error details:', {
          error: error.message,
          payload: sanitizedPayload,
          hasSession: !!session,
          userId: user?.id,
          errorType: error.name
        });
        
        // Provide more user-friendly error messages
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      // Use the cascade delete function to properly remove category and related data
      const { error } = await supabase.rpc('cascade_delete_category', {
        category_id_param: id,
        user_id_param: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    },
  });
};

export const useSeedDefaultCategories = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('seed_default_categories', {
        user_id_param: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Default categories added successfully');
    },
    onError: (error) => {
      console.error('Error seeding default categories:', error);
      toast.error('Failed to add default categories');
    },
  });
};
