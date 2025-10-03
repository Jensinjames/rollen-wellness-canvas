
import { useMemo } from 'react';
import { useCachedActivities } from '@/hooks/useCachedActivities';
import { useCachedCategories } from '@/hooks/useCachedCategories';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface DashboardData {
  todayActivities: any[];
  weekActivities: any[];
  todayTotalTime: number;
  weekTotalTime: number;
  parentCategories: any[];
  categoryActivityData: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryId: string]: number } } };
  isLoading: boolean;
  error: any;
}

export const useDashboardData = (): DashboardData => {
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useCachedActivities();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCachedCategories();


  // Memoize date calculations to avoid recalculating on every render
  const dateRanges = useMemo(() => {
    const now = new Date();
    return {
      startOfToday: startOfDay(now),
      endOfToday: endOfDay(now),
      startOfThisWeek: startOfWeek(now),
      endOfThisWeek: endOfWeek(now),
    };
  }, []);

  // Memoize filtered activities to avoid recalculating
  const { todayActivities, weekActivities } = useMemo(() => {
    if (!activities) return { todayActivities: [], weekActivities: [] };

    const today = activities.filter(activity => {
      const activityDate = new Date(activity.date_time);
      return activityDate >= dateRanges.startOfToday && activityDate <= dateRanges.endOfToday;
    });

    const week = activities.filter(activity => {
      const activityDate = new Date(activity.date_time);
      return activityDate >= dateRanges.startOfThisWeek && activityDate <= dateRanges.endOfThisWeek;
    });

    return { todayActivities: today, weekActivities: week };
  }, [activities, dateRanges]);

  // Memoize time calculations
  const { todayTotalTime, weekTotalTime } = useMemo(() => {
    const todayTime = todayActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
    const weekTime = weekActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
    return { todayTotalTime: todayTime, weekTotalTime: weekTime };
  }, [todayActivities, weekActivities]);

  // Parent categories filtering
  const parentCategories = useMemo(() => {
    if (!categories?.length) return [];
    
    return categories.filter(cat => 
      cat?.id && cat?.name && cat.level === 0 && cat.is_active !== false
    );
  }, [categories]);

  // Category activity data processing with subcategory mapping
  const categoryActivityData = useMemo(() => {
    if (!activities?.length || !categories?.length) return {};

    const data: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryName: string]: number } } } = {};

    parentCategories.forEach(category => {
      if (!category?.id || !category?.name) {
        console.error('[Dashboard] Invalid category:', category);
        return;
      }
      
      // Map subcategory IDs to names
      const subcategoryMap = new Map<string, string>();
      if (category.children?.length) {
        category.children.forEach(subcategory => {
          if (subcategory?.id && subcategory?.name) {
            subcategoryMap.set(subcategory.id, subcategory.name);
          }
        });
      }
      
      // Filter activities for this category
      const todayCategoryActivities = todayActivities.filter(activity => 
        activity?.duration_minutes > 0 &&
        (activity.category_id === category.id || subcategoryMap.has(activity.subcategory_id || ''))
      );
      
      const weekCategoryActivities = weekActivities.filter(activity => 
        activity?.duration_minutes > 0 &&
        (activity.category_id === category.id || subcategoryMap.has(activity.subcategory_id || ''))
      );

      // Calculate totals
      const dailyTime = todayCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);
      const weeklyTime = weekCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);

      // Subcategory breakdown by NAME
      const subcategoryTimes: { [subcategoryName: string]: number } = {};
      Array.from(subcategoryMap.entries()).forEach(([subcategoryId, subcategoryName]) => {
        const subTime = weekCategoryActivities
          .filter(activity => activity?.subcategory_id === subcategoryId)
          .reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0);
        if (subTime > 0) {
          subcategoryTimes[subcategoryName] = subTime;
        }
      });

      data[category.id] = {
        dailyTime,
        weeklyTime,
        subcategoryTimes
      };
    });

    return data;
  }, [activities, parentCategories, todayActivities, weekActivities]);

  return {
    todayActivities,
    weekActivities,
    todayTotalTime,
    weekTotalTime,
    parentCategories,
    categoryActivityData,
    isLoading: activitiesLoading || categoriesLoading,
    error: activitiesError || categoriesError
  };
};
