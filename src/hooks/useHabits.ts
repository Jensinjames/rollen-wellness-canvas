
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface Habit {
  id: string;
  name: string;
  user_id: string;
  description?: string | null;
  target_value?: number | null;
  target_unit?: string | null;
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
      return data as Habit[];
    },
    enabled: !!user,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitData: { name: string; description?: string; target_value?: number; target_unit?: string; is_active?: boolean }) => {
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
    onError: () => {
      toast.error('Failed to create habit');
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{ name: string; description: string | null; target_value: number | null; target_unit: string | null; is_active: boolean }>) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated');
    },
    onError: () => {
      toast.error('Failed to update habit');
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      toast.success('Habit deleted');
    },
    onError: () => {
      toast.error('Failed to delete habit');
    },
  });
};
