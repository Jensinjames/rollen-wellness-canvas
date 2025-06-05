
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';
import { QuickDurationSelector } from '../QuickDurationSelector';
import { ActivityFormData } from './ActivityFormValidation';

interface DurationInputProps {
  control: Control<ActivityFormData>;
  goalType: string;
  durationMinutes: number;
  onQuickDurationSelect: (minutes: number) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  control,
  goalType,
  durationMinutes,
  onQuickDurationSelect,
}) => {
  if (goalType !== 'time' && goalType !== 'both') {
    return null;
  }

  return (
    <div className="space-y-3">
      <FormField
        control={control}
        name="duration_minutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Duration (minutes) {goalType === 'time' ? '*' : ''}
            </FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                max="1440" 
                {...field} 
                placeholder={goalType === 'both' ? "Optional" : "Required"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <QuickDurationSelector
        onSelect={onQuickDurationSelect}
        selectedValue={durationMinutes}
      />
    </div>
  );
};
