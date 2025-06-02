
import { Category } from '@/hooks/useCategories';

export const validateCategoryData = (
  categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>,
  isSubcategory: boolean
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Basic validation
  if (!categoryData.name?.trim()) {
    errors.push('Category name is required');
  }

  // Color validation
  const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
  if (!hexColorRegex.test(categoryData.color)) {
    errors.push('Color must be a valid 6-digit hex code');
  }

  // Subcategory specific validation
  if (isSubcategory) {
    if (!categoryData.parent_id) {
      errors.push('Subcategory must have a parent category');
    }
    if (categoryData.level !== 1) {
      errors.push('Subcategory must have level 1');
    }
  } else {
    // Top-level category validation
    if (categoryData.parent_id) {
      errors.push('Top-level category cannot have a parent');
    }
    if (categoryData.level !== 0) {
      errors.push('Top-level category must have level 0');
    }
  }

  // Time goals validation
  if (categoryData.daily_time_goal_minutes !== undefined && categoryData.daily_time_goal_minutes <= 0) {
    errors.push('Daily time goal must be greater than 0 minutes');
  }
  if (categoryData.weekly_time_goal_minutes !== undefined && categoryData.weekly_time_goal_minutes <= 0) {
    errors.push('Weekly time goal must be greater than 0 minutes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const logCategoryOperation = (operation: 'create' | 'update', categoryData: any, context?: string) => {
  console.log(`[Category ${operation.toUpperCase()}]${context ? ` ${context}` : ''}:`, {
    name: categoryData.name,
    parent_id: categoryData.parent_id,
    level: categoryData.level,
    isSubcategory: categoryData.level === 1,
    hasParent: !!categoryData.parent_id,
    timestamp: new Date().toISOString()
  });
};
