
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSleepEntry } from "@/hooks/useSleepEntries";
import { validateTextInput, validateNumber } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const sleepSchema = z.object({
  sleep_date: z.string().min(1, "Sleep date is required"),
  sleep_duration_minutes: z.coerce.number().min(30, "Sleep duration must be at least 30 minutes"),
  sleep_quality: z.coerce.number().min(1).max(5),
  bedtime: z.string().optional(),
  wake_time: z.string().optional(),
  notes: z.string().optional(),
});

type SleepFormData = z.infer<typeof sleepSchema>;

interface SleepEntryFormProps {
  onSuccess: () => void;
}

export function SleepEntryForm({ onSuccess }: SleepEntryFormProps) {
  const { user } = useAuth();
  const createSleepEntry = useCreateSleepEntry();
  const [loading, setLoading] = useState(false);

  const form = useForm<SleepFormData>({
    resolver: zodResolver(sleepSchema),
    defaultValues: {
      sleep_date: format(new Date(), "yyyy-MM-dd"),
      sleep_duration_minutes: 480, // 8 hours default
      sleep_quality: 3,
      bedtime: "",
      wake_time: "",
      notes: "",
    },
  });

  const onSubmit = async (data: SleepFormData) => {
    setLoading(true);
    try {
      // Validate inputs using our security utilities
      const durationValidation = validateNumber(data.sleep_duration_minutes, { 
        min: 30, 
        max: 1440, 
        integer: true, 
        required: true 
      });
      if (!durationValidation.isValid) {
        form.setError("sleep_duration_minutes", { message: durationValidation.error });
        setLoading(false);
        return;
      }

      const qualityValidation = validateNumber(data.sleep_quality, { 
        min: 1, 
        max: 5, 
        integer: true, 
        required: true 
      });
      if (!qualityValidation.isValid) {
        form.setError("sleep_quality", { message: qualityValidation.error });
        setLoading(false);
        return;
      }

      const notesValidation = validateTextInput(data.notes || "", { maxLength: 1000 });
      if (!notesValidation.isValid) {
        form.setError("notes", { message: notesValidation.error });
        setLoading(false);
        return;
      }

      await createSleepEntry.mutateAsync({
        sleep_date: data.sleep_date,
        sleep_duration_minutes: durationValidation.value!,
        sleep_quality: qualityValidation.value!,
        bedtime: data.bedtime || undefined,
        wake_time: data.wake_time || undefined,
        notes: notesValidation.sanitized || undefined,
      });

      // Log the sleep entry creation as an "activity.create" audit event
      logResourceEvent('activity.create', user?.id || '', 'sleep', {
        sleep_duration_hours: Math.round(durationValidation.value! / 60 * 10) / 10,
        sleep_quality: qualityValidation.value,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating sleep entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sleep_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sleep Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sleep_duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="30" max="1440" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sleep_quality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sleep Quality</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Rate your sleep" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Poor</SelectItem>
                    <SelectItem value="2">2 - Poor</SelectItem>
                    <SelectItem value="3">3 - Fair</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bedtime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedtime (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wake_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wake Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="How did you sleep? Any notes..."
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
            className="bg-purple-500 hover:bg-purple-600"
          >
            {loading ? "Creating..." : "Log Sleep"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
