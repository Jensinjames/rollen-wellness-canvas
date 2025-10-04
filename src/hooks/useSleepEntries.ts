// Sleep tracking functionality is disabled - table not in current schema
// This file is kept for future implementation

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

export interface SleepPreferences {
  target_sleep_hours: number;
  acceptable_range_min: number;
  acceptable_range_max: number;
  sleep_quality_weight: number;
}

// Disabled - table not in current schema
export const useSleepEntries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sleep-entries'],
    queryFn: async () => {
      return [] as SleepEntry[];
    },
    enabled: false,
  });
};

// Disabled - table not in current schema  
export const useCreateSleepEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sleepEntryData: any) => {
      throw new Error('Sleep tracking not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-entries'] });
      toast.success('Sleep entry logged successfully');
    },
    onError: (error) => {
      toast.error('Failed to log sleep entry');
    },
  });
};
