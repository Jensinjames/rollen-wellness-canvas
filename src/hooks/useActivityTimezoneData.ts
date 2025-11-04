import { useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useCategories } from '@/hooks/categories';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek,
  differenceInMinutes,
  addMinutes
} from 'date-fns';

export interface TimezoneActivityData {
  categoryId: string;
  totalTime: number;
  subcategoryTimes: { [subcategoryId: string]: number };
  dailyTime: number;
  weeklyTime: number;
  todayRemaining: number;
  dailyGoalProgress: number;
  weeklyGoalProgress: number;
}

export const useActivityTimezoneData = () => {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const timezoneActivityData = useMemo(() => {
    if (!activities || !categories) return {};

    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const startOfThisWeek = startOfWeek(now);
    const endOfThisWeek = endOfWeek(now);

    const data: { [categoryId: string]: TimezoneActivityData } = {};

    // Initialize data for all parent categories
    const parentCategories = categories.filter(cat => cat.level === 0);
    parentCategories.forEach(category => {
      data[category.id] = {
        categoryId: category.id,
        totalTime: 0,
        subcategoryTimes: {},
        dailyTime: 0,
        weeklyTime: 0,
        todayRemaining: category.daily_time_goal_minutes || 0,
        dailyGoalProgress: 0,
        weeklyGoalProgress: 0,
      };
    });

    // Process activities
    activities.forEach(activity => {
      if (!activity.category_id) return;

      const activityDate = new Date(activity.date_time);
      const duration = activity.duration_minutes;
      
      // Find parent category (level 0) for this activity
      const category = categories.find(c => c.id === activity.category_id);
      if (!category) return;
      
      const parentId = category.level === 0 ? category.id : category.parent_id;
      if (!parentId || !data[parentId]) return;

      // Add to parent category totals
      data[parentId].totalTime += duration;
      
      // Track subcategory time if this is a subcategory
      if (category.level === 1) {
        data[parentId].subcategoryTimes[activity.category_id] = 
          (data[parentId].subcategoryTimes[activity.category_id] || 0) + duration;
      }

      // Add daily time
      if (activityDate >= startOfToday && activityDate <= endOfToday) {
        data[parentId].dailyTime += duration;
      }

      // Add weekly time
      if (activityDate >= startOfThisWeek && activityDate <= endOfThisWeek) {
        data[parentId].weeklyTime += duration;
      }
    });

    // Calculate progress and remaining time
    parentCategories.forEach(category => {
      const categoryData = data[category.id];
      
      // Calculate daily progress
      if (category.daily_time_goal_minutes) {
        categoryData.dailyGoalProgress = Math.round(
          (categoryData.dailyTime / category.daily_time_goal_minutes) * 100
        );
        categoryData.todayRemaining = Math.max(
          0, 
          category.daily_time_goal_minutes - categoryData.dailyTime
        );
      }

      // Calculate weekly progress
      if (category.weekly_time_goal_minutes) {
        categoryData.weeklyGoalProgress = Math.round(
          (categoryData.weeklyTime / category.weekly_time_goal_minutes) * 100
        );
      }
    });

    return data;
  }, [activities, categories]);

  // Calculate time remaining in current day
  const timeRemainingToday = useMemo(() => {
    const now = new Date();
    const endOfToday = endOfDay(now);
    return differenceInMinutes(endOfToday, now);
  }, []);

  return {
    timezoneActivityData,
    timeRemainingToday,
    refreshTimestamp: new Date().toISOString(),
  };
};
