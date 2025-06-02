
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateHabitLog } from "@/hooks/useHabitLogs";
import { useHabits } from "@/hooks/useHabits";
import { validateTextInput, validateNumber } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const habitLogSchema = z.object({
  habit_id: z.string().min(1, "Habit is required"),
  log_date: z.string().min(1, "Date is required"),
  completed: z.boolean(),
  actual_value: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type HabitLogFormData = z.infer<typeof habitLogSchema>;

interface HabitLogFormProps {
  onSuccess: () => void;
}

export function HabitLogForm({ onSuccess }: HabitLogFormProps) {
  const { user } = useAuth();
  const { data: habits } = useHabits();
  const createHabitLog = useCreateHabitLog();
  const [loading, setLoading] = useState(false);

  const form = useForm<HabitLogFormData>({
    resolver: zodResolver(habitLogSchema),
    defaultValues: {
      habit_id: "",
      log_date: format(new Date(), "yyyy-MM-dd"),
      completed: false,
      actual_value: 1,
      notes: "",
    },
  });

  const selectedHabitId = form.watch("habit_id");
  const selectedHabit = habits?.find(h => h.id === selectedHabitId);

  const onSubmit = async (data: HabitLogFormData) => {
    setLoading(true);
    try {
      // Validate inputs using our security utilities
      const valueValidation = validateNumber(data.actual_value || 0, { 
        min: 0, 
        max: 10000, 
        required: false 
      });
      if (!valueValidation.isValid) {
        form.setError("actual_value", { message: valueValidation.error });
        setLoading(false);
        return;
      }

      const notesValidation = validateTextInput(data.notes || "", { maxLength: 1000 });
      if (!notesValidation.isValid) {
        form.setError("notes", { message: notesValidation.error });
        setLoading(false);
        return;
      }

      await createHabitLog.mutateAsync({
        habit_id: data.habit_id,
        log_date: data.log_date,
        completed: data.completed,
        actual_value: valueValidation.value || undefined,
        notes: notesValidation.sanitized || undefined,
      });

      // Log the habit log creation
      logResourceEvent('activity.create', user?.id || '', data.habit_id, {
        habit_name: selectedHabit?.name,
        completed: data.completed,
        actual_value: valueValidation.value,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating habit log:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeHabits = habits?.filter(habit => habit.is_active) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="habit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a habit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeHabits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      <div className="flex items-center gap-2">
                        {habit.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: habit.color }}
                          />
                        )}
                        {habit.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="log_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Completed</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this habit as completed for the day
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {selectedHabit?.target_value && (
          <FormField
            control={form.control}
            name="actual_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Actual Value ({selectedHabit.target_unit})
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    placeholder={`Target: ${selectedHabit.target_value} ${selectedHabit.target_unit}`}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? "Creating..." : "Log Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
