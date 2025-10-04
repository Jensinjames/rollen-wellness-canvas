
import { useMemo } from 'react';
import { useActivities, Activity } from '@/hooks/useActivities';
import { ActivityFilters } from '@/hooks/useActivityFilters';
import { format, isWithinInterval, parseISO } from 'date-fns';

export const useActivitiesByDate = (filters: ActivityFilters) => {
  const { data: activities, isLoading } = useActivities();

  const activitiesByDate = useMemo(() => {
    if (!activities) return {};

    const filtered = activities.filter((activity) => {
      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const activityDate = parseISO(activity.date_time);
        const isInRange = isWithinInterval(activityDate, {
          start: filters.dateRange.from,
          end: filters.dateRange.to,
        });
        if (!isInRange) return false;
      }

      // Category filter
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        if (!filters.categoryIds.includes(activity.category_id)) {
          return false;
        }
      }

      // Subcategory filter - skip for now as subcategory_id doesn't exist
      // if (filters.subcategoryIds && filters.subcategoryIds.length > 0) {
      //   // Filter by subcategory via category relationship
      // }

      return true;
    });

    // Group activities by date
    const grouped: { [key: string]: Activity[] } = {};
    
    filtered.forEach((activity) => {
      const dateKey = format(parseISO(activity.date_time), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  }, [activities, filters]);

  return { activitiesByDate, isLoading };
};
