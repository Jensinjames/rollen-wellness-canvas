/**
 * Unified Category Activity Summary Hook
 * Single source of truth for category activity calculations
 * Eliminates duplication between useDashboardData and useCategoryActivityData
 */

import { useMemo } from 'react';
import { useCachedActivities } from '@/hooks/useCachedActivities';
import { useCachedCategories } from '@/hooks/useCachedCategories';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface CategoryActivitySummary {
  categoryId: string;
  totalTime: number;
  subcategoryTimes: { [subcategoryId: string]: number };
  dailyTime: number;
  weeklyTime: number;
  dailyGoalProgress: number;
  weeklyGoalProgress: number;
  todayRemaining: number;
}

export interface CategoryActivityData {
  [categoryId: string]: CategoryActivitySummary;
}

/**
 * Unified hook for calculating category activity metrics
 * Returns activity data aggregated by parent category with time-based metrics
 */
export const useCategoryActivitySummary = () => {
  const { data: activities, isLoading: activitiesLoading } = useCachedActivities();
  const { data: categories, isLoading: categoriesLoading } = useCachedCategories();

  const categoryActivityData = useMemo(() => {
    if (!activities || !categories) return {};

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today);
    const endOfThisWeek = endOfWeek(today);

    const data: CategoryActivityData = {};

    // Initialize data for all parent categories (level 0)
    const parentCategories = categories.filter(cat => cat.level === 0);
    parentCategories.forEach(category => {
      data[category.id] = {
        categoryId: category.id,
        totalTime: 0,
        subcategoryTimes: {},
        dailyTime: 0,
        weeklyTime: 0,
        dailyGoalProgress: 0,
        weeklyGoalProgress: 0,
        todayRemaining: 0,
      };
    });

    // Process activities - category_id stores the subcategory
    activities.forEach(activity => {
      if (!activity.category_id) return;

      const activityDate = new Date(activity.date_time);
      const duration = activity.duration_minutes;
      
      // Find parent category for this activity's category_id
      const subcategory = categories.find(c => c.id === activity.category_id);
      const parentId = subcategory?.parent_id || activity.category_id;

      // Ensure parent category data exists
      if (!data[parentId]) {
        data[parentId] = {
          categoryId: parentId,
          totalTime: 0,
          subcategoryTimes: {},
          dailyTime: 0,
          weeklyTime: 0,
          dailyGoalProgress: 0,
          weeklyGoalProgress: 0,
          todayRemaining: 0,
        };
      }

      // Add to parent category totals
      data[parentId].totalTime += duration;
      
      // Track subcategory time
      data[parentId].subcategoryTimes[activity.category_id] = 
        (data[parentId].subcategoryTimes[activity.category_id] || 0) + duration;

      // Add daily time
      if (activityDate >= startOfToday && activityDate <= endOfToday) {
        data[parentId].dailyTime += duration;
      }

      // Add weekly time
      if (activityDate >= startOfThisWeek && activityDate <= endOfThisWeek) {
        data[parentId].weeklyTime += duration;
      }
    });

    // Calculate goal progress for each parent category
    parentCategories.forEach(category => {
      const categoryData = data[category.id];
      
      // Daily goal progress
      if (category.daily_time_goal_minutes && category.daily_time_goal_minutes > 0) {
        categoryData.dailyGoalProgress = 
          Math.min(100, (categoryData.dailyTime / category.daily_time_goal_minutes) * 100);
        categoryData.todayRemaining = Math.max(0, category.daily_time_goal_minutes - categoryData.dailyTime);
      }

      // Weekly goal progress
      if (category.weekly_time_goal_minutes && category.weekly_time_goal_minutes > 0) {
        categoryData.weeklyGoalProgress = 
          Math.min(100, (categoryData.weeklyTime / category.weekly_time_goal_minutes) * 100);
      }
    });

    return data;
  }, [activities, categories]);

  return {
    data: categoryActivityData,
    isLoading: activitiesLoading || categoriesLoading,
  };
};
