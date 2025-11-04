import { useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useCategories } from '@/hooks/categories';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export interface CategoryActivityData {
  categoryId: string;
  totalTime: number;
  subcategoryTimes: { [subcategoryId: string]: number };
  dailyTime: number;
  weeklyTime: number;
}

export const useCategoryActivityData = () => {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const categoryActivityData = useMemo(() => {
    if (!activities || !categories) return {};

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today);
    const endOfThisWeek = endOfWeek(today);

    const data: { [categoryId: string]: CategoryActivityData } = {};

    // Initialize data for all parent categories (level 0)
    const parentCategories = categories.filter(cat => cat.level === 0);
    parentCategories.forEach(category => {
      data[category.id] = {
        categoryId: category.id,
        totalTime: 0,
        subcategoryTimes: {},
        dailyTime: 0,
        weeklyTime: 0,
      };
    });

    // Process activities - categories can be parent or child level
    activities.forEach(activity => {
      if (!activity.category_id) {
        return;
      }

      const activityDate = new Date(activity.date_time);
      const duration = activity.duration_minutes;
      
      // Find the category for this activity
      const category = categories.find(c => c.id === activity.category_id);
      if (!category) return;
      
      // Determine parent category ID
      const parentId = category.level === 0 ? category.id : category.parent_id;
      if (!parentId) return;

      // Ensure parent category data exists
      if (!data[parentId]) {
        data[parentId] = {
          categoryId: parentId,
          totalTime: 0,
          subcategoryTimes: {},
          dailyTime: 0,
          weeklyTime: 0,
        };
      }

      // Add to parent category totals
      data[parentId].totalTime += duration;
      
      // Track subcategory time if this is a child category
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

    return data;
  }, [activities, categories]);

  return categoryActivityData;
};
