
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from './types';
import { buildCategoryTree } from './utils';

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
