/**
 * Validation Service - Functional Implementation
 * Phase 2: Converted from class-based to functional pattern, unified with validation module
 */

import { 
  validateCategoryName, 
  validateHexColor, 
  validateNumber, 
  validateNotes,
  validateEmail,
  validateTextInput,
  validatePassword,
  NumberValidationResult,
  ValidationResult as BaseValidationResult
} from '@/validation';
import { ActivityFormData, CategoryFormData, ValidationResult, AuthFormData, PasswordResetFormData, AuthValidationResult } from './types';

// ============= Activity Validation =============
export const validateActivityForm = (
  data: ActivityFormData, 
  goalType: string, 
  parentCategories: any[], 
  availableSubcategories: any[]
): ValidationResult => {
  const errors: string[] = [];

  // Category validation
  if (!data.category_id?.trim()) {
    errors.push('Parent category is required');
  } else {
    const categoryExists = parentCategories.find(cat => cat.id === data.category_id);
    if (!categoryExists) {
      errors.push('Selected parent category does not exist');
    }
  }

  // Subcategory validation
  if (!data.subcategory_id?.trim()) {
    errors.push('Subcategory is required');
  } else {
    const subcategoryExists = availableSubcategories.find(sub => sub.id === data.subcategory_id);
    if (!subcategoryExists) {
      errors.push('Selected subcategory does not exist');
    }
  }

  // Date time validation
  if (!data.date_time?.trim()) {
    errors.push('Date and time is required');
  } else {
    const dateTime = new Date(data.date_time);
    if (isNaN(dateTime.getTime())) {
      errors.push('Invalid date and time format');
    }
  }

  // Duration validation based on goal type
  const durationValidation = validateActivityDuration(data.duration_minutes, goalType);
  if (!durationValidation.isValid) {
    errors.push(durationValidation.error || 'Invalid duration');
  }

  // Notes validation
  if (data.notes) {
    const notesValidation = validateNotes(data.notes);
    if (!notesValidation.isValid) {
      errors.push(notesValidation.error || 'Invalid notes');
    }
  }

  // Goal-specific validation
  if (goalType === 'boolean' && !data.is_completed && (!data.duration_minutes || data.duration_minutes === 0)) {
    errors.push('For completion-based goals, either mark as complete or provide a duration');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateActivityDuration = (duration: number, goalType: string): NumberValidationResult => {
  if (goalType === 'boolean') {
    // For boolean goals, duration can be 0 or undefined
    return { isValid: true, value: duration || 0 };
  }

  // For time-based goals, validate duration
  return validateNumber(duration, { 
    min: 0, 
    max: 1440, 
    integer: true, 
    required: true,
    fieldName: 'duration'
  });
};

// ============= Category Validation =============
export const validateCategoryForm = (
  categoryData: CategoryFormData,
  isSubcategory: boolean,
  existingCategories: any[] = [],
  currentId: string | null = null
): ValidationResult => {
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

// ============= Authentication Validation =============
export const validateSignInForm = (data: AuthFormData): AuthValidationResult => {
  const errors: string[] = [];

  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email address');
  }

  // Password validation
  const passwordValidation = validateTextInput(data.password, {
    minLength: 1,
    maxLength: 128,
    fieldName: 'password'
  });

  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error || 'Invalid password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSignUpForm = (data: AuthFormData): AuthValidationResult => {
  const errors: string[] = [];

  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email address');
  }

  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error || 'Password does not meet security requirements');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePasswordResetForm = (data: PasswordResetFormData): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email address');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============= Data Sanitization =============
export const sanitizeActivityData = (data: ActivityFormData): ActivityFormData => {
  return {
    ...data,
    category_id: data.category_id?.trim() || '',
    subcategory_id: data.subcategory_id?.trim() || '',
    date_time: data.date_time?.trim() || '',
    notes: data.notes?.trim() || undefined
  };
};

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

export const sanitizeAuthData = (data: AuthFormData): { email: string; password: string } => {
  const emailValidation = validateEmail(data.email);
  return {
    email: emailValidation.sanitized || data.email.trim(),
    password: data.password // Don't sanitize password content
  };
};