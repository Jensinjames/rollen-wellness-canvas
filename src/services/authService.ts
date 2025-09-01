/**
 * Authentication Service
 * Centralizes authentication business logic and validation
 */

import { AuthFormData, PasswordResetFormData, AuthServiceResult } from './types';
import { ValidationService } from './validationService';
import { validateRateLimit } from '@/utils/secureValidation';
import { validatePasswordStrength } from '@/utils/securityConfig';

export class AuthService {
  /**
   * Handles sign-in process with validation and rate limiting
   */
  static async processSignIn(
    data: AuthFormData,
    signInFn: (email: string, password: string) => Promise<{ error: any }>
  ): Promise<AuthServiceResult> {
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
    const validation = ValidationService.validateSignInForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0]
      };
    }

    // Sanitize data
    const sanitizedData = ValidationService.sanitizeAuthData(data);

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
  }

  /**
   * Handles sign-up process with validation and rate limiting
   */
  static async processSignUp(
    data: AuthFormData,
    signUpFn: (email: string, password: string) => Promise<{ error: any }>
  ): Promise<AuthServiceResult> {
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
    const validation = ValidationService.validateSignUpForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0],
        errors: validation.passwordStrengthErrors
      };
    }

    // Sanitize data
    const sanitizedData = ValidationService.sanitizeAuthData(data);

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
  }

  /**
   * Handles password reset process with validation and rate limiting
   */
  static async processPasswordReset(
    data: PasswordResetFormData,
    resetPasswordFn: (email: string) => Promise<{ error: any }>
  ): Promise<AuthServiceResult> {
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
    const validation = ValidationService.validatePasswordResetForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0]
      };
    }

    // Sanitize data
    const sanitizedEmail = ValidationService.sanitizeAuthData({ 
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
  }


  /**
   * Handles password update process with validation and rate limiting
   */
  static async processPasswordUpdate(
    data: { password: string },
    updatePasswordFn: (password: string) => Promise<{ error: any }>
  ): Promise<AuthServiceResult> {
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
    const validation = validatePasswordStrength(data.password);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Password does not meet requirements',
        errors: validation.errors
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
  }
}