/**
 * Category Service - Functional Implementation  
 * Phase 2: Converted from class-based to functional pattern
 */

import { validateCategoryName, validateHexColor, validateCategoryPayload } from '@/validation';
import { CategoryFormData, ServiceResult } from './types';

// ============= Form Data Management =============
export const createDefaultCategoryFormData = (
  category?: any,
  forceParent?: any
): CategoryFormData => {
  const isAddingSubcategory = !!forceParent;
  const isEditing = !!category;

  const defaultColor = getDefaultCategoryColor(isEditing, category, isAddingSubcategory, forceParent);
  const defaultParentId = forceParent?.id || (isAddingSubcategory ? '' : 'none');

  return {
    name: category?.name || '',
    color: defaultColor,
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order || 0,
    parent_id: category?.parent_id || defaultParentId,
    level: forceParent ? 1 : (category?.level || 0),
    goal_type: category?.goal_type || 'time',
    is_boolean_goal: category?.is_boolean_goal || false,
    boolean_goal_label: category?.boolean_goal_label || '',
    daily_time_goal_minutes: category?.daily_time_goal_minutes,
    weekly_time_goal_minutes: category?.weekly_time_goal_minutes,
  };
};

// ============= Data Processing =============
export const prepareCategorySubmissionData = (
  formData: CategoryFormData,
  forceParent?: any,
  allCategories: any[] = [],
  currentCategoryId?: string
): ServiceResult<any> => {
  // Sanitize the form data
  const sanitizedData = sanitizeCategoryData(formData);

  const isAddingSubcategory = !!forceParent;
  const isSubcategory = isAddingSubcategory || sanitizedData.parent_id !== 'none';

  // Prepare submission data with proper hierarchy
  const submissionData = {
    ...sanitizedData,
    level: isSubcategory ? 1 : 0,
    parent_id: isSubcategory 
      ? (sanitizedData.parent_id === 'none' ? forceParent?.id : sanitizedData.parent_id) 
      : undefined,
  };

  // Validate the prepared data
  const validation = validateCategoryData(
    submissionData,
    isSubcategory,
    allCategories,
    currentCategoryId || null
  );

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors
    };
  }

  return {
    success: true,
    data: submissionData
  };
};

// ============= Validation =============
/**
 * Validate category data for creation or update
 * @param categoryData - The category data to validate
 * @param isSubcategory - Whether this is a subcategory
 * @param existingCategories - Array of existing categories for duplicate checking
 * @param currentId - ID of the current category (null for new categories)
 */
export const validateCategoryData = (
  categoryData: any,
  isSubcategory: boolean,
  existingCategories: any[] = [],
  currentId: string | null = null
) => {
  const errors: string[] = [];

  // Name validation
  const nameValidation = validateCategoryName(categoryData.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error || 'Category name is invalid');
  }

  // Duplicate name check
  if (categoryData.name?.trim()) {
    const duplicateExists = existingCategories.some(existing => {
      if (currentId && existing.id === currentId) return false;
      if (existing.name.toLowerCase() !== categoryData.name.toLowerCase()) return false;
      
      if (isSubcategory) {
        return existing.parent_id === categoryData.parent_id;
      } else {
        return existing.parent_id === null;
      }
    });

    if (duplicateExists) {
      errors.push(isSubcategory 
        ? 'A subcategory with this name already exists under this parent'
        : 'A top-level category with this name already exists');
    }
  }

  // Color validation
  const colorValidation = validateHexColor(categoryData.color);
  if (!colorValidation.isValid) {
    errors.push(colorValidation.error || 'Color must be a valid 6-digit hex code');
  }

  // Goal type validation
  if (!['time', 'boolean', 'both'].includes(categoryData.goal_type)) {
    errors.push('Goal type must be time, boolean, or both');
  }

  // Time goals validation
  if (categoryData.goal_type === 'time' || categoryData.goal_type === 'both') {
    if (categoryData.daily_time_goal_minutes !== undefined && 
        categoryData.daily_time_goal_minutes !== null && 
        categoryData.daily_time_goal_minutes < 0) {
      errors.push('Daily time goal cannot be negative');
    }
    if (categoryData.weekly_time_goal_minutes !== undefined && 
        categoryData.weekly_time_goal_minutes !== null && 
        categoryData.weekly_time_goal_minutes < 0) {
      errors.push('Weekly time goal cannot be negative');
    }
  }

  // Boolean goals validation
  if (categoryData.goal_type === 'boolean' || categoryData.goal_type === 'both') {
    if (categoryData.is_boolean_goal && !categoryData.boolean_goal_label?.trim()) {
      errors.push('Boolean goal label is required when completion tracking is enabled');
    }
  }

  // Hierarchy validation
  if (isSubcategory) {
    if (!categoryData.parent_id) {
      errors.push('Subcategory must have a parent category');
    }
    if (categoryData.level !== 1) {
      errors.push('Subcategory must have level 1');
    }
  } else {
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

// ============= Data Sanitization =============
export const sanitizeCategoryData = (data: CategoryFormData): CategoryFormData => {
  return {
    ...data,
    name: data.name?.trim() || '',
    color: data.color?.trim().toUpperCase() || '',
    description: data.description?.trim() || '',
    boolean_goal_label: data.boolean_goal_label?.trim() || '',
    parent_id: data.parent_id === 'none' || data.parent_id === '' ? null : data.parent_id
  };
};

// ============= Utility Functions =============
export const getDefaultCategoryColor = (
  isEditing: boolean, 
  category?: any, 
  isAddingSubcategory?: boolean, 
  forceParent?: any
): string => {
  if (isEditing && category?.color) return category.color;
  if (isAddingSubcategory && forceParent?.color) return forceParent.color;
  return '#10B981';
};

export const logCategoryOperation = (
  operation: 'create' | 'update', 
  categoryData: any, 
  context?: string
): void => {
  // Silent logging for production - audit trail handled elsewhere
};

export const isCategoryFormReady = (
  formData: CategoryFormData,
  allCategories: any[],
  currentCategoryId?: string,
  forceParent?: any
): boolean => {
  if (!formData.name?.trim()) return false;

  const isSubcategory = !!forceParent || formData.parent_id !== 'none';
  const validation = validateCategoryData(
    formData,
    isSubcategory,
    allCategories,
    currentCategoryId || null
  );

  return validation.isValid;
};

export const getCategoryOperationContext = (isSubcategory: boolean): string => {
  return isSubcategory ? 'subcategory' : 'top-level category';
};

export const handleCategoryFieldUpdate = (
  field: string,
  value: any,
  currentData: CategoryFormData
): Partial<CategoryFormData> => {
  const updates: Partial<CategoryFormData> = { [field]: value };

  // Handle goal type changes
  if (field === 'goal_type') {
    if (value === 'boolean') {
      updates.daily_time_goal_minutes = undefined;
      updates.weekly_time_goal_minutes = undefined;
    } else if (value === 'time') {
      updates.is_boolean_goal = false;
      updates.boolean_goal_label = '';
    }
  }

  // Handle boolean goal toggle
  if (field === 'is_boolean_goal' && !value) {
    updates.boolean_goal_label = '';
  }

  return updates;
};