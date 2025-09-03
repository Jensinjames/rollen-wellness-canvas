
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

  // Enhanced parent categories filtering with comprehensive validation
  const parentCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      console.warn('Categories data is invalid:', { 
        categories,
        isArray: Array.isArray(categories),
        type: typeof categories
      });
      return [];
    }
    
    const validParents = categories.filter(cat => 
      cat && 
      typeof cat === 'object' && 
      cat.id &&
      cat.name &&
      typeof cat.name === 'string' &&
      cat.name.trim() !== '' &&
      cat.level === 0 && 
      cat.is_active !== false
    );
    
    console.log('Dashboard parent categories:', {
      totalCategories: categories.length,
      validParents: validParents.length,
      parentNames: validParents.map(p => p.name)
    });
    
    return validParents;
  }, [categories]);

  // Enhanced category activity data processing with better validation
  const categoryActivityData = useMemo(() => {
    if (!activities || !categories || !Array.isArray(activities) || !Array.isArray(categories)) {
      console.warn('Invalid activity or category data for processing:', { 
        activitiesType: typeof activities, 
        categoriesType: typeof categories,
        activitiesIsArray: Array.isArray(activities),
        categoriesIsArray: Array.isArray(categories),
        activitiesLength: activities?.length,
        categoriesLength: categories?.length
      });
      return {};
    }

    const data: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryId: string]: number } } } = {};

    parentCategories.forEach(category => {
      if (!category?.id || !category?.name) {
        console.warn('Invalid category in parentCategories:', category);
        return;
      }
      
      // Get all category and subcategory IDs for this parent category with validation
      const allCategoryIds = [
        category.id, 
        ...(category.children?.map(c => c?.id).filter(id => id && typeof id === 'string') || [])
      ];
      
      // Enhanced activity filtering with validation
      const todayCategoryActivities = todayActivities.filter(activity => 
        activity && 
        activity.duration_minutes &&
        typeof activity.duration_minutes === 'number' &&
        activity.duration_minutes > 0 &&
        (allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id))
      );
      
      const weekCategoryActivities = weekActivities.filter(activity => 
        activity && 
        activity.duration_minutes &&
        typeof activity.duration_minutes === 'number' &&
        activity.duration_minutes > 0 &&
        (allCategoryIds.includes(activity.category_id) || allCategoryIds.includes(activity.subcategory_id))
      );

      // Calculate daily and weekly totals with safety checks
      const dailyTime = todayCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);
      const weeklyTime = weekCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);

      // Enhanced subcategory breakdown with validation
      const subcategoryTimes: { [subcategoryId: string]: number } = {};
      if (category.children && Array.isArray(category.children)) {
        category.children.forEach(subcategory => {
          if (subcategory?.id && subcategory?.name) {
            const subcategoryActivities = weekCategoryActivities.filter(activity => 
              activity?.subcategory_id === subcategory.id
            );
            const subTime = subcategoryActivities.reduce((sum, activity) => 
              sum + (activity.duration_minutes || 0), 0);
            if (subTime > 0) {
              subcategoryTimes[subcategory.id] = subTime;
            }
          }
        });
      }

      data[category.id] = {
        dailyTime,
        weeklyTime,
        subcategoryTimes
      };
    });

    console.log('Dashboard category activity data processed:', {
      categoriesProcessed: Object.keys(data).length,
      sampleData: Object.keys(data).slice(0, 2).map(id => ({
        categoryId: id,
        dailyTime: data[id].dailyTime,
        weeklyTime: data[id].weeklyTime,
        subcategoryCount: Object.keys(data[id].subcategoryTimes).length
      }))
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
