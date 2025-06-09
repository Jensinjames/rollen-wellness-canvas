
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Category, useParentCategories, useAllCategories, useUpdateCategory, useCreateCategory } from '@/hooks/categories';
import { validateCategoryData, logCategoryOperation } from './CategoryValidation';
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
  
  const getDefaultColor = () => {
    if (isEditing && category?.color) return category.color;
    if (isAddingSubcategory && forceParent?.color) return forceParent.color;
    return '#10B981';
  };

  const [formData, setFormData] = useState({
    name: '',
    color: '#10B981',
    description: '',
    is_active: true,
    sort_order: 0,
    parent_id: 'none',
    level: 0,
    goal_type: 'time' as 'time' | 'boolean' | 'both',
    is_boolean_goal: false,
    boolean_goal_label: '',
    daily_time_goal_minutes: undefined as number | undefined,
    weekly_time_goal_minutes: undefined as number | undefined,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string>('');

  // Get loading state from the appropriate mutation
  const isLoading = isEditing ? updateCategoryMutation.isPending : createCategoryMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      const defaultParentId = forceParent?.id || (isAddingSubcategory ? '' : 'none');
      
      setFormData({
        name: category?.name || '',
        color: getDefaultColor(),
        description: category?.description || '',
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order || 0,
        parent_id: category?.parent_id || defaultParentId,
        level: forceParent ? 1 : (category?.level || 0),
        goal_type: category?.goal_type || 'time',
        is_boolean_goal: category?.is_boolean_goal || false,
        boolean_goal_label: category?.boolean_goal_label || '',
        daily_time_goal_minutes: category?.daily_time_goal_minutes,
        weekly_time_goal_minutes: category?.weekly_time_goal_minutes,
      });
      setValidationErrors([]);
      setSubmitError('');
    }
  }, [isOpen, category, forceParent, isAddingSubcategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setValidationErrors(['Category name is required']);
      return;
    }
    
    const isSubcategory = isAddingSubcategory || formData.parent_id !== 'none';
    
    const submissionData = {
      ...formData,
      level: isSubcategory ? 1 : 0,
      parent_id: isSubcategory ? (formData.parent_id === 'none' ? forceParent?.id : formData.parent_id) : undefined,
    };

    // Pass the current category's ID to exclude it from duplicate checks during updates
    const validation = validateCategoryData(
      submissionData, 
      isSubcategory, 
      allCategories || [],
      category?.id || null
    );
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setSubmitError('');

    try {
      logCategoryOperation(
        category ? 'update' : 'create', 
        submissionData, 
        isSubcategory ? 'subcategory' : 'top-level category'
      );

      if (isEditing && category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          ...submissionData,
        });
      } else {
        await createCategoryMutation.mutateAsync(submissionData);
      }

      // Close form on success
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
