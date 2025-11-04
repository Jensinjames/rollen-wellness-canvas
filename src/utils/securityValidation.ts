
/**
 * Advanced security validation utilities
 */

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityValidationResult {
  isValid: boolean;
  sanitized?: string;
  value?: number | null;
  error?: string;
  securityRisk?: 'low' | 'medium' | 'high';
}

// XSS prevention patterns - Focus on actual script injection threats
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
];

// Note: SQL injection patterns removed - Supabase uses parameterized queries
// which prevents SQL injection. These patterns were blocking legitimate content
// like "Please select your preference" or "Create a new category"
const SQL_INJECTION_PATTERNS: RegExp[] = [];

// Enhanced input sanitization
export const advancedSanitizeInput = (input: string): SecurityValidationResult => {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitized: '' };
  }

  let sanitized = input.trim();
  let securityRisk: 'low' | 'medium' | 'high' = 'low';

  // Check for XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        error: 'Input contains potentially dangerous content',
        securityRisk: 'high'
      };
    }
  }

  // SQL injection check removed - Supabase client uses parameterized queries
  // No need to block legitimate content containing words like "select", "create", etc.

  // Remove only dangerous characters that could enable XSS
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove angle brackets (prevent HTML injection)
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
    // Note: Quotes not removed - React JSX escapes output automatically

  // Check for excessive length (potential DoS)
  if (sanitized.length > 2000) {
    securityRisk = 'medium';
    sanitized = sanitized.slice(0, 2000);
  }

  return {
    isValid: true,
    sanitized,
    securityRisk
  };
};

// Rate limiting function
export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
};

// Enhanced text validation with security checks
export const secureValidateTextInput = (
  input: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
    allowSpecialChars?: boolean;
  } = {}
): SecurityValidationResult => {
  const { required = false, minLength = 0, maxLength = 500, allowEmpty = true, allowSpecialChars = false } = options;

  if (!input || typeof input !== 'string') {
    if (required) {
      return { isValid: false, error: 'This field is required', securityRisk: 'low' };
    }
    return { isValid: true, sanitized: '' };
  }

  // Security validation first
  const securityResult = advancedSanitizeInput(input);
  if (!securityResult.isValid) {
    return securityResult;
  }

  const sanitized = securityResult.sanitized!;

  if (!allowEmpty && sanitized.length === 0) {
    return { isValid: false, sanitized, error: 'This field cannot be empty' };
  }

  if (sanitized.length < minLength) {
    return { isValid: false, sanitized, error: `Must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized, error: `Must be no more than ${maxLength} characters` };
  }

  // Check for special characters if not allowed
  if (!allowSpecialChars && /[<>{}[\]\\\/]/.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Special characters are not allowed',
      securityRisk: 'medium'
    };
  }

  return { isValid: true, sanitized, securityRisk: securityResult.securityRisk };
};

// Enhanced number validation
export const secureValidateNumber = (
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
  } = {}
): SecurityValidationResult => {
  const { min = -Infinity, max = Infinity, integer = false, required = false } = options;

  if (input === '' || input === null || input === undefined) {
    if (required) {
      return { isValid: false, value: null, error: 'This field is required' };
    }
    return { isValid: true, value: null };
  }

  // No SQL injection check needed - numbers are type-validated below

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

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
