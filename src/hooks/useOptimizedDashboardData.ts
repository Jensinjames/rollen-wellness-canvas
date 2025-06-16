
import { useMemo } from 'react';
import { useOptimizedActivities } from './useOptimizedActivities';
import { useCategories } from '@/hooks/categories';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface OptimizedDashboardData {
  todayActivities: any[];
  weekActivities: any[];
  todayTotalTime: number;
  weekTotalTime: number;
  parentCategories: any[];
  categoryActivityData: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryId: string]: number } } };
  analyticsData: {
    totalTimeThisWeek: number;
    goalCompletionRate: number;
    activeStreaks: number;
    categoriesTracked: number;
  };
  isLoading: boolean;
  error: any;
}

export const useOptimizedDashboardData = (): OptimizedDashboardData => {
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useOptimizedActivities();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();

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

  // Memoize all expensive calculations together
  const dashboardData = useMemo(() => {
    if (!activities || !categories) {
      return {
        todayActivities: [],
        weekActivities: [],
        todayTotalTime: 0,
        weekTotalTime: 0,
        parentCategories: [],
        categoryActivityData: {},
        analyticsData: {
          totalTimeThisWeek: 0,
          goalCompletionRate: 0,
          activeStreaks: 0,
          categoriesTracked: 0,
        },
      };
    }

    // Filter activities once for both today and week
    const todayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date_time);
      return activityDate >= dateRanges.startOfToday && activityDate <= dateRanges.endOfToday;
    });

    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date_time);
      return activityDate >= dateRanges.startOfThisWeek && activityDate <= dateRanges.endOfThisWeek;
    });

    // Calculate time totals
    const todayTotalTime = todayActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
    const weekTotalTime = weekActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);

    // Get parent categories once
    const parentCategories = categories.filter(cat => cat.level === 0 && cat.is_active) || [];

    // Calculate category activity data efficiently
    const categoryActivityData: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryId: string]: number } } } = {};

    parentCategories.forEach(category => {
      const allCategoryIds = [category.id, ...(category.children?.map(c => c.id) || [])];
      
      const todayCategoryActivities = todayActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id)
      );
      
      const weekCategoryActivities = weekActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id)
      );

      const dailyTime = todayCategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
      const weeklyTime = weekCategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);

      const subcategoryTimes: { [subcategoryId: string]: number } = {};
      if (category.children) {
        category.children.forEach(subcategory => {
          const subcategoryActivities = weekCategoryActivities.filter(activity => 
            activity.subcategory_id === subcategory.id
          );
          subcategoryTimes[subcategory.id] = subcategoryActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
        });
      }

      categoryActivityData[category.id] = {
        dailyTime,
        weeklyTime,
        subcategoryTimes
      };
    });

    // Calculate analytics data
    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    const categoriesWithGoals = flatCategories.filter(cat => 
      cat.daily_time_goal_minutes || cat.weekly_time_goal_minutes
    );

    let completedGoals = 0;
    categoriesWithGoals.forEach(category => {
      const categoryActivities = weekActivities.filter(activity => 
        activity.category_id === category.id
      );
      const categoryTime = categoryActivities.reduce((sum, activity) => 
        sum + activity.duration_minutes, 0
      );

      if (category.weekly_time_goal_minutes && categoryTime >= category.weekly_time_goal_minutes) {
        completedGoals++;
      }
    });

    const analyticsData = {
      totalTimeThisWeek: Math.round(weekTotalTime / 60 * 10) / 10,
      goalCompletionRate: categoriesWithGoals.length > 0 
        ? Math.round((completedGoals / categoriesWithGoals.length) * 100) 
        : 0,
      activeStreaks: 3, // Placeholder
      categoriesTracked: flatCategories.length
    };

    return {
      todayActivities,
      weekActivities,
      todayTotalTime,
      weekTotalTime,
      parentCategories,
      categoryActivityData,
      analyticsData,
    };
  }, [activities, categories, dateRanges]);

  return {
    ...dashboardData,
    isLoading: activitiesLoading || categoriesLoading,
    error: activitiesError || categoriesError,
  };
};
