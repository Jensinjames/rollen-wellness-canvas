
import { useCachedQuery } from './useCachedQuery';
import { useCategories } from './categories';
import { buildCategoryTree } from './categories/utils';

export const useCachedCategories = () => {
  const { data: fallbackData } = useCategories();

  return useCachedQuery({
    queryKey: ['categories'],
    queryType: 'categories',
    fallbackFn: async () => {
      // Process the raw categories into the tree structure
      const rawCategories = fallbackData || [];
      return buildCategoryTree(rawCategories);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
