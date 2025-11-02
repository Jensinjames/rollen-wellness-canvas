/**
 * Supabase integration index
 * Re-exports the wrapped Supabase client with environment validation
 */

export { supabase, envValidation } from './clientWrapper';
export type { Database } from './types';
