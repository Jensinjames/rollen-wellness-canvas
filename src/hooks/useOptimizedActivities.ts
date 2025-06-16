
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface OptimizedActivity {
  id: string;
  category_id: string;
  subcategory_id: string;
  name: string;
  date_time: string;
  duration_minutes: number;
  is_completed?: boolean;
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
    goal_type?: string;
    boolean_goal_label?: string;
  };
}

export const useOptimizedActivities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities', 'optimized'],
    queryFn: async (): Promise<OptimizedActivity[]> => {
      if (!user) throw new Error('User not authenticated');

      // Single optimized query with JOINs to eliminate N+1 pattern
      const { data: activities, error } = await supabase
        .from('activities')
        .select(`
          *,
          main_category:categories!category_id (
            id,
            name,
            color,
            level,
            path,
            parent_id
          ),
          sub_category:categories!subcategory_id (
            id,
            name,
            color,
            level,
            parent_id,
            goal_type,
            boolean_goal_label
          )
        `)
        .order('date_time', { ascending: false });

      if (error) throw error;
      if (!activities) return [];

      // Transform the joined data into the expected format
      return activities.map(activity => {
        const category = activity.main_category;
        const subcategory = activity.sub_category;

        return {
          ...activity,
          categories: category ? {
            id: category.id,
            name: category.name,
            color: category.color,
            level: category.level,
            path: category.path || [],
            parent_id: category.parent_id,
          } : undefined,
          subcategories: subcategory ? {
            id: subcategory.id,
            name: subcategory.name,
            color: subcategory.color,
            level: subcategory.level,
            parent_id: subcategory.parent_id,
            goal_type: subcategory.goal_type,
            boolean_goal_label: subcategory.boolean_goal_label,
          } : undefined,
        };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
