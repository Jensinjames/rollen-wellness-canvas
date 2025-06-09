import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';

export interface DailyScore {
  id: string;
  user_id: string;
  score_date: string;
  daily_score_percentage: number;
  motivation_level_percentage: number;
  health_balance_percentage: number;
  sleep_score_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useDailyScores = (limit?: number) => {
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

export const useLatestDailyScore = () => {
  const { data: scores } = useDailyScores(1);
  return scores?.[0] || null;
};
