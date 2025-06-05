
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { Control } from 'react-hook-form';
import { format } from 'date-fns';
import { ActivityFormData } from './ActivityFormValidation';

interface DateTimeInputProps {
  control: Control<ActivityFormData>;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({ control }) => {
  return (
    <>
      {/* Real-time timestamp display */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md col-span-full">
        <Clock className="h-4 w-4" />
        <span>Logging time for: {format(new Date(), "PPP 'at' p")}</span>
      </div>

      {/* Date & Time */}
      <FormField
        control={control}
        name="date_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date & Time *</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
