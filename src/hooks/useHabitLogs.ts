
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed?: boolean;
  actual_value?: number;
  notes?: string;
  created_at: string;
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
            color,
            target_value,
            target_unit
          )
        `)
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateHabitLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitLogData: Omit<HabitLog, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{
          habit_id: habitLogData.habit_id,
          log_date: habitLogData.log_date,
          value: habitLogData.actual_value || 1,
          notes: habitLogData.notes,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      toast.success('Habit logged successfully');
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating habit log:', error);
      }
      toast.error('Failed to log habit');
    },
  });
};
