/**
 * Consolidated Validation Module
 * Phase 2: Unified validation utilities with consistent interfaces
 */

import { isDevelopment } from '@/utils/environment';
import { securityLogger } from '@/utils/enhancedSecurityLogger';

// ============= Core Types =============
export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

export interface NumberValidationResult {
  isValid: boolean;
  value?: number | null;
  error?: string;
}

export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============= Enhanced Text Validation =============
export const validateTextInput = (
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowedChars?: RegExp;
    fieldName?: string;
    userId?: string;
    required?: boolean;
    allowEmpty?: boolean;
  } = {}
): ValidationResult => {
  const { 
    minLength = 0, 
    maxLength = 1000, 
    allowedChars, 
    fieldName = 'input', 
    userId, 
    required = true,
    allowEmpty = false 
  } = options;

  try {
    // Basic validation
    if (typeof input !== 'string') {
      return { isValid: false, error: `${fieldName} must be a string` };
    }

    const trimmed = input.trim();

    // Handle empty inputs
    if (!required && allowEmpty && trimmed === '') {
      return { isValid: true, sanitized: '' };
    }

    // Length validation
    if (trimmed.length < minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
    }

    // Security patterns check
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /on\w+\s*=/i,
      /expression\s*\(/i,
      /@import/i,
      /binding\s*:/i
    ];

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(trimmed));
    if (hasSuspiciousContent) {
      securityLogger.logSecurityEvent('validation.input_rejected', {
        event_details: {
          field_name: fieldName,
          input_length: trimmed.length,
          reason: 'suspicious_content_detected'
        },
        risk_level: 'high'
      }, userId);
      
      return { isValid: false, error: `${fieldName} contains invalid characters` };
    }

    // Character validation
    if (allowedChars && !allowedChars.test(trimmed)) {
      return { isValid: false, error: `${fieldName} contains invalid characters` };
    }

    // HTML entity encoding for output safety
    const sanitized = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return { isValid: true, sanitized };

  } catch (error) {
    securityLogger.logSecurityEvent('validation.input_rejected', {
      event_details: {
        field_name: fieldName,
        error: 'validation_exception',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      risk_level: 'medium'
    }, userId);

    return { isValid: false, error: `${fieldName} validation failed` };
  }
};

// ============= Number Validation =============
export const validateNumber = (
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
    fieldName?: string;
    userId?: string;
  } = {}
): NumberValidationResult => {
  const { 
    min, 
    max, 
    integer = false, 
    required = true, 
    fieldName = 'number', 
    userId 
  } = options;

  try {
    const num = Number(input);

    if (!required && (input === '' || input === null || input === undefined)) {
      return { isValid: true, value: null };
    }

    if (isNaN(num) || !isFinite(num)) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }

    if (integer && !Number.isInteger(num)) {
      return { isValid: false, error: `${fieldName} must be a whole number` };
    }

    if (min !== undefined && num < min) {
      return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { isValid: false, error: `${fieldName} must not exceed ${max}` };
    }

    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      securityLogger.logSecurityEvent('validation.input_rejected', {
        event_details: {
          field_name: fieldName,
          value: num,
          reason: 'number_overflow_detected'
        },
        risk_level: 'medium'
      }, userId);

      return { isValid: false, error: `${fieldName} is too large` };
    }

    return { isValid: true, value: num };

  } catch (error) {
    securityLogger.logSecurityEvent('validation.input_rejected', {
      event_details: {
        field_name: fieldName,
        error: 'number_validation_exception',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      risk_level: 'medium'
    }, userId);

    return { isValid: false, error: `${fieldName} validation failed` };
  }
};

// ============= Email Validation =============
export const validateEmail = (email: string, userId?: string): ValidationResult => {
  const textValidation = validateTextInput(email, {
    minLength: 3,
    maxLength: 254,
    fieldName: 'email',
    userId
  });

  if (!textValidation.isValid) {
    return textValidation;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(textValidation.sanitized!)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  const suspiciousPatterns = [
    /\+.*script/i,
    /[<>]/,
    /javascript/i,
    /\.{2,}/,
    /@.*@/
  ];

  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(textValidation.sanitized!));
  if (hasSuspiciousPattern) {
    securityLogger.logSecurityEvent('validation.input_rejected', {
      event_details: {
        field_name: 'email',
        reason: 'suspicious_email_pattern'
      },
      risk_level: 'high'
    }, userId);

    return { isValid: false, error: 'Invalid email format' };
  }

  return {
    isValid: true,
    sanitized: textValidation.sanitized!.toLowerCase()
  };
};

// ============= Specialized Validators =============
export const validateName = (name: string): ValidationResult => {
  return validateTextInput(name, {
    minLength: 1,
    maxLength: 100,
    allowedChars: /^[a-zA-Z\s\-'\.]+$/,
    fieldName: 'name'
  });
};

export const validateCategoryName = (name: string): ValidationResult => {
  return validateTextInput(name, {
    minLength: 1,
    maxLength: 100,
    fieldName: 'category name',
    allowedChars: /^[a-zA-Z0-9\s\-'\.]+$/
  });
};

export const validateHexColor = (color: string): ValidationResult => {
  if (!color || typeof color !== 'string') {
    return { isValid: false, error: 'Color is required' };
  }

  const hexPattern = /^#[A-Fa-f0-9]{6}$/;
  if (!hexPattern.test(color)) {
    return { isValid: false, error: 'Color must be a valid 6-digit hex code (e.g., #FF0000)' };
  }

  return { isValid: true, sanitized: color.toUpperCase() };
};

export const validateNotes = (notes: string): ValidationResult => {
  return validateTextInput(notes, {
    maxLength: 1000,
    fieldName: 'notes',
    required: false,
    allowEmpty: true
  });
};

export const validatePassword = (password: string): ValidationResult => {
  const validation = validateTextInput(password, {
    minLength: 8,
    maxLength: 128,
    fieldName: 'password'
  });

  if (!validation.isValid) {
    return validation;
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
    return { 
      isValid: false, 
      error: 'Password must contain uppercase, lowercase, numbers, and special characters'
    };
  }

  return { isValid: true, sanitized: password };
};

export const validateUrl = (url: string): ValidationResult => {
  const validation = validateTextInput(url, {
    minLength: 1,
    maxLength: 2000,
    fieldName: 'URL'
  });

  if (!validation.isValid) {
    return validation;
  }

  try {
    const urlObj = new URL(validation.sanitized!);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    return { isValid: true, sanitized: validation.sanitized };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// ============= Category-Specific Validation =============
export const validateGoalType = (goalType: string): boolean => {
  return ['time', 'boolean', 'both'].includes(goalType);
};

export const validateCategoryPayload = (payload: any): CategoryValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.id) {
    errors.push('Category ID is required');
  }

  if (payload.color !== undefined) {
    const colorValidation = validateHexColor(payload.color);
    if (!colorValidation.isValid) {
      errors.push(colorValidation.error!);
    }
  }

  if (payload.goal_type !== undefined && !validateGoalType(payload.goal_type)) {
    errors.push('Goal type must be one of: time, boolean, both');
  }

  if (payload.name !== undefined) {
    const nameValidation = validateCategoryName(payload.name);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!);
    }
  }

  if (payload.daily_time_goal_minutes !== undefined && payload.daily_time_goal_minutes !== null) {
    const dailyValidation = validateNumber(payload.daily_time_goal_minutes, {
      min: 0,
      max: 1440,
      integer: true,
      fieldName: 'daily time goal'
    });
    if (!dailyValidation.isValid) {
      errors.push(dailyValidation.error!);
    }
  }

  if (payload.weekly_time_goal_minutes !== undefined && payload.weekly_time_goal_minutes !== null) {
    const weeklyValidation = validateNumber(payload.weekly_time_goal_minutes, {
      min: 0,
      max: 10080,
      integer: true,
      fieldName: 'weekly time goal'
    });
    if (!weeklyValidation.isValid) {
      errors.push(weeklyValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============= Utility Functions =============
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  const validation = validateTextInput(input, {
    maxLength: 10000,
    fieldName: 'input',
    required: false,
    allowEmpty: true
  });

  return validation.sanitized || '';
};

export const logValidationError = (error: string, context?: any) => {
  // Use proper error logging service instead of console
};