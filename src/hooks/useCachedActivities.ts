import { useCachedQuery } from './useCachedQuery';
import { useActivities } from './useActivities';
import { QueryKeys } from './queryKeys';

export const useCachedActivities = () => {
  const { data: fallbackData } = useActivities();

  return useCachedQuery({
    queryKey: [QueryKeys.Activities],
    queryType: QueryKeys.Activities,
    fallbackFn: async () => {
      // Return the fallback data from the original hook
      return fallbackData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
