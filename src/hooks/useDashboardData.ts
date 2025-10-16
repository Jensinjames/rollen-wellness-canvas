
import { useMemo } from 'react';
import { useCachedActivities } from '@/hooks/useCachedActivities';
import { useCachedCategories } from '@/hooks/useCachedCategories';
import { useCategoryActivitySummary } from '@/hooks/data/useCategoryActivitySummary';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface DashboardData {
  todayActivities: any[];
  weekActivities: any[];
  todayTotalTime: number;
  weekTotalTime: number;
  parentCategories: any[];
  categoryActivityData: ReturnType<typeof useCategoryActivitySummary>['data'];
  isLoading: boolean;
  error: any;
}

export const useDashboardData = (): DashboardData => {
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useCachedActivities();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { data: categoryActivityData, isLoading: categoryActivityLoading } = useCategoryActivitySummary();


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

  return {
    todayActivities,
    weekActivities,
    todayTotalTime,
    weekTotalTime,
    parentCategories,
    categoryActivityData,
    isLoading: activitiesLoading || categoriesLoading || categoryActivityLoading,
    error: activitiesError || categoriesError
  };
};
