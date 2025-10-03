import { useCachedQuery } from './useCachedQuery';
import { useActivities } from './useActivities';
import { QueryKeys } from './queryKeys';
import { Activity } from '@/types/activity';

export const useCachedActivities = (): { data: Activity[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data: fallbackData } = useActivities();

  return useCachedQuery<Activity[]>({
    queryKey: [QueryKeys.Activities],
    queryType: QueryKeys.Activities,
    fallbackFn: async () => {
      // Return the fallback data from the original hook
      return fallbackData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
