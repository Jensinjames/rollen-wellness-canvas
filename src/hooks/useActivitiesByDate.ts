
import { useMemo } from "react";
import { useActivities } from "@/hooks/useActivities";
import { ActivityFilters } from "@/hooks/useActivityFilters";
import { format } from "date-fns";

export const useActivitiesByDate = (filters: ActivityFilters) => {
  const { data: activities, isLoading } = useActivities();

  const activitiesByDate = useMemo(() => {
    if (!activities) return {};

    // Filter activities based on filters
    const filteredActivities = activities.filter(activity => {
      // Category filter
      if (filters.categoryIds.length > 0) {
        if (!filters.categoryIds.includes(activity.category_id)) {
          return false;
        }
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = activity.name.toLowerCase().includes(searchLower);
        const matchesNotes = activity.notes?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesNotes) {
          return false;
        }
      }

      return true;
    });

    // Group by date
    const groupedByDate: Record<string, typeof filteredActivities> = {};
    
    filteredActivities.forEach(activity => {
      const dateKey = format(new Date(activity.date_time), 'yyyy-MM-dd');
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(activity);
    });

    return groupedByDate;
  }, [activities, filters]);

  return {
    activitiesByDate,
    isLoading,
  };
};
