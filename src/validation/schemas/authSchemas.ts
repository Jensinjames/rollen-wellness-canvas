/**
 * Zod Schemas for Authentication Validation
 * Centralized schema definitions for all auth-related forms
 */

import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email cannot exceed 255 characters')
  .trim()
  .toLowerCase();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    passwordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  );

export const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password cannot exceed 128 characters'),
});

export const signUpFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const passwordResetFormSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type SignInFormSchema = z.infer<typeof signInFormSchema>;
export type SignUpFormSchema = z.infer<typeof signUpFormSchema>;
export type PasswordResetFormSchema = z.infer<typeof passwordResetFormSchema>;
export type PasswordUpdateFormSchema = z.infer<typeof passwordUpdateFormSchema>;
