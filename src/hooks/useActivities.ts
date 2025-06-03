
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  category_id: string;
  subcategory_id: string;
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
  subcategories?: {
    id: string;
    name: string;
    color: string;
    level: number;
    parent_id: string;
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
          categories!activities_category_id_fkey (
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
          ),
          subcategories:categories!activities_subcategory_id_fkey (
            id,
            name,
            color,
            level,
            parent_id
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
        .select(`
          *,
          categories!activities_category_id_fkey (
            id,
            name,
            color,
            level,
            path,
            parent_id
          ),
          subcategories:categories!activities_subcategory_id_fkey (
            id,
            name,
            color,
            level,
            parent_id
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
      
      // Trigger animated update notification
      if (data.categories && data.subcategories) {
        const updateEvent = new CustomEvent('activityLogged', {
          detail: {
            id: data.id,
            categoryName: data.categories.name,
            subcategoryName: data.subcategories.name,
            duration: data.duration_minutes,
            timestamp: data.date_time,
            color: data.subcategories.color,
          }
        });
        window.dispatchEvent(updateEvent);
      }
      
      toast.success('Time logged successfully');
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating activity:', error);
      }
      toast.error('Failed to log time');
    },
  });
};
