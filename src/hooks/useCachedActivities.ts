
import { useCachedQuery } from './useCachedQuery';
import { useActivities } from './useActivities';

export const useCachedActivities = () => {
  const { data: fallbackData } = useActivities();

  return useCachedQuery({
    queryKey: ['activities'],
    queryType: 'activities',
    fallbackFn: async () => {
      // Return the fallback data from the original hook
      return fallbackData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
