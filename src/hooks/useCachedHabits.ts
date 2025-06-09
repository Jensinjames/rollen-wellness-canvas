
import { useCachedQuery } from './useCachedQuery';
import { useHabits } from './useHabits';

export const useCachedHabits = () => {
  const { data: fallbackData } = useHabits();

  return useCachedQuery({
    queryKey: ['habits'],
    queryType: 'habits',
    fallbackFn: async () => {
      return fallbackData || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
