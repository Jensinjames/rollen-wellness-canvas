
// Phase 2: Synchronized validation functions with client-side
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

export const validateCategoryFields = (body: any): string[] => {
  const validationErrors: string[] = [];
  const {
    id,
    name,
    color,
    description,
    goal_type,
    boolean_goal_label,
    daily_time_goal_minutes,
    weekly_time_goal_minutes,
    sort_order,
    level
  } = body;

  // Required field validation
  if (!id) {
    validationErrors.push('Category ID is required');
  }

  // Phase 2: Synchronized validation rules with client-side
  if (color !== undefined && !validateHexColor(color)) {
    validationErrors.push('Color must be a valid 6-digit hex code (e.g., #FF0000)');
  }

  if (goal_type !== undefined && !validateGoalType(goal_type)) {
    validationErrors.push('Goal type must be one of: time, boolean, both');
  }

  if (name !== undefined && !validateString(name, 1, 100)) {
    validationErrors.push('Name must be between 1 and 100 characters');
  }

  if (description !== undefined && description !== null && !validateString(description, 0, 500)) {
    validationErrors.push('Description must be no more than 500 characters');
  }

  if (boolean_goal_label !== undefined && boolean_goal_label !== null && !validateString(boolean_goal_label, 0, 100)) {
    validationErrors.push('Boolean goal label must be no more than 100 characters');
  }

  // Time goal validation with synchronized ranges
  if (daily_time_goal_minutes !== undefined && daily_time_goal_minutes !== null && 
      !validateNumber(daily_time_goal_minutes, 0, 1440)) {
    validationErrors.push('Daily time goal must be between 0 and 1440 minutes (24 hours)');
  }

  if (weekly_time_goal_minutes !== undefined && weekly_time_goal_minutes !== null && 
      !validateNumber(weekly_time_goal_minutes, 0, 10080)) {
    validationErrors.push('Weekly time goal must be between 0 and 10080 minutes (7 days)');
  }

  if (sort_order !== undefined && sort_order !== null && 
      !validateNumber(sort_order, 0, 999)) {
    validationErrors.push('Sort order must be between 0 and 999');
  }

  if (level !== undefined && level !== null && 
      !validateNumber(level, 0, 1)) {
    validationErrors.push('Level must be 0 (top-level) or 1 (subcategory)');
  }

  return validationErrors;
};
