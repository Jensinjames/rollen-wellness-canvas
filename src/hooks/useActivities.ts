
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  user_id: string;
  category_id: string;
  start_time: string;
  end_time: string;
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
    goal_type?: string;
    boolean_goal_label?: string;
  };
}

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
        .order('date_time', { ascending: false });

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

      // Create lookup maps
      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);

      // Transform activities with category data
      return activities.map(activity => {
        const category = categoryMap.get(activity.category_id);
        
        // Get parent category if this is a subcategory
        const parent = category?.parent_id ? categoryMap.get(category.parent_id) : undefined;

        return {
          ...activity,
          categories: category ? {
            id: category.id,
            name: category.name,
            color: category.color,
            level: category.level,
            parent_id: category.parent_id,
            parent: parent ? {
              id: parent.id,
              name: parent.name,
              color: parent.color,
            } : undefined,
          } : undefined,
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
    mutationFn: async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'categories' | 'subcategories'>) => {
      if (!user) throw new Error('User not authenticated');

      // Create the activity
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          category_id: activityData.category_id,
          start_time: activityData.start_time,
          end_time: activityData.end_time,
          date_time: activityData.date_time,
          duration_minutes: activityData.duration_minutes,
          notes: activityData.notes,
        }])
        .select()
        .single();

      if (activityError) throw activityError;

      // Fetch category data
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', [activity.category_id]);

      if (categoriesError) throw categoriesError;

      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);
      const category = categoryMap.get(activity.category_id);
      const parent = category?.parent_id ? categoryMap.get(category.parent_id) : undefined;

      return {
        ...activity,
        categories: category ? {
          id: category.id,
          name: category.name,
          color: category.color,
          level: category.level,
          parent_id: category.parent_id,
          parent: parent ? {
            id: parent.id,
            name: parent.name,
            color: parent.color,
          } : undefined,
        } : undefined,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
      
      // Trigger animated update notification
      if (data.categories) {
        const updateEvent = new CustomEvent('activityLogged', {
          detail: {
            id: data.id,
            categoryName: data.categories.name,
            duration: data.duration_minutes,
            timestamp: data.date_time,
            color: data.categories.color,
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
