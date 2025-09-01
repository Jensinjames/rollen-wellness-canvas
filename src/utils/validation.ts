/**
 * Placeholder validation functions for modules still being updated
 * @deprecated Use @/validation instead
 */

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

// Placeholder functions that delegate to the new validation module
export const validateTextInput = (input: string, options?: any): ValidationResult => {
  // Import inline to avoid circular dependencies
  const { validateTextInput: newValidateTextInput } = require('@/validation');
  return newValidateTextInput(input, options);
};

export const validateNumber = (input: string | number, options?: any): NumberValidationResult => {
  const { validateNumber: newValidateNumber } = require('@/validation');
  return newValidateNumber(input, options);
};

export const validateNotes = (notes: string): ValidationResult => {
  const { validateNotes: newValidateNotes } = require('@/validation');
  return newValidateNotes(notes);
};

export const validatePassword = (password: string): ValidationResult => {
  const { validatePassword: newValidatePassword } = require('@/validation');
  return newValidatePassword(password);
};

export const validateName = (name: string): ValidationResult => {
  const { validateName: newValidateName } = require('@/validation');
  return newValidateName(name);
};

export const validateEmail = (email: string): ValidationResult => {
  const { validateEmail: newValidateEmail } = require('@/validation');
  return newValidateEmail(email);
};