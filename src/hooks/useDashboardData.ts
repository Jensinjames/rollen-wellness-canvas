
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

  // Log data state for debugging
  console.log('Dashboard data state:', {
    activitiesCount: activities?.length || 0,
    categoriesCount: categories?.length || 0,
    activitiesLoading,
    categoriesLoading,
    hasErrors: !!(activitiesError || categoriesError)
  });

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

  // Memoize parent categories
  const parentCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      console.warn('Categories data is invalid:', categories);
      return [];
    }
    return categories.filter(cat => 
      cat && 
      typeof cat === 'object' && 
      cat.level === 0 && 
      cat.is_active &&
      cat.id &&
      cat.name
    ) || [];
  }, [categories]);

  // Memoize category activity data - this replaces the N+1 query pattern
  const categoryActivityData = useMemo(() => {
    if (!activities || !categories || !Array.isArray(activities) || !Array.isArray(categories)) {
      console.warn('Invalid activity or category data for processing:', { 
        activitiesType: typeof activities, 
        categoriesType: typeof categories,
        activitiesIsArray: Array.isArray(activities),
        categoriesIsArray: Array.isArray(categories)
      });
      return {};
    }

    const data: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryId: string]: number } } } = {};

    parentCategories.forEach(category => {
      if (!category || !category.id) {
        console.warn('Invalid category in parentCategories:', category);
        return;
      }
      
      // Get all category and subcategory IDs for this parent category
      const allCategoryIds = [category.id, ...(category.children?.map(c => c?.id).filter(Boolean) || [])];
      
      // Filter activities for this category family
      const todayCategoryActivities = todayActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id)
      );
      
      const weekCategoryActivities = weekActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id)
      );

      // Calculate daily and weekly totals
      const dailyTime = todayCategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
      const weeklyTime = weekCategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);

      // Calculate subcategory breakdown
      const subcategoryTimes: { [subcategoryId: string]: number } = {};
      if (category.children) {
        category.children.forEach(subcategory => {
          const subcategoryActivities = weekCategoryActivities.filter(activity => 
            activity.subcategory_id === subcategory.id
          );
          subcategoryTimes[subcategory.id] = subcategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
        });
      }

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
