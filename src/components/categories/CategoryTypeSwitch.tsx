
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ChevronRight } from 'lucide-react';
import { Category } from '@/hooks/useCategories';

interface CategoryTypeSwitchProps {
  value: string;
  onChange: (value: string) => void;
  parentCategories?: Category[];
  isEditing?: boolean;
  currentCategory?: Category;
}

export const CategoryTypeSwitch: React.FC<CategoryTypeSwitchProps> = ({ 
  value, 
  onChange, 
  parentCategories,
  isEditing = false,
  currentCategory
}) => {
  const isSubcategory = value !== 'none';
  const selectedParent = parentCategories?.find(p => p.id === value);

  const getTypeDescription = () => {
    if (isSubcategory) {
      return `This will be a subcategory under "${selectedParent?.name}". Subcategories are perfect for specific activities within a broader category.`;
    }
    return "This will be a top-level category. Top-level categories can have subcategories added to them later.";
  };

  const canSwitchToSubcategory = !isEditing || !currentCategory?.children?.length;

  return (
    <div className="space-y-3">
      <Label htmlFor="parent">Category Type</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={isEditing && !canSwitchToSubcategory}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select category type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Top-level Category</span>
            </div>
          </SelectItem>
          {parentCategories?.map((parent) => (
            <SelectItem key={parent.id} value={parent.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: parent.color }}
                />
                <span>{parent.name}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-muted-foreground">Subcategory</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isEditing && !canSwitchToSubcategory && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cannot change to subcategory because this category has existing subcategories. 
            Remove or move subcategories first.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {getTypeDescription()}
        </AlertDescription>
      </Alert>
    </div>
  );
};
