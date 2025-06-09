
import { useCachedQuery } from './useCachedQuery';
import { useHabitLogs } from './useHabitLogs';

export const useCachedHabitLogs = () => {
  const { data: fallbackData } = useHabitLogs();

  return useCachedQuery({
    queryKey: ['habit-logs'],
    queryType: 'habit-logs',
    fallbackFn: async () => {
      return fallbackData || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
