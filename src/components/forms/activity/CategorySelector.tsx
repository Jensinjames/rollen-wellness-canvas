
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';
import { ActivityFormData } from './ActivityFormValidation';

interface CategorySelectorProps {
  control: Control<ActivityFormData>;
  parentCategories: any[];
  availableSubcategories: any[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  control,
  parentCategories,
  availableSubcategories,
  selectedCategoryId,
  onCategoryChange,
  onSubcategoryChange,
}) => {
  return (
    <>
      {/* Parent Category Selection */}
      <FormField
        control={control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parent Category *</FormLabel>
            <Select onValueChange={onCategoryChange} value={selectedCategoryId}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Subcategory Selection */}
      <FormField
        control={control}
        name="subcategory_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subcategory *</FormLabel>
            <Select 
              onValueChange={onSubcategoryChange} 
              value={field.value}
              disabled={!selectedCategoryId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedCategoryId 
                      ? "Select a parent category first" 
                      : availableSubcategories.length === 0
                        ? "No subcategories available - create one first"
                        : "Select a subcategory"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subcategory.color }}
                      />
                      {subcategory.name}
                      <span className="text-xs text-gray-500 ml-1">
                        ({subcategory.goal_type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
            {selectedCategoryId && availableSubcategories.length === 0 && (
              <p className="text-sm text-amber-600">
                No subcategories found. Please create a subcategory for this parent category first.
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
};
