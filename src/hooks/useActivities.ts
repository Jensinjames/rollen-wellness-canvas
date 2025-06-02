
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  category_id: string;
  name: string;
  date_time: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    level: number;
    path: string[];
    parent_id?: string;
    parent?: {
      id: string;
      name: string;
      color: string;
    };
  };
}

export const useActivities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            level,
            path,
            parent_id,
            parent:parent_id (
              id,
              name,
              color
            )
          )
        `)
        .order('date_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...activityData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity logged successfully');
    },
    onError: (error) => {
      // Log error without exposing sensitive details
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating activity:', error);
      }
      toast.error('Failed to log activity');
    },
  });
};
