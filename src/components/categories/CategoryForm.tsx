
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
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
}) => {
  const { data: parentCategories } = useParentCategories();
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#10B981',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order || 0,
    parent_id: category?.parent_id || 'none',
    level: category?.level || 0,
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

    // Set level based on parent selection
    const level = formData.parent_id !== 'none' ? 1 : 0;

    console.log('Submitting category with data:', {
      ...formData,
      parent_id: formData.parent_id === 'none' ? undefined : formData.parent_id,
      level,
    });

    onSubmit({
      ...formData,
      parent_id: formData.parent_id === 'none' ? undefined : formData.parent_id,
      level,
    });
    
    setFormData({
      name: '',
      color: '#10B981',
      description: '',
      is_active: true,
      sort_order: 0,
      parent_id: 'none',
      level: 0,
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
      parent_id: category?.parent_id || 'none',
      level: category?.level || 0,
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
            {category ? 'Update your category details.' : 'Create a new category to organize your activities.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CategoryTypeSwitch
            value={formData.parent_id}
            onChange={(value) => setFormData({ ...formData, parent_id: value })}
            parentCategories={parentCategories}
            isEditing={!!category}
            currentCategory={category}
          />

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
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
