/**
 * Authentication Service - Functional Implementation
 * Phase 2: Converted from class-based to functional pattern
 */

import { validateEmail, validateTextInput, validatePassword } from '@/validation';
// Rate limiting validation function placeholder
const validateRateLimit = async (identifier: string, action: string, options: any) => {
  return { allowed: true, message: '' }; // Simplified for now
};
import { AuthFormData, PasswordResetFormData, AuthServiceResult } from './types';

// ============= Form Validation =============
export const validateSignInForm = (data: AuthFormData) => {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email address');
  }

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

export const validateSignUpForm = (data: AuthFormData) => {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email address');
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error || 'Password does not meet requirements');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePasswordResetForm = (data: PasswordResetFormData) => {
  const errors: string[] = [];

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
export const sanitizeAuthData = (data: AuthFormData) => {
  const emailValidation = validateEmail(data.email);
  return {
    email: emailValidation.sanitized || data.email.trim(),
    password: data.password // Don't sanitize password content
  };
};

// ============= Authentication Operations =============
export const processSignIn = async (
  data: AuthFormData,
  signInFn: (email: string, password: string) => Promise<{ error: any }>
): Promise<AuthServiceResult> => {
  // Rate limiting check
  const rateLimitCheck = await validateRateLimit(
    data.email || 'anonymous',
    'signin',
    { maxAttempts: 5, windowMinutes: 15 }
  );

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.message || 'Too many attempts. Please try again later.'
    };
  }

  // Validate form data
  const validation = validateSignInForm(data);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors[0]
    };
  }

  // Sanitize data
  const sanitizedData = sanitizeAuthData(data);

  try {
    const { error } = await signInFn(sanitizedData.email, sanitizedData.password);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
};

export const processSignUp = async (
  data: AuthFormData,
  signUpFn: (email: string, password: string) => Promise<{ error: any }>
): Promise<AuthServiceResult> => {
  // Rate limiting check
  const rateLimitCheck = await validateRateLimit(
    data.email || 'anonymous',
    'signup',
    { maxAttempts: 5, windowMinutes: 15 }
  );

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.message || 'Too many attempts. Please try again later.'
    };
  }

  // Validate form data
  const validation = validateSignUpForm(data);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors[0]
    };
  }

  // Sanitize data
  const sanitizedData = sanitizeAuthData(data);

  try {
    const { error } = await signUpFn(sanitizedData.email, sanitizedData.password);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      requiresEmailConfirmation: true
    };
  } catch (err) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
};

export const processPasswordReset = async (
  data: PasswordResetFormData,
  resetPasswordFn: (email: string) => Promise<{ error: any }>
): Promise<AuthServiceResult> => {
  // Rate limiting check
  const rateLimitCheck = await validateRateLimit(
    data.email || 'anonymous',
    'password_reset',
    { maxAttempts: 3, windowMinutes: 60 }
  );

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.message || 'Too many reset attempts. Please try again later.'
    };
  }

  // Validate form data
  const validation = validatePasswordResetForm(data);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors[0]
    };
  }

  // Sanitize data
  const sanitizedEmail = sanitizeAuthData({ 
    email: data.email, 
    password: '' 
  }).email;

  try {
    const { error } = await resetPasswordFn(sanitizedEmail);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
};

export const processPasswordUpdate = async (
  data: { password: string },
  updatePasswordFn: (password: string) => Promise<{ error: any }>
): Promise<AuthServiceResult> => {
  // Rate limiting check
  const rateLimitCheck = await validateRateLimit(
    'password_update',
    'password_update', 
    { maxAttempts: 3, windowMinutes: 60 }
  );

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.message || 'Too many password update attempts. Please try again later.'
    };
  }

  // Validate password strength
  const validation = validatePassword(data.password);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Password does not meet requirements'
    };
  }

  try {
    const { error } = await updatePasswordFn(data.password);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to update password'
    };
  }
};