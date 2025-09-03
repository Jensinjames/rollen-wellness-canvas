import { useCallback } from 'react';
import { useCacheInvalidation } from './useCachedQuery';
import { QueryKeys } from './queryKeys';
import { toast } from 'sonner';

export const useCacheManager = () => {
  const { invalidateCache, invalidateAllUserCache } = useCacheInvalidation();

  const refreshActivityData = useCallback(async () => {
    try {
      await Promise.all([
        invalidateCache(QueryKeys.Activities),
        invalidateCache(QueryKeys.AnalyticsSummary),
        invalidateCache(QueryKeys.CategoryActivityData),
      ]);
      toast.success('Activity data refreshed');
    } catch (error) {
      toast.error('Failed to refresh activity data');
    }
  }, [invalidateCache]);

  const refreshCategoryData = useCallback(async () => {
    try {
      await Promise.all([
        invalidateCache(QueryKeys.Categories),
        invalidateCache(QueryKeys.CategoryActivityData),
      ]);
      toast.success('Category data refreshed');
    } catch (error) {
      toast.error('Failed to refresh category data');
    }
  }, [invalidateCache]);

  const refreshHabitData = useCallback(async () => {
    try {
      await Promise.all([
        invalidateCache(QueryKeys.Habits),
        invalidateCache(QueryKeys.HabitLogs),
      ]);
      toast.success('Habit data refreshed');
    } catch (error) {
      toast.error('Failed to refresh habit data');
    }
  }, [invalidateCache]);

  const refreshAllData = useCallback(async () => {
    try {
      await invalidateAllUserCache();
      toast.success('All data refreshed');
    } catch (error) {
      toast.error('Failed to refresh all data');
    }
  }, [invalidateAllUserCache]);

  return {
    refreshActivityData,
    refreshCategoryData,
    refreshHabitData,
    refreshAllData,
  };
};