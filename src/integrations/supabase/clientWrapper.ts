/**
 * Supabase client wrapper with environment validation
 * This file wraps the Supabase client creation with proper validation
 * and error handling for missing environment variables.
 * 
 * DO NOT modify src/integrations/supabase/client.ts directly as it is auto-generated.
 * This wrapper provides a safe layer on top of the auto-generated client.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { validateEnvironmentVariables, logValidationResult } from '@/utils/envValidation';

// Validate environment variables
const validation = validateEnvironmentVariables();

// Log validation result in development
if (import.meta.env.DEV) {
  logValidationResult(validation);
}

// If validation fails, we'll handle it in main.tsx
// For now, export the validation result so it can be checked
export const envValidation = validation;

// Create and export Supabase client
// If environment variables are missing, this will throw an error that gets caught by main.tsx
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

try {
  if (validation.isValid) {
    const SUPABASE_URL = validation.variables.VITE_SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = validation.variables.VITE_SUPABASE_PUBLISHABLE_KEY!;
    
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } else {
    // Create a null instance that will be caught in main.tsx
    throw new Error('Environment variables validation failed');
  }
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('Failed to initialize Supabase client:', error);
  }
  // We'll handle this error in main.tsx
}

// Export the client (will be null if validation failed)
export const supabase = supabaseInstance!;

// Re-export types for convenience
export type { Database } from './types';
