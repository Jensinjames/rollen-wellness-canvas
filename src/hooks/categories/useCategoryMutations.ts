
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
      if (loading) {
        throw new Error('Authentication is still loading. Please wait a moment and try again.');
      }

      if (!user) {
        throw new Error('No user authenticated. Please log in to add default categories.');
      }

      if (!user.id) {
        throw new Error('User ID is missing from authentication context.');
      }

      console.log('Seeding default categories for user:', user.id);

      // Call the database function
      const { data, error } = await supabase.rpc('seed_default_categories', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Database error: ${error.message}${error.details ? ` (${error.details})` : ''}${error.hint ? ` Hint: ${error.hint}` : ''}`);
      }

      console.log('Default categories seeded successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Default categories added successfully');
    },
    onError: (error) => {
      console.error('Seed mutation error:', error);
      toast.error(`Failed to add default categories: ${error.message}`);
    },
  });
};
