/**
 * Data Query Hooks - Separated from Business Logic
 * Phase 2: Clean separation between data fetching and business logic
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Category } from '../categories/types';
import { buildCategoryTree } from '../categories/utils';

// ============= Category Data Queries =============
export const useCategoriesQuery = () => {
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

export const useAllCategoriesQuery = () => {
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

export const useParentCategoriesQuery = () => {
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

// ============= Activity Data Queries =============
export const useActivitiesQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          category:categories!activities_category_id_fkey (
            id, name, color
          ),
          subcategory:categories!activities_subcategory_id_fkey (
            id, name, color
          )
        `)
        .eq('user_id', user.id)
        .order('date_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useActivitiesByDateQuery = (date: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities', 'by-date', date],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          category:categories!activities_category_id_fkey (
            id, name, color
          ),
          subcategory:categories!activities_subcategory_id_fkey (
            id, name, color
          )
        `)
        .eq('user_id', user.id)
        .gte('date_time', startOfDay.toISOString())
        .lte('date_time', endOfDay.toISOString())
        .order('date_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!date,
  });
};

// ============= Dashboard Data Queries =============
export const useDashboardDataQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Fetch today's activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayActivities, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          category:categories!activities_category_id_fkey (
            id, name, color, goal_type, daily_time_goal_minutes
          ),
          subcategory:categories!activities_subcategory_id_fkey (
            id, name, color, goal_type, daily_time_goal_minutes
          )
        `)
        .eq('user_id', user.id)
        .gte('date_time', today.toISOString())
        .lt('date_time', tomorrow.toISOString());

      if (activitiesError) throw activitiesError;

      // Fetch active categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      return {
        todayActivities: todayActivities || [],
        categories: categories || []
      };
    },
    enabled: !!user,
  });
};

// ============= Habit Data Queries =============
export const useHabitsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useHabitLogsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit_logs'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habit_logs')
        .select(`
          *,
          habit:habits!habit_logs_habit_id_fkey (
            id, name, description, streak_target
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ============= Sleep Data Queries =============
export const useSleepEntriesQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sleep_entries'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('sleep_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ============= Daily Scores Queries =============
export const useDailyScoresQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily_scores'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};