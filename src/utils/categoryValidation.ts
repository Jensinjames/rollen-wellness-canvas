
/**
 * Enhanced category validation utilities
 * Phase 2: Synchronized with server-side validation rules
 */

export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CategoryUpdatePayload {
  id: string;
  name?: string;
  color?: string;
  description?: string | null;
  goal_type?: 'time' | 'boolean' | 'both';
  is_boolean_goal?: boolean;
  boolean_goal_label?: string | null;
  daily_time_goal_minutes?: number | null;
  weekly_time_goal_minutes?: number | null;
  is_active?: boolean;
  sort_order?: number | null;
  parent_id?: string | null;
  level?: number | null;
}

// Phase 2: Synchronized validation functions with server-side
export const validateHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export const validateGoalType = (goalType: string): boolean => {
  return ['time', 'boolean', 'both'].includes(goalType);
};

export const validateString = (value: string, minLength = 1, maxLength = 100): boolean => {
  return typeof value === 'string' && 
         value.trim().length >= minLength && 
         value.trim().length <= maxLength;
};

export const validateNumber = (value: number, min = 0, max = Number.MAX_SAFE_INTEGER): boolean => {
  return typeof value === 'number' && 
         !isNaN(value) && 
         value >= min && 
         value <= max;
};

export const validateCategoryUpdatePayload = (payload: CategoryUpdatePayload): CategoryValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!payload.id) {
    errors.push('Category ID is required');
  }

  // Phase 2: Synchronized validation rules with exact server-side error messages
  if (payload.color !== undefined && !validateHexColor(payload.color)) {
    errors.push('Color must be a valid 6-digit hex code (e.g., #FF0000)');
  }

  if (payload.goal_type !== undefined && !validateGoalType(payload.goal_type)) {
    errors.push('Goal type must be one of: time, boolean, both');
  }

  if (payload.name !== undefined && !validateString(payload.name, 1, 100)) {
    errors.push('Name must be between 1 and 100 characters');
  }

  if (payload.description !== undefined && payload.description !== null && 
      !validateString(payload.description, 0, 500)) {
    errors.push('Description must be no more than 500 characters');
  }

  if (payload.boolean_goal_label !== undefined && payload.boolean_goal_label !== null && 
      !validateString(payload.boolean_goal_label, 0, 100)) {
    errors.push('Boolean goal label must be no more than 100 characters');
  }

  // Phase 2: Synchronized time goal validation with exact ranges
  if (payload.daily_time_goal_minutes !== undefined && payload.daily_time_goal_minutes !== null && 
      !validateNumber(payload.daily_time_goal_minutes, 0, 1440)) {
    errors.push('Daily time goal must be between 0 and 1440 minutes (24 hours)');
  }

  if (payload.weekly_time_goal_minutes !== undefined && payload.weekly_time_goal_minutes !== null && 
      !validateNumber(payload.weekly_time_goal_minutes, 0, 10080)) {
    errors.push('Weekly time goal must be between 0 and 10080 minutes (7 days)');
  }

  if (payload.sort_order !== undefined && payload.sort_order !== null && 
      !validateNumber(payload.sort_order, 0, 999)) {
    errors.push('Sort order must be between 0 and 999');
  }

  if (payload.level !== undefined && payload.level !== null && 
      !validateNumber(payload.level, 0, 1)) {
    errors.push('Level must be 0 (top-level) or 1 (subcategory)');
  }

  // Cross-field validation
  if (payload.goal_type === 'boolean' && payload.is_boolean_goal === true && 
      (!payload.boolean_goal_label || payload.boolean_goal_label.trim() === '')) {
    errors.push('Boolean goal label is required when completion tracking is enabled');
  }

  // Warnings for potentially problematic combinations
  if (payload.parent_id && payload.level === 0) {
    warnings.push('Top-level categories (level 0) should not have a parent');
  }

  if (!payload.parent_id && payload.level === 1) {
    warnings.push('Subcategories (level 1) should have a parent category');
  }

  if (payload.daily_time_goal_minutes && payload.weekly_time_goal_minutes && 
      payload.daily_time_goal_minutes * 7 > payload.weekly_time_goal_minutes) {
    warnings.push('Daily goal × 7 exceeds weekly goal, which may be unrealistic');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Phase 2: Enhanced sanitization utility with consistent logic
export const sanitizeCategoryPayload = (payload: CategoryUpdatePayload): CategoryUpdatePayload => {
  const sanitized: CategoryUpdatePayload = { ...payload };

  // Sanitize string fields with consistent trimming
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim();
  }
  
  if (sanitized.color) {
    sanitized.color = sanitized.color.trim().toUpperCase(); // Match server normalization
  }
  
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim() || null;
  }
  
  if (sanitized.boolean_goal_label) {
    sanitized.boolean_goal_label = sanitized.boolean_goal_label.trim() || null;
  }

  // Handle parent_id normalization consistently with server
  if (sanitized.parent_id === 'none' || sanitized.parent_id === '') {
    sanitized.parent_id = null;
  }

  return sanitized;
};
