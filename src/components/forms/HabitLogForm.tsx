import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHabitLog } from "@/hooks/useHabitLogs";
import { useHabits } from "@/hooks/useHabits";
import { format } from "date-fns";

const habitLogSchema = z.object({
  habit_id: z.string().min(1, "Habit is required"),
  log_date: z.string().min(1, "Date is required"),
  value: z.coerce.number().min(0, "Value must be 0 or greater"),
  notes: z.string().max(1000).optional(),
});

type HabitLogFormData = z.infer<typeof habitLogSchema>;

interface HabitLogFormProps {
  onSuccess: () => void;
}

export function HabitLogForm({ onSuccess }: HabitLogFormProps) {
  const { data: habits } = useHabits();
  const createHabitLog = useCreateHabitLog();
  const [loading, setLoading] = useState(false);

  const form = useForm<HabitLogFormData>({
    resolver: zodResolver(habitLogSchema),
    defaultValues: {
      habit_id: "",
      log_date: format(new Date(), "yyyy-MM-dd"),
      value: 1,
      notes: "",
    },
  });

  const selectedHabitId = form.watch("habit_id");
  const selectedHabit = habits?.find(h => h.id === selectedHabitId);

  const onSubmit = async (data: HabitLogFormData) => {
    setLoading(true);
    try {
      await createHabitLog.mutateAsync({
        habit_id: data.habit_id,
        log_date: data.log_date,
        value: data.value,
        notes: data.notes || undefined,
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
                      {habit.name}
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
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Value {selectedHabit?.target_unit ? `(${selectedHabit.target_unit})` : ""}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={selectedHabit?.target_value ? `Target: ${selectedHabit.target_value}` : "1"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <Button type="submit" disabled={loading}>
            {loading ? "Logging..." : "Log Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
