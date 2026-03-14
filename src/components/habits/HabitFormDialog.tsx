import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateHabit, useUpdateHabit, useDeleteHabit, Habit } from "@/hooks/useHabits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  target_value: z.coerce.number().min(0).optional(),
  target_unit: z.string().max(50).optional(),
  is_active: z.boolean(),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface HabitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
}

export function HabitFormDialog({ open, onOpenChange, habit }: HabitFormDialogProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const [loading, setLoading] = useState(false);
  const isEditing = !!habit;

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit?.name ?? "",
      description: habit?.description ?? "",
      target_value: habit?.target_value ?? 1,
      target_unit: habit?.target_unit ?? "",
      is_active: habit?.is_active ?? true,
    },
  });

  const onSubmit = async (data: HabitFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateHabit.mutateAsync({ id: habit.id, ...data });
      } else {
        await createHabit.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!habit) return;
    setLoading(true);
    try {
      await deleteHabit.mutateAsync(habit.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Habit" : "New Habit"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your habit details." : "Create a new habit to track daily."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Drink water" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What is this habit about?" rows={2} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. glasses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              {isEditing && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete habit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{habit.name}" and all its logs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
