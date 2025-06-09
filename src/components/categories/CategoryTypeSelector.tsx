import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import { Category } from '@/hooks/categories';

interface CategoryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  parentCategories?: Category[];
}

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({ 
  value, 
  onChange, 
  parentCategories 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="parent">Category Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Top-level Category</SelectItem>
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
    </div>
  );
};
