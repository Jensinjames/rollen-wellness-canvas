
import React from 'react';
import { EnhancedTimeGoalFields } from './EnhancedTimeGoalFields';

interface TimeGoalFieldsProps {
  dailyGoal: number | undefined;
  weeklyGoal: number | undefined;
  onDailyGoalChange: (value: number | undefined) => void;
  onWeeklyGoalChange: (value: number | undefined) => void;
}

export const TimeGoalFields: React.FC<TimeGoalFieldsProps> = (props) => {
  return <EnhancedTimeGoalFields {...props} />;
};
