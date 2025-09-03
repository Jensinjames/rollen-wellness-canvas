import { useCachedQuery } from './useCachedQuery';
import { useCategories } from './categories/useCategoryQueries';
import { buildCategoryTree } from './categories/utils';
import { QueryKeys } from './queryKeys';

export const useCachedCategories = () => {
  const { data: fallbackData } = useCategories();

  return useCachedQuery({
    queryKey: [QueryKeys.Categories],
    queryType: QueryKeys.Categories,
    fallbackFn: async () => {
      // Process the raw categories into the tree structure
      const rawCategories = fallbackData || [];
      return buildCategoryTree(rawCategories);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
