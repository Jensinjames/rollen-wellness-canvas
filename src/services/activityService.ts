/**
 * Activity business logic service
 * Handles all activity-related business operations
 */

import { format } from 'date-fns';
import { validateActivityForm, sanitizeActivityData } from './validation';
import { ActivityFormData, ActivitySubmissionData, ServiceResult } from './types';
import { logResourceEvent } from '@/utils/auditLog';

export class ActivityService {
  /**
   * Create default form data for activity entry
   */
  static createDefaultFormData(preselectedCategoryId?: string): ActivityFormData {
    return {
      category_id: preselectedCategoryId || "",
      subcategory_id: "",
      date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: 30,
      is_completed: false,
      notes: "",
    };
  }

  /**
   * Process form data into submission format
   */
  static prepareSubmissionData(
    formData: ActivityFormData,
    goalType: string,
    parentCategories: any[],
    availableSubcategories: any[]
  ): ServiceResult<ActivitySubmissionData> {
    // Sanitize input data
    const sanitizedData = sanitizeActivityData(formData);

    // Validate the form data
    const validation = validateActivityForm(
      sanitizedData, 
      goalType, 
      parentCategories, 
      availableSubcategories
    );

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Find category and subcategory details
    const selectedParentCategory = parentCategories.find(cat => cat.id === sanitizedData.category_id);
    const selectedSubcategory = availableSubcategories.find(sub => sub.id === sanitizedData.subcategory_id);

    if (!selectedParentCategory || !selectedSubcategory) {
      return {
        success: false,
        error: 'Invalid category or subcategory selection'
      };
    }

    // Transform data for submission
    const submissionData: ActivitySubmissionData = {
      category_id: sanitizedData.category_id,
      subcategory_id: sanitizedData.subcategory_id,
      name: `${selectedParentCategory.name} - ${selectedSubcategory.name}`,
      date_time: new Date(sanitizedData.date_time).toISOString(),
      duration_minutes: goalType === 'boolean' && !sanitizedData.duration_minutes ? 0 : sanitizedData.duration_minutes,
      is_completed: sanitizedData.is_completed || false,
      notes: sanitizedData.notes || undefined,
    };

    return {
      success: true,
      data: submissionData
    };
  }

  /**
   * Log activity creation event
   */
  static logActivityCreation(
    userId: string,
    submissionData: ActivitySubmissionData,
    goalType: string
  ): void {
    logResourceEvent('activity.create', userId, submissionData.category_id, {
      subcategory_id: submissionData.subcategory_id,
      duration_minutes: submissionData.duration_minutes,
      is_completed: submissionData.is_completed,
      goal_type: goalType,
    });
  }

  /**
   * Validate form state for submission readiness
   */
  static isFormReady(
    formData: ActivityFormData,
    goalType: string,
    parentCategories: any[],
    availableSubcategories: any[],
    loading: boolean
  ): boolean {
    if (loading) return false;
    if (!formData.category_id || availableSubcategories.length === 0) return false;

    const validation = validateActivityForm(
      formData, 
      goalType, 
      parentCategories, 
      availableSubcategories
    );

    return validation.isValid;
  }

  /**
   * Get goal-specific default values when goal type changes
   */
  static getGoalTypeDefaults(goalType: string, currentValues: Partial<ActivityFormData>) {
    const updates: Partial<ActivityFormData> = {};

    if (goalType === 'boolean') {
      updates.duration_minutes = 0;
    } else if (goalType === 'time') {
      updates.is_completed = false;
      if (!currentValues.duration_minutes || currentValues.duration_minutes === 0) {
        updates.duration_minutes = 30;
      }
    }

    return updates;
  }

  /**
   * Get category relationship data
   */
  static getCategoryRelationships(categories: any[], selectedCategoryId: string) {
    const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];
    const selectedParentCategory = parentCategories.find(cat => cat.id === selectedCategoryId);
    const availableSubcategories = selectedParentCategory?.children?.filter(sub => sub.is_active) || [];

    return {
      parentCategories,
      selectedParentCategory,
      availableSubcategories
    };
  }

  /**
   * Get boolean goal label with fallback
   */
  static getBooleanGoalLabel(selectedSubcategory?: any): string {
    return selectedSubcategory?.boolean_goal_label || "Mark as Complete";
  }
}