
import React from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category } from '@/hooks/categories';

interface CategoryFormHeaderProps {
  title: string;
  category?: Category;
  forceParent?: Category;
}

export const CategoryFormHeader: React.FC<CategoryFormHeaderProps> = ({
  title,
  category,
  forceParent,
}) => {
  const isAddingSubcategory = !!forceParent;

  return (
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
  );
};
