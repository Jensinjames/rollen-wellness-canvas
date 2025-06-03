
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { validateCategoryData, logCategoryOperation } from '@/components/categories/CategoryValidation';
import { Category } from './types';

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => {
      if (!user) throw new Error('User not authenticated');

      // Validate category data
      const isSubcategory = categoryData.level === 1 || !!categoryData.parent_id;
      const validation = validateCategoryData(categoryData, isSubcategory);
      
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Log the operation
      logCategoryOperation('update', { id, ...updates });

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
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
  const { user, loading } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // DIAGNOSTIC LOGGING - Log complete auth state
      console.log('=== SEED DEFAULT CATEGORIES DEBUG ===');
      console.log('Auth loading state:', loading);
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('User email:', user?.email);
      console.log('Timestamp:', new Date().toISOString());
      console.log('=====================================');

      // AUTHENTICATION GUARDS
      if (loading) {
        const error = new Error('Authentication is still loading. Please wait.');
        console.error('SEED FAILED: Auth still loading');
        throw error;
      }

      if (!user) {
        const error = new Error('User not authenticated. Please log in first.');
        console.error('SEED FAILED: No user object');
        throw error;
      }

      if (!user.id) {
        const error = new Error('User ID is missing from authentication context.');
        console.error('SEED FAILED: User object exists but no ID:', user);
        throw error;
      }

      console.log('Auth checks passed. Calling seed function with user_id:', user.id);

      // Call the database function with detailed error handling
      const { data, error } = await supabase.rpc('seed_default_categories', {
        user_id_param: user.id
      });

      if (error) {
        console.error('SEED FUNCTION ERROR:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw new Error(`Database error: ${error.message}${error.details ? ` (${error.details})` : ''}`);
      }

      console.log('Seed function completed successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Seed mutation success - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Default categories added successfully');
    },
    onError: (error) => {
      console.error('=== SEED MUTATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error object:', error);
      console.error('========================');
      
      // Display the actual error message to the user
      toast.error(`Failed to add default categories: ${error.message}`);
    },
  });
};
