import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import type { Database } from '@/integrations/supabase/types';

// Types - Using Views instead of Tables for database views
type ActivityStreak = Database['public']['Views']['activity_streaks']['Row'];
type CategoryTotal = Database['public']['Views']['category_totals']['Row'];
type GoalDeficiency = Database['public']['Views']['goal_deficiencies']['Row'];
type DailyScore = Database['public']['Tables']['daily_scores']['Row'];

// Activity Streaks Queries
export const useActivityStreaksQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-streaks'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_streaks')
        .select('*');

      if (error) throw error;
      return data as ActivityStreak[];
    },
    enabled: !!user,
  });
};

// Goal Deficiencies Queries
export const useGoalDeficienciesQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-deficiencies'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('goal_deficiencies')
        .select('*');

      if (error) throw error;
      return data as GoalDeficiency[];
    },
    enabled: !!user,
  });
};

// Category totals queries
export const useCategoryTotalsQuery = (dateRange?: { start: Date; end: Date }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['category-totals', dateRange],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('category_totals')
        .select('*');

      if (dateRange) {
        // Add date filtering if needed
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Sleep entries disabled - table not in current schema
export const useSleepEntriesQuery = () => {
  return useQuery({
    queryKey: ['sleep-entries'],
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });
};

// Daily Scores Queries
export const useDailyScoresQuery = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-scores', limit],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('daily_scores')
        .select('*')
        .order('score_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
