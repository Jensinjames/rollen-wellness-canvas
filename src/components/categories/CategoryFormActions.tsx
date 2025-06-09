
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/hooks/categories';
import { Loader2 } from 'lucide-react';

interface CategoryFormActionsProps {
  category?: Category;
  forceParent?: Category;
  validationErrors: string[];
  isLoading?: boolean;
  onClose: () => void;
}

export const CategoryFormActions: React.FC<CategoryFormActionsProps> = ({
  category,
  forceParent,
  validationErrors,
  isLoading = false,
  onClose,
}) => {
  const isAddingSubcategory = !!forceParent;
  const hasErrors = validationErrors.length > 0;

  const getSubmitLabel = () => {
    if (isLoading) {
      return category ? 'Updating...' : (isAddingSubcategory ? 'Creating...' : 'Creating...');
    }
    return category ? 'Update Category' : (isAddingSubcategory ? 'Create Subcategory' : 'Create Category');
  };

  const getSubmitAriaLabel = () => {
    const action = category ? 'Update' : 'Create';
    const type = isAddingSubcategory ? 'subcategory' : 'category';
    return `${action} ${type}${hasErrors ? '. Fix validation errors first.' : ''}`;
  };

  return (
    <DialogFooter>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        disabled={isLoading}
        aria-label="Cancel and close form"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={hasErrors || isLoading}
        aria-label={getSubmitAriaLabel()}
        aria-describedby={hasErrors ? 'validation-errors' : undefined}
      >
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {getSubmitLabel()}
      </Button>
    </DialogFooter>
  );
};
