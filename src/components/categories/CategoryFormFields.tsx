
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CategoryNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  isSubcategory: boolean;
}

interface CategoryDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  isSubcategory: boolean;
}

export const CategoryNameField: React.FC<CategoryNameFieldProps> = ({ 
  value, 
  onChange, 
  isSubcategory 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">
        {isSubcategory ? 'Subcategory' : 'Category'} Name
      </Label>
      <Input
        id="name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} name`}
        required
      />
    </div>
  );
};

export const CategoryDescriptionField: React.FC<CategoryDescriptionFieldProps> = ({ 
  value, 
  onChange, 
  isSubcategory 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description (Optional)</Label>
      <Textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Brief description of this ${isSubcategory ? 'subcategory' : 'category'}`}
        rows={3}
      />
    </div>
  );
};
