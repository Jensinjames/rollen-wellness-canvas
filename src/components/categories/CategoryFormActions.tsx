
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/hooks/categories';

interface CategoryFormActionsProps {
  category?: Category;
  forceParent?: Category;
  validationErrors: string[];
  onClose: () => void;
}

export const CategoryFormActions: React.FC<CategoryFormActionsProps> = ({
  category,
  forceParent,
  validationErrors,
  onClose,
}) => {
  const isAddingSubcategory = !!forceParent;

  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={validationErrors.length > 0}>
        {category ? 'Update Category' : (isAddingSubcategory ? 'Create Subcategory' : 'Create Category')}
      </Button>
    </DialogFooter>
  );
};
