/**
 * Category business logic service
 * Handles all category-related business operations
 */

import { ValidationService } from './validationService';
import { CategoryFormData, ServiceResult } from './types';

export class CategoryService {
  /**
   * Create default form data for category creation/editing
   */
  static createDefaultFormData(
    category?: any,
    forceParent?: any
  ): CategoryFormData {
    const isAddingSubcategory = !!forceParent;
    const isEditing = !!category;

    const defaultColor = this.getDefaultColor(isEditing, category, isAddingSubcategory, forceParent);
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
  }

  /**
   * Process form data for submission
   */
  static prepareSubmissionData(
    formData: CategoryFormData,
    forceParent?: any,
    allCategories: any[] = [],
    currentCategoryId?: string
  ): ServiceResult<any> {
    // Sanitize the form data
    const sanitizedData = ValidationService.sanitizeCategoryData(formData);

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
    const validation = ValidationService.validateCategory(
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
  }

  /**
   * Determine default color based on context
   */
  private static getDefaultColor(
    isEditing: boolean, 
    category?: any, 
    isAddingSubcategory?: boolean, 
    forceParent?: any
  ): string {
    if (isEditing && category?.color) return category.color;
    if (isAddingSubcategory && forceParent?.color) return forceParent.color;
    return '#10B981';
  }

  /**
   * Log category operation for audit trail
   */
  static logCategoryOperation(
    operation: 'create' | 'update', 
    categoryData: any, 
    context?: string
  ): void {
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
  }

  /**
   * Validate form readiness for submission
   */
  static isFormReady(
    formData: CategoryFormData,
    allCategories: any[],
    currentCategoryId?: string,
    forceParent?: any
  ): boolean {
    if (!formData.name?.trim()) return false;

    const isSubcategory = !!forceParent || formData.parent_id !== 'none';
    const validation = ValidationService.validateCategory(
      formData,
      isSubcategory,
      allCategories,
      currentCategoryId || null
    );

    return validation.isValid;
  }

  /**
   * Get context information for operation
   */
  static getOperationContext(isSubcategory: boolean): string {
    return isSubcategory ? 'subcategory' : 'top-level category';
  }

  /**
   * Handle form field updates with side effects
   */
  static handleFieldUpdate(
    field: string,
    value: any,
    currentData: CategoryFormData
  ): Partial<CategoryFormData> {
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
  }
}