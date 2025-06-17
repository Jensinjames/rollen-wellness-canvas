
import { isDevelopment } from './environment';
import { secureValidateEmail, secureValidateTextInput } from './secureValidation';

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

// Use the enhanced email validation
export const validateEmail = (email: string): ValidationResult => {
  return secureValidateEmail(email);
};

// Use the enhanced text validation for names
export const validateName = (name: string): ValidationResult => {
  return secureValidateTextInput(name, {
    minLength: 1,
    maxLength: 100,
    allowedChars: /^[a-zA-Z\s\-'\.]+$/,
    fieldName: 'name'
  });
};

// Enhanced password validation using existing security config
export const validatePassword = (password: string): ValidationResult => {
  const validation = secureValidateTextInput(password, {
    minLength: 8,
    maxLength: 128,
    fieldName: 'password'
  });

  if (!validation.isValid) {
    return validation;
  }

  // Additional password-specific checks
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  // Basic strength check
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

// Validate URL inputs with security checks
export const validateUrl = (url: string): ValidationResult => {
  const validation = secureValidateTextInput(url, {
    minLength: 1,
    maxLength: 2000,
    fieldName: 'URL'
  });

  if (!validation.isValid) {
    return validation;
  }

  try {
    const urlObj = new URL(validation.sanitized!);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    return { isValid: true, sanitized: validation.sanitized };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Sanitize and validate general text input
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  const validation = secureValidateTextInput(input, {
    maxLength: 10000,
    fieldName: 'input'
  });

  return validation.sanitized || '';
};

// Development logging with environment check
export const logValidationError = (error: string, context?: any) => {
  if (isDevelopment()) {
    console.error('Validation Error:', error, context);
  }
};
