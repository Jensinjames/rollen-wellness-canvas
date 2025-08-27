/**
 * Activity form validation logic
 * @deprecated Use ValidationService from @/services instead
 * This file is kept for backward compatibility but should be migrated to use the service layer
 */

import { validateTextInput, validateNumber } from "@/utils/validation";

// Re-export the service types for backward compatibility
export type { ActivityFormData } from '@/services/types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * @deprecated Use ValidationService.validateActivity instead
 */
export const validateActivityForm = (
  data: import('@/services/types').ActivityFormData,
  goalType: string,
  parentCategories: any[],
  availableSubcategories: any[]
): ValidationResult => {
  // Validate colors
  const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
  
  const parentCategory = parentCategories.find(cat => cat.id === data.category_id);
  const subcategory = availableSubcategories.find(sub => sub.id === data.subcategory_id);
  
  if (!parentCategory || !hexColorRegex.test(parentCategory.color)) {
    return {
      isValid: false,
      error: `Parent category color is invalid: ${parentCategory?.color || 'missing'}`
    };
  }
  
  if (!subcategory || !hexColorRegex.test(subcategory.color)) {
    return {
      isValid: false,
      error: `Subcategory color is invalid: ${subcategory?.color || 'missing'}`
    };
  }

  // Validate goal requirements
  if (goalType === 'time') {
    if (data.duration_minutes <= 0) {
      return {
        isValid: false,
        error: "Duration must be greater than 0 minutes for time-based goals"
      };
    }
  } else if (goalType === 'boolean') {
    if (!data.is_completed) {
      return {
        isValid: false,
        error: "You must mark this activity as complete for boolean-based goals"
      };
    }
  } else if (goalType === 'both') {
    if (data.duration_minutes <= 0 && !data.is_completed) {
      return {
        isValid: false,
        error: "Either enter a duration or mark as complete"
      };
    }
  }

  // Validate notes if provided
  if (data.notes) {
    const notesValidation = validateTextInput(data.notes, { maxLength: 1000 });
    if (!notesValidation.isValid) {
      return {
        isValid: false,
        error: notesValidation.error
      };
    }
  }

  // Validate duration
  const durationValidation = validateNumber(data.duration_minutes, { 
    min: 0, 
    max: 1440, 
    integer: true, 
    required: goalType === 'time' 
  });
  if (!durationValidation.isValid) {
    return {
      isValid: false,
      error: durationValidation.error
    };
  }

  return { isValid: true };
};