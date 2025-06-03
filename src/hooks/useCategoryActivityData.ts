
import { useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useCategories } from '@/hooks/useCategories';
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

    // Initialize data for all categories
    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    flatCategories.forEach(category => {
      if (!data[category.id]) {
        data[category.id] = {
          categoryId: category.id,
          totalTime: 0,
          subcategoryTimes: {},
          dailyTime: 0,
          weeklyTime: 0,
        };
      }
    });

    // Process activities
    activities.forEach(activity => {
      const activityDate = new Date(activity.date_time);
      const duration = activity.duration_minutes;

      // Find the activity's category
      const activityCategory = flatCategories.find(cat => cat.id === activity.category_id);
      if (!activityCategory) return;

      // Determine if this is a subcategory activity
      if (activityCategory.parent_id) {
        // This is a subcategory activity
        const parentId = activityCategory.parent_id;
        
        // Add to parent category data
        if (!data[parentId]) {
          data[parentId] = {
            categoryId: parentId,
            totalTime: 0,
            subcategoryTimes: {},
            dailyTime: 0,
            weeklyTime: 0,
          };
        }
        
        data[parentId].totalTime += duration;
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
      } else {
        // This is a top-level category activity
        if (!data[activity.category_id]) {
          data[activity.category_id] = {
            categoryId: activity.category_id,
            totalTime: 0,
            subcategoryTimes: {},
            dailyTime: 0,
            weeklyTime: 0,
          };
        }

        data[activity.category_id].totalTime += duration;

        // Add daily time
        if (activityDate >= startOfToday && activityDate <= endOfToday) {
          data[activity.category_id].dailyTime += duration;
        }

        // Add weekly time
        if (activityDate >= startOfThisWeek && activityDate <= endOfThisWeek) {
          data[activity.category_id].weeklyTime += duration;
        }
      }
    });

    return data;
  }, [activities, categories]);

  return categoryActivityData;
};
