
/**
 * Enhanced input validation and sanitization utilities with security improvements
 */

import { advancedSanitizeInput, secureValidateTextInput, secureValidateNumber } from './securityValidation';

// Re-export legacy functions for backward compatibility
export const sanitizeInput = (input: string): string => {
  const result = advancedSanitizeInput(input);
  return result.sanitized || '';
};

// Enhanced validation functions
export const validateTextInput = (
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

export const validateNumber = (
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

// Email validation with enhanced security
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
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

  return { isValid: true };
};

// Password strength validation with enhanced security
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
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

  return { isValid: true };
};
