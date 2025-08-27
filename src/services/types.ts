/**
 * Shared service layer types
 */

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ActivityFormData {
  category_id: string;
  subcategory_id: string;
  date_time: string;
  duration_minutes: number;
  is_completed?: boolean;
  notes?: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  parent_id: string;
  level: number;
  goal_type: 'time' | 'boolean' | 'both';
  is_boolean_goal: boolean;
  boolean_goal_label: string;
  daily_time_goal_minutes: number | undefined;
  weekly_time_goal_minutes: number | undefined;
}

export interface ActivitySubmissionData {
  category_id: string;
  subcategory_id: string;
  name: string;
  date_time: string;
  duration_minutes: number;
  is_completed: boolean;
  notes?: string;
}