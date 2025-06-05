
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Category, useParentCategories, useAllCategories } from '@/hooks/categories';
import { validateCategoryData, logCategoryOperation } from './CategoryValidation';
import { CategoryFormHeader } from './CategoryFormHeader';
import { CategoryFormValidation } from './CategoryFormValidation';
import { CategoryFormContent } from './CategoryFormContent';
import { CategoryFormActions } from './CategoryFormActions';

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
    }
  }, [isOpen, category, forceParent, isAddingSubcategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
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

    logCategoryOperation(
      category ? 'update' : 'create', 
      submissionData, 
      isSubcategory ? 'subcategory' : 'top-level category'
    );

    onSubmit(submissionData);
  };

  const handleClose = () => {
    setValidationErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <CategoryFormHeader
          title={title}
          category={category}
          forceParent={forceParent}
        />

        <CategoryFormValidation validationErrors={validationErrors} />

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
            onClose={handleClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
