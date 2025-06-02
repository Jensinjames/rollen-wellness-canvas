
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Clock, Target } from 'lucide-react';
import { TimeGoalPresets } from './TimeGoalPresets';

interface EnhancedTimeGoalFieldsProps {
  dailyGoal: number | undefined;
  weeklyGoal: number | undefined;
  onDailyGoalChange: (value: number | undefined) => void;
  onWeeklyGoalChange: (value: number | undefined) => void;
}

export const EnhancedTimeGoalFields: React.FC<EnhancedTimeGoalFieldsProps> = ({
  dailyGoal,
  weeklyGoal,
  onDailyGoalChange,
  onWeeklyGoalChange,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleDailyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onDailyGoalChange(numValue);
    validateGoals(numValue, weeklyGoal);
  };

  const handleWeeklyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onWeeklyGoalChange(numValue);
    validateGoals(dailyGoal, numValue);
  };

  const validateGoals = (daily?: number, weekly?: number) => {
    const errors: string[] = [];
    
    if (daily && weekly) {
      const maxWeeklyFromDaily = daily * 7;
      if (weekly > maxWeeklyFromDaily) {
        errors.push(`Weekly goal (${weekly}m) exceeds daily goal × 7 (${maxWeeklyFromDaily}m)`);
      }
    }
    
    setValidationErrors(errors);
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <Label className="text-base font-medium">Time Goals</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily-goal" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Daily Goal (minutes)
          </Label>
          <Input
            id="daily-goal"
            type="number"
            min="0"
            max="1440"
            value={dailyGoal || ''}
            onChange={handleDailyChange}
            placeholder="30"
          />
          {dailyGoal && (
            <p className="text-xs text-muted-foreground">
              = {formatTime(dailyGoal)} per day
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weekly-goal" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Weekly Goal (minutes)
          </Label>
          <Input
            id="weekly-goal"
            type="number"
            min="0"
            max="10080"
            value={weeklyGoal || ''}
            onChange={handleWeeklyChange}
            placeholder="300"
          />
          {weeklyGoal && (
            <p className="text-xs text-muted-foreground">
              = {formatTime(weeklyGoal)} per week
            </p>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-xs text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      <Collapsible open={showPresets} onOpenChange={setShowPresets}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span>Quick Presets</span>
            {showPresets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          <TimeGoalPresets
            onSelectDaily={(value) => {
              onDailyGoalChange(value);
              validateGoals(value, weeklyGoal);
            }}
            onSelectWeekly={(value) => {
              onWeeklyGoalChange(value);
              validateGoals(dailyGoal, value);
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Set realistic goals you can maintain consistently</p>
        <p>• Goals are optional but help track progress</p>
        <p>• You can adjust these anytime</p>
      </div>
    </div>
  );
};
