
/**
 * Unified validation system with enhanced security features
 * Consolidates all validation logic into a single source of truth
 */

import { advancedSanitizeInput, secureValidateTextInput, secureValidateNumber } from './securityValidation';

// Core validation interfaces
export interface ValidationResult<T = any> {
  isValid: boolean;
  value?: T;
  sanitized?: string;
  error?: string;
  securityRisk?: 'low' | 'medium' | 'high';
}

export interface TextValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  allowSpecialChars?: boolean;
}

export interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
}

// Unified text validation
export const validateText = (
  input: string,
  options: TextValidationOptions = {}
): ValidationResult<string> => {
  const result = secureValidateTextInput(input, options);
  return {
    isValid: result.isValid,
    value: result.sanitized,
    sanitized: result.sanitized,
    error: result.error,
    securityRisk: result.securityRisk
  };
};

// Unified number validation
export const validateNumber = (
  input: string | number,
  options: NumberValidationOptions = {}
): ValidationResult<number> => {
  const result = secureValidateNumber(input, options);
  return {
    isValid: result.isValid,
    value: result.value || undefined,
    error: result.error,
    securityRisk: result.securityRisk
  };
};

// Email validation with enhanced security
export const validateEmail = (email: string): ValidationResult<string> => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  // Security validation first
  const securityResult = advancedSanitizeInput(email);
  if (!securityResult.isValid) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }

  const sanitized = securityResult.sanitized!;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }

  return { isValid: true, value: sanitized, sanitized };
};

// Password strength validation with enhanced security
export const validatePassword = (password: string): ValidationResult<string> => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password too long' };
  }

  // Check for basic complexity
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexityCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (complexityCount < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters' 
    };
  }

  return { isValid: true, value: password };
};

// Category validation
export const validateCategoryName = (name: string): ValidationResult<string> => {
  return validateText(name, {
    required: true,
    minLength: 1,
    maxLength: 100,
    allowEmpty: false
  });
};

// Activity validation
export const validateActivityName = (name: string): ValidationResult<string> => {
  return validateText(name, {
    required: true,
    minLength: 1,
    maxLength: 200,
    allowEmpty: false
  });
};

export const validateDuration = (duration: string | number): ValidationResult<number> => {
  return validateNumber(duration, {
    min: 0,
    max: 1440, // 24 hours max
    integer: true,
    required: true
  });
};

// Notes validation
export const validateNotes = (notes: string): ValidationResult<string> => {
  return validateText(notes, {
    required: false,
    maxLength: 1000,
    allowEmpty: true
  });
};

// Hex color validation
export const validateHexColor = (color: string): ValidationResult<string> => {
  if (!color || typeof color !== 'string') {
    return { isValid: false, error: 'Color is required' };
  }

  const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
  if (!hexColorRegex.test(color)) {
    return { isValid: false, error: 'Color must be a valid 6-digit hex code' };
  }

  return { isValid: true, value: color, sanitized: color };
};

// Legacy compatibility exports
export const sanitizeInput = (input: string): string => {
  const result = advancedSanitizeInput(input);
  return result.sanitized || '';
};

export const validateTextInput = validateText;

// Legacy validation functions for backward compatibility
export const validateTextInput_legacy = (
  input: string, 
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
) => {
  const result = secureValidateTextInput(input, options);
  return {
    isValid: result.isValid,
    sanitized: result.sanitized || '',
    error: result.error
  };
};

export const validateNumber_legacy = (
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  } = {}
) => {
  const result = secureValidateNumber(input, options);
  return {
    isValid: result.isValid,
    value: result.value,
    error: result.error
  };
};
