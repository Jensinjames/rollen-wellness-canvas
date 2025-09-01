/**
 * Category Business Logic Hooks  
 * Phase 2: Separated business logic from data fetching
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { Category } from '../categories/types';
import { updateCategoryRequest } from '../categories/updateCategoryRequest';
import { logCategoryOperation } from '@/services/category';
import { validateCategoryData } from '@/services/category';

// ============= Category Creation =============
export const useCategoryCreation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => {
      if (!user) throw new Error('User not authenticated');

      // Validate category data
      const isSubcategory = categoryData.level === 1 || !!categoryData.parent_id;
      const validation = validateCategoryData(categoryData as any, isSubcategory, [], null);
      
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
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

// ============= Category Updates =============
export const useCategoryUpdates = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Category> & { id: string }) => {
      if (!user || !session) {
        throw new Error('User not authenticated');
      }

      if (!updates.id) {
        throw new Error('Category ID is required for update');
      }

      return updateCategoryRequest(updates, session, user);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      const fieldsUpdated = Object.keys(variables).filter(k => k !== 'id' && variables[k] !== undefined);
      const successMessage = `Category updated successfully (${fieldsUpdated.length} field${fieldsUpdated.length === 1 ? '' : 's'})`;
      
      toast.success(successMessage);
    },
    onError: (error, variables) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

// ============= Category Deletion =============
export const useCategoryDeletion = () => {
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
      toast.error('Failed to delete category');
    },
  });
};

// ============= Category Seeding =============
export const useCategorySeeding = () => {
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
      toast.error('Failed to add default categories');
    },
  });
};

// ============= Category Validation Helpers =============
export const useCategoryValidation = () => {
  return {
    validateCategoryData: (categoryData: any, isSubcategory: boolean, existingCategories: any[] = [], currentId: string | null = null) => {
      return validateCategoryData(categoryData, isSubcategory, existingCategories, currentId);
    },
    
    logOperation: (operation: 'create' | 'update', categoryData: any, context?: string) => {
      logCategoryOperation(operation, categoryData, context);
    }
  };
};