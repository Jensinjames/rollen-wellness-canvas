
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  value: number;
  notes?: string | null;
  created_at: string;
  habits?: {
    id: string;
    name: string;
    target_value: number | null;
    target_unit: string | null;
  } | null;
}

export const useHabitLogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit-logs'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habit_logs')
        .select(`
          *,
          habits (
            id,
            name,
            target_value,
            target_unit
          )
        `)
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!user,
  });
};

export const useCreateHabitLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (logData: { habit_id: string; log_date: string; value: number; notes?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{
          ...logData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      toast.success('Habit logged');
    },
    onError: () => {
      toast.error('Failed to log habit');
    },
  });
};

export const useDeleteHabitLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
    },
    onError: () => {
      toast.error('Failed to remove habit log');
    },
  });
};
