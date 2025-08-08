import { useCachedQuery } from './useCachedQuery';
import { useHabitLogs } from './useHabitLogs';
import { QueryKeys } from './queryKeys';

export const useCachedHabitLogs = () => {
  const { data: fallbackData } = useHabitLogs();

  return useCachedQuery({
    queryKey: [QueryKeys.HabitLogs],
    queryType: QueryKeys.HabitLogs,
    fallbackFn: async () => {
      return fallbackData || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
