
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeGoalFieldsProps {
  dailyGoal: number | undefined;
  weeklyGoal: number | undefined;
  onDailyGoalChange: (value: number | undefined) => void;
  onWeeklyGoalChange: (value: number | undefined) => void;
}

export const TimeGoalFields: React.FC<TimeGoalFieldsProps> = ({
  dailyGoal,
  weeklyGoal,
  onDailyGoalChange,
  onWeeklyGoalChange,
}) => {
  const handleDailyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDailyGoalChange(value === '' ? undefined : parseInt(value, 10));
  };

  const handleWeeklyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onWeeklyGoalChange(value === '' ? undefined : parseInt(value, 10));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="daily-goal">Daily Time Goal (minutes)</Label>
        <Input
          id="daily-goal"
          type="number"
          min="0"
          value={dailyGoal || ''}
          onChange={handleDailyChange}
          placeholder="e.g., 30 for 30 minutes per day"
        />
        <p className="text-xs text-muted-foreground">
          Set a daily time goal for this category (optional)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekly-goal">Weekly Time Goal (minutes)</Label>
        <Input
          id="weekly-goal"
          type="number"
          min="0"
          value={weeklyGoal || ''}
          onChange={handleWeeklyChange}
          placeholder="e.g., 300 for 5 hours per week"
        />
        <p className="text-xs text-muted-foreground">
          Set a weekly time goal for this category (optional)
        </p>
      </div>
    </div>
  );
};
