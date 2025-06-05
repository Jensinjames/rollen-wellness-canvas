
import { Category } from '@/hooks/useCategories';

export const validateCategoryData = (
  categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>,
  isSubcategory: boolean,
  existingCategories: Category[] = []
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Basic validation
  if (!categoryData.name?.trim()) {
    errors.push('Category name is required');
  }

  // Check for duplicate names in the same parent scope
  if (categoryData.name?.trim()) {
    const duplicateExists = existingCategories.some(existing => {
      // Same name check
      if (existing.name.toLowerCase() !== categoryData.name.toLowerCase()) {
        return false;
      }
      
      // Same parent scope check
      if (isSubcategory) {
        return existing.parent_id === categoryData.parent_id;
      } else {
        return existing.parent_id === null;
      }
    });

    if (duplicateExists) {
      if (isSubcategory) {
        errors.push('A subcategory with this name already exists under this parent');
      } else {
        errors.push('A top-level category with this name already exists');
      }
    }
  }

  // Color validation
  const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
  if (!hexColorRegex.test(categoryData.color)) {
    errors.push('Color must be a valid 6-digit hex code');
  }

  // Goal type validation
  if (!['time', 'boolean', 'both'].includes(categoryData.goal_type)) {
    errors.push('Goal type must be time, boolean, or both');
  }

  // Time goals validation (only if goal_type includes 'time')
  if (categoryData.goal_type === 'time' || categoryData.goal_type === 'both') {
    if (categoryData.daily_time_goal_minutes !== undefined && categoryData.daily_time_goal_minutes <= 0) {
      errors.push('Daily time goal must be greater than 0 minutes');
    }
    if (categoryData.weekly_time_goal_minutes !== undefined && categoryData.weekly_time_goal_minutes <= 0) {
      errors.push('Weekly time goal must be greater than 0 minutes');
    }
  }

  // Boolean goals validation (only if goal_type includes 'boolean')
  if (categoryData.goal_type === 'boolean' || categoryData.goal_type === 'both') {
    if (categoryData.is_boolean_goal && !categoryData.boolean_goal_label?.trim()) {
      errors.push('Boolean goal label is required when completion tracking is enabled');
    }
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
    goal_type: categoryData.goal_type,
    is_boolean_goal: categoryData.is_boolean_goal,
    isSubcategory: categoryData.level === 1,
    hasParent: !!categoryData.parent_id,
    timestamp: new Date().toISOString()
  });
};
