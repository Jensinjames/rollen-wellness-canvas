
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useDailyScores } from './useDailyScores';

export interface SleepEntry {
  id: string;
  user_id: string;
  sleep_date: string;
  sleep_duration_minutes: number;
  sleep_quality?: number;
  bedtime?: string;
  wake_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SleepPreferences {
  target_sleep_hours: number;
  acceptable_range_min: number;
  acceptable_range_max: number;
  sleep_quality_weight: number;
  sleep_duration_weight: number;
  motivation_boost_threshold: number;
}

export const useSleepEntries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sleep-entries'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Sleep entries table doesn't exist in schema - return empty array
      return [] as SleepEntry[];
    },
    enabled: !!user,
  });
};

export const useCreateSleepEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sleepData: Omit<SleepEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      // Sleep entries table doesn't exist in schema - throw error
      throw new Error('Sleep entries feature not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-scores'] });
      toast.success('Sleep entry logged successfully');
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating sleep entry:', error);
      }
      toast.error('Failed to log sleep entry');
    },
  });
};

export const useUpdateSleepEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SleepEntry> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Sleep entries table doesn't exist in schema - throw error
      throw new Error('Sleep entries feature not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-entries'] });
      queryClient.invalidateQueries({ queryKey: ['daily-scores'] });
      toast.success('Sleep entry updated successfully');
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating sleep entry:', error);
      }
      toast.error('Failed to update sleep entry');
    },
  });
};

export const useSleepAnalytics = () => {
  const { data: sleepEntries } = useSleepEntries();

  return useMemo(() => {
    if (!sleepEntries || sleepEntries.length === 0) {
      return {
        averageDuration: 0,
        averageQuality: 0,
        totalEntries: 0,
        weeklyTrend: [],
      };
    }

    // Return empty analytics since feature not implemented
    return {
      averageDuration: 0,
      averageQuality: 0,
      totalEntries: 0,
      weeklyTrend: [],
    };
  }, [sleepEntries]);
};

export const useWellnessScore = () => {
  const { data: dailyScores } = useDailyScores();

  return useMemo(() => {
    if (!dailyScores || dailyScores.length === 0) {
      return {
        currentScore: 0,
        trend: [],
        averageScore: 0,
      };
    }

    // Return basic wellness score
    const currentScore = dailyScores[0]?.overall_score || 0;
    const trend = dailyScores.slice(0, 7).reverse().map(score => ({
      date: score.score_date,
      score: score.overall_score,
    }));
    const averageScore = dailyScores.reduce((sum, score) => sum + score.overall_score, 0) / dailyScores.length;

    return {
      currentScore,
      trend,
      averageScore,
    };
  }, [dailyScores]);
};
