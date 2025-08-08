import { useCachedQuery } from './useCachedQuery';
import { useHabits } from './useHabits';
import { QueryKeys } from './queryKeys';

export const useCachedHabits = () => {
  const { data: fallbackData } = useHabits();

  return useCachedQuery({
    queryKey: [QueryKeys.Habits],
    queryType: QueryKeys.Habits,
    fallbackFn: async () => {
      return fallbackData || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
