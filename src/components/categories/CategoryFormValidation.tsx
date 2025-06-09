
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface CategoryFormValidationProps {
  validationErrors: string[];
}

export const CategoryFormValidation: React.FC<CategoryFormValidationProps> = ({
  validationErrors,
}) => {
  if (validationErrors.length === 0) return null;

  return (
    <Alert 
      variant="destructive" 
      className="mb-4"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div 
          id="validation-errors"
          aria-label={`${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''}`}
        >
          <strong>Please fix the following errors:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
