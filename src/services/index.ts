/**
 * Service layer exports - Phase 2 Updated
 * Central access point for all business logic services
 */

// Re-export activity service
export * from './activityService';

// Re-export category functions (avoid conflicts)
export { 
  createDefaultCategoryFormData,
  prepareCategorySubmissionData,
  validateCategoryData,
  getDefaultCategoryColor,
  logCategoryOperation,
  isCategoryFormReady,
  getCategoryOperationContext,
  handleCategoryFieldUpdate
} from './category';

// Re-export auth functions (avoid conflicts)
export {
  processSignIn,
  processSignUp,
  processPasswordReset,
  processPasswordUpdate
} from './auth';

// Re-export validation functions (avoid conflicts) 
export {
  validateActivityForm,
  validateCategoryForm,
  validateSignInForm,
  validateSignUpForm,
  validatePasswordResetForm,
  sanitizeActivityData,
  sanitizeCategoryData as sanitizeCategoryFormData
} from './validation';

// Re-export types
export * from './types';