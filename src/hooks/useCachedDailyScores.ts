
import { useCachedQuery } from './useCachedQuery';
import { useDailyScores } from './useDailyScores';

export const useCachedDailyScores = (limit?: number) => {
  const { data: fallbackData } = useDailyScores(limit);

  return useCachedQuery({
    queryKey: ['daily-scores', limit],
    queryType: 'daily-scores',
    params: limit?.toString(),
    fallbackFn: async () => {
      return fallbackData || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useCachedLatestDailyScore = () => {
  const { data: scores } = useCachedDailyScores(1);
  return scores?.[0] || null;
};
