
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { Activity } from '@/types/activity';

// Re-export for backward compatibility
export type { Activity };


export const useActivities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // First get activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('start_time', { ascending: false });

      if (activitiesError) throw activitiesError;
      if (!activities) return [];

      // Get all unique category IDs
      const categoryIds = [...new Set(activities.map(a => a.category_id))];

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);

      if (categoriesError) throw categoriesError;

      // Create lookup map
      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);

      // Transform activities with category data
      return activities.map(activity => {
        const category = categoryMap.get(activity.category_id);
        const parent = category?.parent_id ? categoryMap.get(category.parent_id) : undefined;

        return {
          ...activity,
          category: category ? {
            id: category.id,
            name: category.name,
            color: category.color,
            level: category.level,
            parent_id: category.parent_id,
          } : undefined,
          subcategory: category?.level === 1 ? category : undefined,
        };
      });
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

      // Create the activity
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert([{
          ...activityData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (activityError) throw activityError;

      // Fetch category data
      const { data: categories, error: categoriesError} = await supabase
        .from('categories')
        .select('*')
        .in('id', [activity.category_id]);

      if (categoriesError) throw categoriesError;

      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);
      const category = categoryMap.get(activity.category_id);
      const parent = category?.parent_id ? categoryMap.get(category.parent_id) : undefined;

      return {
        ...activity,
        category: category ? {
          id: category.id,
          name: category.name,
          color: category.color,
          level: category.level,
          parent_id: category.parent_id,
        } : undefined,
        subcategory: category?.level === 1 ? category : undefined,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
      
      // Trigger animated update notification
      if (data.category) {
        const updateEvent = new CustomEvent('activityLogged', {
          detail: {
            id: data.id,
            categoryName: data.category.parent_id && parent ? parent.name : data.category.name,
            subcategoryName: data.subcategory?.name || data.category.name,
            duration: data.duration_minutes,
            timestamp: data.date_time,
            color: data.category.color,
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
