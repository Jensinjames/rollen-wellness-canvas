
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useCreateActivity } from "@/hooks/useActivities";
import { validateTextInput, validateNumber } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  category_id: z.string().min(1, "Parent category is required"),
  subcategory_id: z.string().min(1, "Subcategory is required"),
  date_time: z.string().min(1, "Date and time is required"),
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityEntryFormProps {
  onSuccess: () => void;
}

export function ActivityEntryForm({ onSuccess }: ActivityEntryFormProps) {
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const createActivity = useCreateActivity();
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      category_id: "",
      subcategory_id: "",
      date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: 30,
      notes: "",
    },
  });

  // Get available parent categories (level 0)
  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];
  
  // Get subcategories for selected parent
  const selectedParentCategory = parentCategories.find(cat => cat.id === selectedCategoryId);
  const availableSubcategories = selectedParentCategory?.children?.filter(sub => sub.is_active) || [];

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      // Validate inputs using our security utilities
      const nameValidation = validateTextInput(data.name, { required: true, maxLength: 200 });
      if (!nameValidation.isValid) {
        form.setError("name", { message: nameValidation.error });
        setLoading(false);
        return;
      }

      const durationValidation = validateNumber(data.duration_minutes, { 
        min: 1, 
        max: 1440, 
        integer: true, 
        required: true 
      });
      if (!durationValidation.isValid) {
        form.setError("duration_minutes", { message: durationValidation.error });
        setLoading(false);
        return;
      }

      const notesValidation = validateTextInput(data.notes || "", { maxLength: 1000 });
      if (!notesValidation.isValid) {
        form.setError("notes", { message: notesValidation.error });
        setLoading(false);
        return;
      }

      await createActivity.mutateAsync({
        name: nameValidation.sanitized,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        date_time: new Date(data.date_time).toISOString(),
        duration_minutes: durationValidation.value!,
        notes: notesValidation.sanitized || undefined,
      });

      // Log the activity creation
      logResourceEvent('activity.create', user?.id || '', data.category_id, {
        activity_name: nameValidation.sanitized,
        subcategory_id: data.subcategory_id,
        duration_minutes: durationValidation.value,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    form.setValue("category_id", categoryId);
    form.setValue("subcategory_id", ""); // Reset subcategory when parent changes
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    form.setValue("subcategory_id", subcategoryId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter activity name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {parentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
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
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <Select 
                onValueChange={handleSubcategoryChange} 
                value={field.value}
                disabled={!selectedCategoryId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedCategoryId 
                        ? "Select a parent category first" 
                        : availableSubcategories.length === 0
                          ? "No subcategories available - create one first"
                          : "Select a subcategory"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subcategory.color }}
                        />
                        {subcategory.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {selectedCategoryId && availableSubcategories.length === 0 && (
                <p className="text-sm text-amber-600">
                  No subcategories found. Please create a subcategory for this parent category first.
                </p>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="1440" {...field} />
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
            disabled={loading || !selectedCategoryId || availableSubcategories.length === 0}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? "Creating..." : "Create Activity"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
