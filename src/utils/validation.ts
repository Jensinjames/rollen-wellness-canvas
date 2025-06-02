
/**
 * Input validation and sanitization utilities
 */

// Basic HTML sanitization - removes potentially dangerous characters
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS
};

// Email validation with basic security checks
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const sanitized = sanitizeInput(email);
  if (sanitized !== email) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }

  return { isValid: true };
};

// Password strength validation
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

// General text input validation
export const validateTextInput = (
  input: string, 
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
): { isValid: boolean; sanitized: string; error?: string } => {
  const { required = false, minLength = 0, maxLength = 500, allowEmpty = true } = options;

  if (!input || typeof input !== 'string') {
    if (required) {
      return { isValid: false, sanitized: '', error: 'This field is required' };
    }
    return { isValid: true, sanitized: '' };
  }

  const sanitized = sanitizeInput(input);
  
  if (!allowEmpty && sanitized.length === 0) {
    return { isValid: false, sanitized, error: 'This field cannot be empty' };
  }

  if (sanitized.length < minLength) {
    return { isValid: false, sanitized, error: `Must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized, error: `Must be no more than ${maxLength} characters` };
  }

  return { isValid: true, sanitized };
};

// Number validation with range checks
export const validateNumber = (
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  } = {}
): { isValid: boolean; value: number | null; error?: string } => {
  const { min = -Infinity, max = Infinity, integer = false, required = false } = options;

  if (input === '' || input === null || input === undefined) {
    if (required) {
      return { isValid: false, value: null, error: 'This field is required' };
    }
    return { isValid: true, value: null };
  }

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    return { isValid: false, value: null, error: 'Must be a valid number' };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, value: null, error: 'Must be a whole number' };
  }

  if (num < min) {
    return { isValid: false, value: null, error: `Must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, value: null, error: `Must be no more than ${max}` };
  }

  return { isValid: true, value: num };
};
