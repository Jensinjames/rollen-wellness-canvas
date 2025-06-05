
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle } from 'lucide-react';
import { Control } from 'react-hook-form';

interface BooleanGoalCheckboxProps {
  control: Control<any>;
  label: string;
  required?: boolean;
}

export const BooleanGoalCheckbox: React.FC<BooleanGoalCheckboxProps> = ({
  control,
  label,
  required = false,
}) => {
  return (
    <FormField
      control={control}
      name="is_completed"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
