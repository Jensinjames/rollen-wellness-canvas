
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category, useParentCategories, useAllCategories } from '@/hooks/categories';
import { ColorPicker } from './ColorPicker';
import { CategoryTypeSwitch } from './CategoryTypeSwitch';
import { CategoryNameField, CategoryDescriptionField } from './CategoryFormFields';
import { TimeGoalFields } from './TimeGoalFields';
import { validateCategoryData, logCategoryOperation } from './CategoryValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
        daily_time_goal_minutes: category?.daily_time_goal_minutes,
        weekly_time_goal_minutes: category?.weekly_time_goal_minutes,
      });
      setValidationErrors([]);
    }
  }, [isOpen, category, forceParent, isAddingSubcategory]);

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    const isSubcategory = isAddingSubcategory || formData.parent_id !== 'none';
    
    const submissionData = {
      ...formData,
      level: isSubcategory ? 1 : 0,
      parent_id: isSubcategory ? (formData.parent_id === 'none' ? forceParent?.id : formData.parent_id) : undefined,
    };

    const validation = validateCategoryData(
      submissionData, 
      isSubcategory, 
      allCategories || []
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

  const isSubcategory = isAddingSubcategory || formData.parent_id !== 'none';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isAddingSubcategory 
              ? `Create a new subcategory under "${forceParent.name}".`
              : category 
                ? 'Update your category details.' 
                : 'Create a new category or subcategory for organizing your activities.'
            }
          </DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isAddingSubcategory && !category && (
            <CategoryTypeSwitch
              value={formData.parent_id}
              onChange={(value) => setFormData({ ...formData, parent_id: value, level: value === 'none' ? 0 : 1 })}
              parentCategories={parentCategories}
              isEditing={!!category}
              currentCategory={category}
            />
          )}

          {isAddingSubcategory && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Type</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: forceParent.color }}
                  />
                  <span className="font-medium">{forceParent.name}</span>
                  <span className="text-muted-foreground">→ Subcategory</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This will be created as a subcategory under {forceParent.name}
                </p>
              </div>
            </div>
          )}

          <CategoryNameField
            value={formData.name}
            onChange={(value) => {
              setFormData({ ...formData, name: value });
              if (validationErrors.length > 0) {
                setValidationErrors([]);
              }
            }}
            isSubcategory={isSubcategory}
          />

          <ColorPicker
            value={formData.color}
            onChange={handleColorChange}
            parentColor={forceParent?.color}
            isSubcategory={isSubcategory}
            error={validationErrors.find(error => error.includes('color')) || ''}
          />

          <CategoryDescriptionField
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            isSubcategory={isSubcategory}
          />

          <TimeGoalFields
            dailyGoal={formData.daily_time_goal_minutes}
            weeklyGoal={formData.weekly_time_goal_minutes}
            onDailyGoalChange={(value) => setFormData({ ...formData, daily_time_goal_minutes: value })}
            onWeeklyGoalChange={(value) => setFormData({ ...formData, weekly_time_goal_minutes: value })}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={validationErrors.length > 0}>
              {category ? 'Update Category' : (isAddingSubcategory ? 'Create Subcategory' : 'Create Category')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
