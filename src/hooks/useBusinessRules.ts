import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook for category totals with goal tracking
export const useCategoryTotals = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['category-totals', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('category_totals')
        .select('*')
        .order('activity_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('activity_date', dateRange.start.toISOString().split('T')[0])
          .lte('activity_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for daily streaks
export const useDailyStreaks = () => {
  return useQuery({
    queryKey: ['daily-streaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_streaks')
        .select('*')
        .order('streak_length', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for goal deficiencies
export const useGoalDeficiencies = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['goal-deficiencies', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('goal_deficiencies')
        .select('*')
        .order('deficiency_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('deficiency_date', dateRange.start.toISOString().split('T')[0])
          .lte('deficiency_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for unaccounted time calculation
export const useUnaccountedTime = (date: Date) => {
  return useQuery({
    queryKey: ['unaccounted-time', date.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_unaccounted_time', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_date: date.toISOString().split('T')[0]
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for category guardrails validation
export const useCategoryGuardrails = () => {
  const checkGuardrails = async (
    categoryId: string,
    date: Date,
    durationMinutes: number
  ) => {
    const { data, error } = await supabase.rpc('check_category_guardrails', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_category_id: categoryId,
      p_date: date.toISOString().split('T')[0],
      p_new_duration_minutes: durationMinutes
    });

    if (error) throw error;
    return data;
  };

  return { checkGuardrails };
};

// Hook for validating 15-minute increments
export const useValidation = () => {
  const validate15MinuteIncrements = async (
    durationMinutes: number,
    autoRound: boolean = false
  ) => {
    const { data, error } = await supabase.rpc('validate_15_minute_increments', {
      duration_minutes: durationMinutes,
      auto_round: autoRound
    });

    if (error) throw error;
    return data as number;
  };

  const applySleepCutoff = async (
    entryDatetime: Date,
    sleepCutoffHour: number = 4
  ) => {
    const { data, error } = await supabase.rpc('apply_sleep_cutoff', {
      entry_datetime: entryDatetime.toISOString(),
      sleep_cutoff_hour: sleepCutoffHour
    });

    if (error) throw error;
    return data as string;
  };

  return {
    validate15MinuteIncrements,
    applySleepCutoff
  };
};