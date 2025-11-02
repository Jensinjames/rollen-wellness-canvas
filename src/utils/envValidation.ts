/**
 * Environment variable validation utility
 * Provides detailed error messages and troubleshooting steps
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    VITE_SUPABASE_PROJECT_ID?: string;
  };
}

export function validateEnvironmentVariables(): EnvValidationResult {
  const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const VITE_SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  if (!VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is missing from environment variables');
  }
  
  if (!VITE_SUPABASE_PUBLISHABLE_KEY) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing from environment variables');
  }
  
  // Check optional but recommended variables
  if (!VITE_SUPABASE_PROJECT_ID) {
    warnings.push('VITE_SUPABASE_PROJECT_ID is missing (optional but recommended)');
  }
  
  // Validate format of provided variables
  if (VITE_SUPABASE_URL && !VITE_SUPABASE_URL.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with https://');
  }
  
  if (VITE_SUPABASE_PUBLISHABLE_KEY && VITE_SUPABASE_PUBLISHABLE_KEY.length < 20) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY appears to be invalid (too short)');
  }
  
  // Add troubleshooting information if there are errors
  if (errors.length > 0) {
    errors.push('');
    errors.push('🔧 Common fixes:');
    errors.push('1. Stop the dev server (Ctrl+C or Cmd+C)');
    errors.push('2. Clear Vite cache: rm -rf node_modules/.vite');
    errors.push('   (Windows: rmdir /s /q node_modules\\.vite)');
    errors.push('3. Verify .env file is in project root');
    errors.push('4. Ensure variables have VITE_ prefix');
    errors.push('5. Restart dev server: npm run dev');
    errors.push('6. Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    variables: {
      VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PROJECT_ID,
    },
  };
}

export function logValidationResult(result: EnvValidationResult): void {
  if (result.isValid) {
    console.log('✅ Environment variables validated successfully');
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:', result.warnings);
    }
    return;
  }
  
  console.error('❌ Environment validation failed:');
  result.errors.forEach(error => {
    if (error.startsWith('🔧') || error.startsWith('1.') || error.startsWith('2.') || 
        error.startsWith('3.') || error.startsWith('4.') || error.startsWith('5.') || 
        error.startsWith('6.') || error === '') {
      console.error(error);
    } else {
      console.error(`  • ${error}`);
    }
  });
}
