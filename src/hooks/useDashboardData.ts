
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

  // Enhanced category activity data processing with comprehensive validation and subcategory mapping
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

    const data: { [categoryId: string]: { dailyTime: number; weeklyTime: number; subcategoryTimes: { [subcategoryName: string]: number } } } = {};

    parentCategories.forEach(category => {
      if (!category?.id || !category?.name) {
        console.warn('Invalid category in parentCategories:', category);
        return;
      }
      
      // Enhanced subcategory mapping with comprehensive validation
      const subcategoryMap = new Map<string, string>(); // subcategory.id -> subcategory.name
      if (category.children && Array.isArray(category.children)) {
        category.children.forEach(subcategory => {
          if (subcategory?.id && subcategory?.name && typeof subcategory.name === 'string' && subcategory.name.trim() !== '') {
            subcategoryMap.set(subcategory.id, subcategory.name.trim());
          }
        });
      }
      
      // Get all category and subcategory IDs for this parent category with validation
      const allCategoryIds = [
        category.id, 
        ...Array.from(subcategoryMap.keys())
      ];
      
      console.log(`Processing category "${category.name}":`, {
        categoryId: category.id,
        subcategoryCount: subcategoryMap.size,
        subcategoryIds: Array.from(subcategoryMap.keys()),
        subcategoryNames: Array.from(subcategoryMap.values())
      });
      
      // Enhanced activity filtering with validation
      const todayCategoryActivities = todayActivities.filter(activity => 
        activity && 
        activity.duration_minutes &&
        typeof activity.duration_minutes === 'number' &&
        activity.duration_minutes > 0 &&
        (activity.category_id === category.id || subcategoryMap.has(activity.subcategory_id || ''))
      );
      
      const weekCategoryActivities = weekActivities.filter(activity => 
        activity && 
        activity.duration_minutes &&
        typeof activity.duration_minutes === 'number' &&
        activity.duration_minutes > 0 &&
        (activity.category_id === category.id || subcategoryMap.has(activity.subcategory_id || ''))
      );

      // Calculate daily and weekly totals with safety checks
      const dailyTime = todayCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);
      const weeklyTime = weekCategoryActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0);

      // Enhanced subcategory breakdown using subcategory NAMES (not IDs) for chart compatibility
      const subcategoryTimes: { [subcategoryName: string]: number } = {};
      if (subcategoryMap.size > 0) {
        Array.from(subcategoryMap.entries()).forEach(([subcategoryId, subcategoryName]) => {
          const subcategoryActivities = weekCategoryActivities.filter(activity => 
            activity?.subcategory_id === subcategoryId
          );
          const subTime = subcategoryActivities.reduce((sum, activity) => 
            sum + (activity.duration_minutes || 0), 0);
          if (subTime > 0) {
            subcategoryTimes[subcategoryName] = subTime;
          }
        });
      }

      console.log(`Category "${category.name}" data:`, {
        dailyTime,
        weeklyTime,
        subcategoryTimesKeys: Object.keys(subcategoryTimes),
        subcategoryTimesValues: Object.values(subcategoryTimes),
        todayActivitiesCount: todayCategoryActivities.length,
        weekActivitiesCount: weekCategoryActivities.length
      });

      data[category.id] = {
        dailyTime,
        weeklyTime,
        subcategoryTimes
      };
    });

    console.log('Dashboard category activity data processed:', {
      categoriesProcessed: Object.keys(data).length,
      totalSubcategoriesFound: Object.values(data).reduce((sum, cat) => sum + Object.keys(cat.subcategoryTimes).length, 0),
      sampleData: Object.keys(data).slice(0, 2).map(id => ({
        categoryId: id,
        dailyTime: data[id].dailyTime,
        weeklyTime: data[id].weeklyTime,
        subcategoryNames: Object.keys(data[id].subcategoryTimes),
        subcategoryTimes: data[id].subcategoryTimes
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
