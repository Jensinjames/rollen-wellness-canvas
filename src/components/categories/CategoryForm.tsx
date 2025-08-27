
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Category, useParentCategories, useAllCategories, useUpdateCategory, useCreateCategory } from '@/hooks/categories';
import { CategoryService } from '@/services';
import { CategoryFormHeader } from './CategoryFormHeader';
import { CategoryFormValidation } from './CategoryFormValidation';
import { CategoryFormContent } from './CategoryFormContent';
import { CategoryFormActions } from './CategoryFormActions';
import { LiveRegion } from '@/components/accessibility/LiveRegion';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => void;
  category?: Category;
  title: string;
  forceParent?: Category;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
  forceParent,
}) => {
  const { data: parentCategories } = useParentCategories();
  const { data: allCategories } = useAllCategories();
  const updateCategoryMutation = useUpdateCategory();
  const createCategoryMutation = useCreateCategory();
  
  const isAddingSubcategory = !!forceParent;
  const isEditing = !!category;

  const [formData, setFormData] = useState(
    CategoryService.createDefaultFormData(category, forceParent)
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string>('');

  // Get loading state from the appropriate mutation
  const isLoading = isEditing ? updateCategoryMutation.isPending : createCategoryMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setFormData(CategoryService.createDefaultFormData(category, forceParent));
      setValidationErrors([]);
      setSubmitError('');
    }
  }, [isOpen, category, forceParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors([]);
    setSubmitError('');

    // Use service to prepare submission data
    const result = CategoryService.prepareSubmissionData(
      formData,
      forceParent,
      allCategories || [],
      category?.id
    );

    if (!result.success) {
      setValidationErrors(result.errors || [result.error || 'Validation failed']);
      return;
    }

    try {
      // Log the operation
      const isSubcategory = isAddingSubcategory || formData.parent_id !== 'none';
      CategoryService.logCategoryOperation(
        category ? 'update' : 'create', 
        result.data,
        CategoryService.getOperationContext(isSubcategory)
      );

      if (isEditing && category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          ...result.data,
        });
      } else {
        await createCategoryMutation.mutateAsync(result.data);
      }

      handleClose();
    } catch (error: any) {
      console.error('Error submitting category:', error);
      setSubmitError(error.message || 'An unexpected error occurred');
    }
  };

  const handleClose = () => {
    setValidationErrors([]);
    setSubmitError('');
    onClose();
  };

  // Get current error message for live region
  const currentErrorMessage = submitError || (validationErrors.length > 0 ? validationErrors.join('. ') : '');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-labelledby="category-form-title"
        aria-describedby="category-form-description"
      >
        <CategoryFormHeader
          title={title}
          category={category}
          forceParent={forceParent}
        />

        <CategoryFormValidation validationErrors={validationErrors} />

        {/* Live region for error announcements */}
        <LiveRegion 
          message={currentErrorMessage}
          politeness="assertive"
        />

        {/* Submit error display */}
        {submitError && (
          <div 
            id="submit-error"
            className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
            role="alert"
            aria-live="polite"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <CategoryFormContent
            formData={formData}
            setFormData={setFormData}
            category={category}
            forceParent={forceParent}
            parentCategories={parentCategories}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />

          <CategoryFormActions
            category={category}
            forceParent={forceParent}
            validationErrors={validationErrors}
            isLoading={isLoading}
            onClose={handleClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
