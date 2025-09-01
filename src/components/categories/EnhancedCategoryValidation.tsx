
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CategoryValidationResult } from '@/validation';

interface EnhancedCategoryValidationProps {
  validation: CategoryValidationResult;
  showWarnings?: boolean;
}

export const EnhancedCategoryValidation: React.FC<EnhancedCategoryValidationProps> = ({ 
  validation, 
  showWarnings = true 
}) => {
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All fields are valid and ready to submit.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {showWarnings && validation.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              <p className="font-medium">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={validation.isValid ? "default" : "destructive"}>
          {validation.isValid ? "Valid" : "Invalid"}
        </Badge>
        {validation.warnings.length > 0 && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {validation.warnings.length} Warning{validation.warnings.length === 1 ? '' : 's'}
          </Badge>
        )}
      </div>
    </div>
  );
};
