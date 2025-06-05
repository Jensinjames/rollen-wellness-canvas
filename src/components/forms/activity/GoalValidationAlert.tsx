
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface GoalValidationAlertProps {
  goalType: string;
  durationMinutes: number;
  isCompleted: boolean;
  colorValidationError: string;
}

export const GoalValidationAlert: React.FC<GoalValidationAlertProps> = ({
  goalType,
  durationMinutes,
  isCompleted,
  colorValidationError,
}) => {
  const getGoalValidationError = (): string | null => {
    if (goalType === 'time') {
      if (durationMinutes <= 0) {
        return "Duration must be greater than 0 minutes for time-based goals";
      }
    } else if (goalType === 'boolean') {
      if (!isCompleted) {
        return "You must mark this activity as complete for boolean-based goals";
      }
    } else if (goalType === 'both') {
      if (durationMinutes <= 0 && !isCompleted) {
        return "Either enter a duration or mark as complete";
      }
    }
    return null;
  };

  const goalValidationError = getGoalValidationError();

  if (!colorValidationError && !goalValidationError) {
    return null;
  }

  return (
    <>
      {/* Color Validation Error */}
      {colorValidationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{colorValidationError}</AlertDescription>
        </Alert>
      )}

      {/* Goal Type Validation Error */}
      {goalValidationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{goalValidationError}</AlertDescription>
        </Alert>
      )}
    </>
  );
};
