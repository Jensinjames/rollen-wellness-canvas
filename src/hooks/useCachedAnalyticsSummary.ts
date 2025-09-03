import { useCachedQuery } from './useCachedQuery';
import { useCachedActivities } from './useCachedActivities';
import { useCachedCategories } from './useCachedCategories';
import { QueryKeys } from './queryKeys';
import { useMemo } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export const useCachedAnalyticsSummary = () => {
  const { data: activities } = useCachedActivities();
  const { data: categories } = useCachedCategories();

  const summaryData = useMemo(() => {
    if (!activities || !categories) return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const todayActivities = activities.filter(a => {
      const date = new Date(a.date_time);
      return date >= todayStart && date <= todayEnd;
    });

    const weekActivities = activities.filter(a => {
      const date = new Date(a.date_time);
      return date >= weekStart && date <= weekEnd;
    });

    return {
      todayTotalTime: todayActivities.reduce((sum, a) => sum + a.duration_minutes, 0),
      weekTotalTime: weekActivities.reduce((sum, a) => sum + a.duration_minutes, 0),
      todayActivityCount: todayActivities.length,
      weekActivityCount: weekActivities.length,
      categoriesWithGoals: categories.filter(c => c.daily_time_goal_minutes || c.weekly_time_goal_minutes).length,
      activeCategories: categories.filter(c => c.is_active).length,
    };
  }, [activities, categories]);

  return useCachedQuery({
    queryKey: [QueryKeys.AnalyticsSummary],
    queryType: QueryKeys.AnalyticsSummary,
    fallbackFn: async () => summaryData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};