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

// Re-export activity types from unified types file
export type { 
  Activity,
  ActivityFormData, 
  ActivitySubmissionData,
  ActivityFilters,
  ActivityUpdateNotification
} from '@/types/activity';

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

export interface AuthFormData {
  email: string;
  password: string;
}

export interface PasswordResetFormData {
  email: string;
}

export interface AuthValidationResult extends ValidationResult {
  passwordStrengthErrors?: string[];
}

export interface AuthServiceResult<T = void> extends ServiceResult<T> {
  requiresEmailConfirmation?: boolean;
}