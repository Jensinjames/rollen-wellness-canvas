
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { validateCategoryData, logCategoryOperation } from '@/components/categories/CategoryValidation';

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  parent_id?: string;
  level: number;
  path: string[];
  daily_time_goal_minutes?: number;
  weekly_time_goal_minutes?: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

// Build hierarchical tree structure from flat category list
const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create map and initialize children arrays
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children!.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  // Sort categories and their children
  const sortCategories = (cats: Category[]) => {
    cats.sort((a, b) => a.sort_order - b.sort_order);
    cats.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        sortCategories(cat.children);
      }
    });
  };

  sortCategories(rootCategories);
  return rootCategories;
};

export const useCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return buildCategoryTree(data as Category[]);
    },
    enabled: !!user,
  });
};

export const useAllCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });
};

export const useParentCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', 'parents'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('level', 0)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });
};

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

// Hook to seed default categories for new users (optional)
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
