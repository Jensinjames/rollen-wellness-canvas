
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';

interface BooleanGoalFieldsProps {
  isBooleanGoal: boolean;
  booleanGoalLabel: string;
  onBooleanGoalChange: (enabled: boolean) => void;
  onLabelChange: (label: string) => void;
  error?: string;
}

export const BooleanGoalFields: React.FC<BooleanGoalFieldsProps> = ({
  isBooleanGoal,
  booleanGoalLabel,
  onBooleanGoalChange,
  onLabelChange,
  error,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <Label className="text-base font-medium">Completion Tracking</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_boolean_goal"
          checked={isBooleanGoal}
          onCheckedChange={onBooleanGoalChange}
        />
        <Label htmlFor="is_boolean_goal">
          Enable completion tracking for this category
        </Label>
      </div>

      {isBooleanGoal && (
        <div className="space-y-2">
          <Label htmlFor="boolean_goal_label">
            Completion Label
          </Label>
          <Input
            id="boolean_goal_label"
            value={booleanGoalLabel}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="e.g., Complete Today, Mark Done, Finished"
            className={error ? "border-red-500" : ""}
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            This label will appear on activity cards for quick completion marking
          </p>
        </div>
      )}
    </div>
  );
};
