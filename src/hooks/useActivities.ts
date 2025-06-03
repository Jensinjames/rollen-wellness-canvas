
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Create a unique channel name to avoid conflicts
    const channelName = `activities-changes-${user.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate activities query to refresh data
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]); // Only depend on user.id, not the entire user object

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

      // Get all unique category and subcategory IDs
      const categoryIds = [...new Set(activities.map(a => a.category_id))];
      const subcategoryIds = [...new Set(activities.map(a => a.subcategory_id).filter(Boolean))];

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', [...categoryIds, ...subcategoryIds]);

      if (categoriesError) throw categoriesError;

      // Create lookup maps
      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);

      // Transform activities with category data
      return activities.map(activity => {
        const category = categoryMap.get(activity.category_id);
        const subcategory = categoryMap.get(activity.subcategory_id);
        
        // Get parent category for subcategory if it exists
        const parent = subcategory?.parent_id ? categoryMap.get(subcategory.parent_id) : undefined;

        return {
          ...activity,
          categories: category ? {
            id: category.id,
            name: category.name,
            color: category.color,
            level: category.level,
            path: category.path || [],
            parent_id: category.parent_id,
            parent: parent ? {
              id: parent.id,
              name: parent.name,
              color: parent.color,
            } : undefined,
          } : undefined,
          subcategories: subcategory ? {
            id: subcategory.id,
            name: subcategory.name,
            color: subcategory.color,
            level: subcategory.level,
            parent_id: subcategory.parent_id,
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

      // Fetch category and subcategory data
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', [activity.category_id, activity.subcategory_id].filter(Boolean));

      if (categoriesError) throw categoriesError;

      const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);
      const category = categoryMap.get(activity.category_id);
      const subcategory = categoryMap.get(activity.subcategory_id);
      const parent = subcategory?.parent_id ? categoryMap.get(subcategory.parent_id) : undefined;

      return {
        ...activity,
        categories: category ? {
          id: category.id,
          name: category.name,
          color: category.color,
          level: category.level,
          path: category.path || [],
          parent_id: category.parent_id,
          parent: parent ? {
            id: parent.id,
            name: parent.name,
            color: parent.color,
          } : undefined,
        } : undefined,
        subcategories: subcategory ? {
          id: subcategory.id,
          name: subcategory.name,
          color: subcategory.color,
          level: subcategory.level,
          parent_id: subcategory.parent_id,
        } : undefined,
      };
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
