/**
 * Category validation logic
 * @deprecated Use CategoryService and ValidationService from @/services instead
 * This file is kept for backward compatibility but should be migrated to use the service layer
 */

import { Category } from '@/hooks/categories';
import { ValidationService } from '@/services';

/**
 * @deprecated Use ValidationService.validateCategory instead
 */
export const validateCategoryData = (
  categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>,
  isSubcategory: boolean,
  existingCategories: Category[] = [],
  currentId: string | null = null
): { isValid: boolean; errors: string[] } => {
  // Convert to service format and use ValidationService
  const formData = {
    name: categoryData.name,
    color: categoryData.color,
    description: categoryData.description || '',
    is_active: categoryData.is_active,
    sort_order: categoryData.sort_order,
    parent_id: categoryData.parent_id || 'none',
    level: categoryData.level,
    goal_type: categoryData.goal_type,
    is_boolean_goal: categoryData.is_boolean_goal,
    boolean_goal_label: categoryData.boolean_goal_label || '',
    daily_time_goal_minutes: categoryData.daily_time_goal_minutes,
    weekly_time_goal_minutes: categoryData.weekly_time_goal_minutes,
  };

  const result = ValidationService.validateCategory(
    formData,
    isSubcategory,
    existingCategories,
    currentId
  );

  return {
    isValid: result.isValid,
    errors: result.errors
  };
};

/**
 * @deprecated Use CategoryService.logCategoryOperation instead
 */
export const logCategoryOperation = (operation: 'create' | 'update', categoryData: any, context?: string) => {
};