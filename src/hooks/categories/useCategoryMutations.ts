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
  
  // Only include defined values, but handle parent_id specially
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id') return; // Already handled above
    
    if (key === 'parent_id') {
      // Handle parent_id conversion: 'none' -> null, keep actual UUIDs
      if (value === 'none' || value === null) {
        sanitized.parent_id = null;
      } else if (typeof value === 'string' && value.trim() !== '') {
        sanitized.parent_id = value;
      }
    } else if (value !== undefined && value !== null && value !== '') {
      // For other fields, only include non-empty values
      sanitized[key] = value;
    }
  });
  
  // Ensure we have at least one field to update besides id
  const fieldsToUpdate = Object.keys(sanitized).filter(key => key !== 'id');
  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields to update');
  }
  
  console.log('Sanitized payload:', sanitized);
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

      console.log('Sending update request with payload:', sanitizedPayload);
      console.log('Session token exists:', !!session.access_token);

      // Call the edge function with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const { data, error } = await supabase.functions.invoke('update-category', {
          body: sanitizedPayload,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Failed to update category');
        }

        if (!data || !data.data) {
          console.error('No data returned from edge function:', data);
          throw new Error('No data returned from update operation');
        }

        console.log('Update successful:', data.data);
        return data.data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        // Enhanced error logging
        console.error('Update category error details:', {
          error: error.message,
          payload: sanitizedPayload,
          hasSession: !!session,
          userId: user?.id
        });
        
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
