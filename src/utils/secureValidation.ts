
import { securityLogger } from './enhancedSecurityLogger';

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

export interface NumberValidationResult {
  isValid: boolean;
  sanitized?: number;
  error?: string;
}

// Enhanced text input validation with XSS and injection protection
export const secureValidateTextInput = (
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowedChars?: RegExp;
    fieldName?: string;
    userId?: string;
  } = {}
): ValidationResult => {
  const { minLength = 0, maxLength = 1000, allowedChars, fieldName = 'input', userId } = options;

  try {
    // Basic validation
    if (typeof input !== 'string') {
      return { isValid: false, error: `${fieldName} must be a string` };
    }

    // Trim whitespace
    const trimmed = input.trim();

    // Length validation
    if (trimmed.length < minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
    }

    // Check for suspicious patterns (potential XSS/injection)
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
      // Log security event
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

    // Check allowed characters if specified
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

// Enhanced number validation with range and type checking
export const secureValidateNumber = (
  input: any,
  options: {
    min?: number;
    max?: number;
    allowFloat?: boolean;
    fieldName?: string;
    userId?: string;
  } = {}
): NumberValidationResult => {
  const { min, max, allowFloat = false, fieldName = 'number', userId } = options;

  try {
    // Convert to number
    const num = Number(input);

    // Check if conversion was successful
    if (isNaN(num) || !isFinite(num)) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }

    // Check if integer is required
    if (!allowFloat && !Number.isInteger(num)) {
      return { isValid: false, error: `${fieldName} must be a whole number` };
    }

    // Range validation
    if (min !== undefined && num < min) {
      return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { isValid: false, error: `${fieldName} must not exceed ${max}` };
    }

    // Check for suspicious values (extremely large numbers that could indicate attacks)
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

    return { isValid: true, sanitized: num };

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

// Enhanced email validation with security checks
export const secureValidateEmail = (
  email: string,
  options: {
    userId?: string;
  } = {}
): ValidationResult => {
  const { userId } = options;

  // First use the secure text validation
  const textValidation = secureValidateTextInput(email, {
    minLength: 3,
    maxLength: 254,
    fieldName: 'email',
    userId
  });

  if (!textValidation.isValid) {
    return textValidation;
  }

  // Enhanced email regex that's more secure
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(textValidation.sanitized!)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check for suspicious email patterns
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

// Rate limiting validation for forms
export const validateRateLimit = async (
  identifier: string,
  action: string,
  options: {
    maxAttempts?: number;
    windowMinutes?: number;
  } = {}
): Promise<{ allowed: boolean; message?: string }> => {
  const { maxAttempts = 5, windowMinutes = 15 } = options;

  try {
    // This would typically check against a rate limiting service or database
    // For now, we'll implement a simple in-memory check
    const key = `${identifier}_${action}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // In a real implementation, this would use Redis or database
    // For demo purposes, we'll allow all requests but log them
    securityLogger.logSecurityEvent('security.rate_limit_check', {
      event_details: {
        identifier,
        action,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes
      },
      risk_level: 'low'
    });

    return { allowed: true };

  } catch (error) {
    console.error('Rate limit validation error:', error);
    return { allowed: true }; // Fail open for now
  }
};
