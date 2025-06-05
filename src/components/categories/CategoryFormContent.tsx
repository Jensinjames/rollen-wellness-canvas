
import React from 'react';
import { Category } from '@/hooks/categories';
import { CategoryTypeSwitch } from './CategoryTypeSwitch';
import { CategoryNameField, CategoryDescriptionField } from './CategoryFormFields';
import { ColorPicker } from './ColorPicker';
import { GoalTypeSelector } from './GoalTypeSelector';
import { TimeGoalFields } from './TimeGoalFields';
import { BooleanGoalFields } from './BooleanGoalFields';

interface CategoryFormData {
  name: string;
  color: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  parent_id: string;
  level: number;
  goal_type: 'time' | 'boolean' | 'both';
  is_boolean_goal: boolean;
  boolean_goal_label: string;
  daily_time_goal_minutes: number | undefined;
  weekly_time_goal_minutes: number | undefined;
}

interface CategoryFormContentProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  category?: Category;
  forceParent?: Category;
  parentCategories?: Category[];
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
}

export const CategoryFormContent: React.FC<CategoryFormContentProps> = ({
  formData,
  setFormData,
  category,
  forceParent,
  parentCategories,
  validationErrors,
  setValidationErrors,
}) => {
  const isAddingSubcategory = !!forceParent;
  const isSubcategory = isAddingSubcategory || formData.parent_id !== 'none';
  const showTimeGoals = formData.goal_type === 'time' || formData.goal_type === 'both';
  const showBooleanGoals = formData.goal_type === 'boolean' || formData.goal_type === 'both';

  const clearValidationErrors = () => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
    clearValidationErrors();
  };

  const handleGoalTypeChange = (goalType: 'time' | 'boolean' | 'both') => {
    setFormData({ 
      ...formData, 
      goal_type: goalType,
      is_boolean_goal: goalType === 'boolean' || goalType === 'both' ? formData.is_boolean_goal : false,
      boolean_goal_label: goalType === 'boolean' || goalType === 'both' ? formData.boolean_goal_label : '',
    });
    clearValidationErrors();
  };

  const handleBooleanGoalChange = (enabled: boolean) => {
    setFormData({ 
      ...formData, 
      is_boolean_goal: enabled,
      boolean_goal_label: enabled ? formData.boolean_goal_label : ''
    });
    clearValidationErrors();
  };

  return (
    <div className="space-y-6">
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
          clearValidationErrors();
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

      <GoalTypeSelector
        value={formData.goal_type}
        onChange={handleGoalTypeChange}
      />

      {showTimeGoals && (
        <TimeGoalFields
          dailyGoal={formData.daily_time_goal_minutes}
          weeklyGoal={formData.weekly_time_goal_minutes}
          onDailyGoalChange={(value) => setFormData({ ...formData, daily_time_goal_minutes: value })}
          onWeeklyGoalChange={(value) => setFormData({ ...formData, weekly_time_goal_minutes: value })}
        />
      )}

      {showBooleanGoals && (
        <BooleanGoalFields
          isBooleanGoal={formData.is_boolean_goal}
          booleanGoalLabel={formData.boolean_goal_label}
          onBooleanGoalChange={handleBooleanGoalChange}
          onLabelChange={(value) => setFormData({ ...formData, boolean_goal_label: value })}
          error={validationErrors.find(error => error.includes('Boolean goal label')) || ''}
        />
      )}
    </div>
  );
};
