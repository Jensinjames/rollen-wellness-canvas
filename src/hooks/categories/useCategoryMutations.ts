
// Re-export all mutation hooks from their focused files
export { useCreateCategory } from './useCategoryCreate';
export { useUpdateCategory } from './useEnhancedCategoryMutations';
export { useDeleteCategory } from './useCategoryDelete';
export { useSeedDefaultCategories } from './useCategorySeed';

// Export validation utilities from the enhanced implementation
export { validateCategoryUpdatePayload, sanitizeCategoryPayload } from '../utils/categoryValidation';
