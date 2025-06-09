import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

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

      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .order('sleep_date', { ascending: false });

      if (error) throw error;
      return data;
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

      const { data, error } = await supabase
        .from('sleep_entries')
        .insert([{
          ...sleepData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Trigger daily score recalculation
      await recalculateDailyScores(user.id, sleepData.sleep_date);

      return data;
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

// Helper function to recalculate daily scores when sleep is logged
const recalculateDailyScores = async (userId: string, sleepDate: string) => {
  try {
    // Get user's sleep preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('sleep_preferences')
      .eq('id', userId)
      .single();

    const defaultPrefs: SleepPreferences = {
      target_sleep_hours: 8,
      acceptable_range_min: 6,
      acceptable_range_max: 10,
      sleep_quality_weight: 0.3,
      sleep_duration_weight: 0.7,
      motivation_boost_threshold: 7
    };

    let sleepPrefs: SleepPreferences = defaultPrefs;
    
    if (profile?.sleep_preferences && typeof profile.sleep_preferences === 'object') {
      sleepPrefs = { ...defaultPrefs, ...(profile.sleep_preferences as Record<string, any>) };
    }

    // Get the sleep entry for this date
    const { data: sleepEntry } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('sleep_date', sleepDate)
      .single();

    if (!sleepEntry) return;

    const sleepHours = sleepEntry.sleep_duration_minutes / 60;
    const targetHours = sleepPrefs.target_sleep_hours;
    const minAcceptable = sleepPrefs.acceptable_range_min;
    const maxAcceptable = sleepPrefs.acceptable_range_max;

    // Calculate sleep score (0-100)
    let durationScore = 100;
    if (sleepHours < minAcceptable) {
      durationScore = Math.max(0, (sleepHours / minAcceptable) * 100);
    } else if (sleepHours > maxAcceptable) {
      durationScore = Math.max(0, 100 - ((sleepHours - maxAcceptable) / 2) * 10);
    } else if (sleepHours < targetHours) {
      durationScore = 70 + ((sleepHours - minAcceptable) / (targetHours - minAcceptable)) * 30;
    }

    const qualityScore = sleepEntry.sleep_quality ? (sleepEntry.sleep_quality / 5) * 100 : 70;
    
    const sleepScore = Math.round(
      (durationScore * sleepPrefs.sleep_duration_weight) + 
      (qualityScore * sleepPrefs.sleep_quality_weight)
    );

    // Calculate motivation boost
    let motivationBoost = 0;
    if (sleepHours >= sleepPrefs.motivation_boost_threshold) {
      motivationBoost = Math.min(20, (sleepHours - sleepPrefs.motivation_boost_threshold) * 5);
    }

    // Get or create daily score entry
    const { data: existingScore } = await supabase
      .from('daily_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('score_date', sleepDate)
      .single();

    const currentMotivation = existingScore?.motivation_level_percentage || 50;
    const newMotivation = Math.min(100, currentMotivation + motivationBoost);

    if (existingScore) {
      await supabase
        .from('daily_scores')
        .update({
          sleep_score_percentage: sleepScore,
          motivation_level_percentage: newMotivation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingScore.id);
    } else {
      await supabase
        .from('daily_scores')
        .insert({
          user_id: userId,
          score_date: sleepDate,
          sleep_score_percentage: sleepScore,
          motivation_level_percentage: newMotivation,
          daily_score_percentage: Math.round((sleepScore + newMotivation) / 2),
          health_balance_percentage: sleepScore,
        });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error recalculating daily scores:', error);
    }
  }
};
