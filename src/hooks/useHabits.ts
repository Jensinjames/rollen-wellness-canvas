
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface Habit {
  id: string;
  name: string;
  user_id: string;
  category_id?: string;
  color?: string;
  frequency_type?: 'daily' | 'weekly' | 'custom';
  frequency_days?: number[];
  target_value?: number;
  target_unit?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useHabits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert([{
          ...habitData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created successfully');
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating habit:', error);
      }
      toast.error('Failed to create habit');
    },
  });
};
