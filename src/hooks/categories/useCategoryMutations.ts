
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
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
