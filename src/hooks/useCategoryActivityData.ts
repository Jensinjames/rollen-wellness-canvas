/**
 * @deprecated Use useCategoryActivitySummary from @/hooks/data/useCategoryActivitySummary instead
 * This hook is kept for backward compatibility but will be removed in future versions
 */

import { useCategoryActivitySummary } from '@/hooks/data/useCategoryActivitySummary';

export interface CategoryActivityData {
  categoryId: string;
  totalTime: number;
  subcategoryTimes: { [subcategoryId: string]: number };
  dailyTime: number;
  weeklyTime: number;
}

/**
 * @deprecated Use useCategoryActivitySummary instead
 */
export const useCategoryActivityData = () => {
  const { data } = useCategoryActivitySummary();
  return data;
};
