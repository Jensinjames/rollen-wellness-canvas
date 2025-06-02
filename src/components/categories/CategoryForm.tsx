
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category, useParentCategories } from '@/hooks/useCategories';
import { ColorPicker } from './ColorPicker';
import { CategoryTypeSwitch } from './CategoryTypeSwitch';
import { CategoryNameField, CategoryDescriptionField } from './CategoryFormFields';
import { TimeGoalFields } from './TimeGoalFields';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => void;
  category?: Category;
  title: string;
  forceParent?: Category; // When adding subcategory, this locks the parent
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
  
  // When forceParent is provided, we're adding a subcategory
  const isAddingSubcategory = !!forceParent;
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#10B981',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order || 0,
    parent_id: forceParent?.id || category?.parent_id || 'none',
    level: forceParent ? 1 : (category?.level || 0),
    daily_time_goal_minutes: category?.daily_time_goal_minutes,
    weekly_time_goal_minutes: category?.weekly_time_goal_minutes,
  });

  const [colorError, setColorError] = useState('');

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
    // Validate color
    const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
    if (!hexColorRegex.test(color)) {
      setColorError('Color must be a valid 6-digit hex code (e.g., #FF0000)');
    } else {
      setColorError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Validate color before submission
    const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
    if (!hexColorRegex.test(formData.color)) {
      return;
    }

    // Critical validation for subcategories
    if (isAddingSubcategory || formData.parent_id !== 'none') {
      if (!formData.parent_id || formData.parent_id === 'none') {
        console.error('Subcategory must have a parent_id');
        return;
      }
      // Force level to 1 for subcategories
      formData.level = 1;
    } else {
      // Force level to 0 for top-level categories
      formData.level = 0;
    }

    console.log('Submitting category with data:', {
      ...formData,
      parent_id: formData.parent_id === 'none' ? undefined : formData.parent_id,
      level: formData.level,
    });

    onSubmit({
      ...formData,
      parent_id: formData.parent_id === 'none' ? undefined : formData.parent_id,
      level: formData.level,
    });
    
    // Reset form
    setFormData({
      name: '',
      color: '#10B981',
      description: '',
      is_active: true,
      sort_order: 0,
      parent_id: forceParent?.id || 'none',
      level: forceParent ? 1 : 0,
      daily_time_goal_minutes: undefined,
      weekly_time_goal_minutes: undefined,
    });
    setColorError('');
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: category?.name || '',
      color: category?.color || '#10B981',
      description: category?.description || '',
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order || 0,
      parent_id: forceParent?.id || category?.parent_id || 'none',
      level: forceParent ? 1 : (category?.level || 0),
      daily_time_goal_minutes: category?.daily_time_goal_minutes,
      weekly_time_goal_minutes: category?.weekly_time_goal_minutes,
    });
    setColorError('');
    onClose();
  };

  const isSubcategory = formData.parent_id !== 'none';

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
                : 'Create a new category to organize your activities.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isAddingSubcategory && (
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
            onChange={(value) => setFormData({ ...formData, name: value })}
            isSubcategory={isSubcategory}
          />

          <ColorPicker
            value={formData.color}
            onChange={handleColorChange}
            error={colorError}
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
            <Button type="submit" disabled={!!colorError}>
              {category ? 'Update Category' : (isAddingSubcategory ? 'Create Subcategory' : 'Create Category')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
