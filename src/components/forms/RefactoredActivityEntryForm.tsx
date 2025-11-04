
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/categories";
import { useCreateActivity } from "@/hooks/useActivities";
import { validateNumber } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { BooleanGoalCheckbox } from "./BooleanGoalCheckbox";
import { CategorySelector } from "./activity/CategorySelector";
import { DateTimeInput } from "./activity/DateTimeInput";
import { DurationInput } from "./activity/DurationInput";
import { NotesInput } from "./activity/NotesInput";
import { GoalValidationAlert } from "./activity/GoalValidationAlert";
import { ActivityFormData, validateActivityForm } from "./activity/ActivityFormValidation";

const activitySchema = z.object({
  category_id: z.string().min(1, "Parent category is required"),
  subcategory_id: z.string().min(1, "Subcategory is required"),
  date_time: z.string().min(1, "Date and time is required"),
  duration_minutes: z.coerce.number().min(0, "Duration cannot be negative").max(1440, "Duration cannot exceed 24 hours"),
  is_completed: z.boolean().optional(),
  notes: z.string().optional(),
});

interface RefactoredActivityEntryFormProps {
  onSuccess: () => void;
  preselectedCategoryId?: string;
}

export function RefactoredActivityEntryForm({ onSuccess, preselectedCategoryId }: RefactoredActivityEntryFormProps) {
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const createActivity = useCreateActivity();
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(preselectedCategoryId || "");
  const [colorValidationError, setColorValidationError] = useState("");

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      category_id: preselectedCategoryId || "",
      subcategory_id: "",
      date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: 30,
      is_completed: false,
      notes: "",
    },
  });

  // Get available parent categories (level 0)
  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];
  
  // Get subcategories for selected parent
  const selectedParentCategory = parentCategories.find(cat => cat.id === selectedCategoryId);
  const availableSubcategories = selectedParentCategory?.children?.filter(sub => sub.is_active) || [];

  // Get selected subcategory to determine goal type
  const selectedSubcategoryId = form.watch("subcategory_id");
  const selectedSubcategory = availableSubcategories.find(sub => sub.id === selectedSubcategoryId);
  const goalType = selectedSubcategory?.goal_type || 'time';

  // Watch form values for validation
  const durationMinutes = form.watch("duration_minutes");
  const isCompleted = form.watch("is_completed");

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      // Validate using the extracted validation function
      const validation = validateActivityForm(data, goalType, parentCategories, availableSubcategories);
      if (!validation.isValid) {
        setColorValidationError(validation.error || "");
        setLoading(false);
        return;
      }
      setColorValidationError("");

      // Validate duration
      const durationValidation = validateNumber(data.duration_minutes, { 
        min: 0, 
        max: 1440, 
        integer: true, 
        required: goalType === 'time' 
      });
      if (!durationValidation.isValid) {
        form.setError("duration_minutes", { message: durationValidation.error });
        setLoading(false);
        return;
      }

      const now = new Date(data.date_time);
      const endTime = new Date(now.getTime() + (durationValidation.value || 0) * 60000);

      await createActivity.mutateAsync({
        user_id: '',
        category_id: data.category_id,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        date_time: now.toISOString(),
        duration_minutes: goalType === 'boolean' && !data.duration_minutes ? 0 : (durationValidation.value || 0),
        notes: data.notes || undefined,
      });

      // Log the activity creation
      logResourceEvent('activity.create', user?.id || '', data.category_id, {
        subcategory_id: data.subcategory_id,
        duration_minutes: durationValidation.value || 0,
        is_completed: data.is_completed,
        goal_type: goalType,
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
    setColorValidationError("");
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    form.setValue("subcategory_id", subcategoryId);
    // Reset form values when goal type changes
    if (goalType === 'boolean') {
      form.setValue("duration_minutes", 0);
    } else if (goalType === 'time') {
      form.setValue("is_completed", false);
      if (form.getValues("duration_minutes") === 0) {
        form.setValue("duration_minutes", 30);
      }
    }
    setColorValidationError("");
  };

  const handleQuickDurationSelect = (minutes: number) => {
    form.setValue("duration_minutes", minutes);
  };

  const isFormValid = () => {
    const validation = validateActivityForm(form.getValues(), goalType, parentCategories, availableSubcategories);
    return !loading && selectedCategoryId && availableSubcategories.length > 0 && validation.isValid;
  };

  const getBooleanGoalLabel = () => {
    return selectedSubcategory?.boolean_goal_label || "Mark as Complete";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Desktop: Two-column grid, Mobile: Single column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateTimeInput control={form.control} />

          <CategorySelector
            control={form.control}
            parentCategories={parentCategories}
            availableSubcategories={availableSubcategories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={handleSubcategoryChange}
          />

          <DurationInput
            control={form.control}
            goalType={goalType}
            durationMinutes={durationMinutes}
            onQuickDurationSelect={handleQuickDurationSelect}
          />
        </div>

        {/* Boolean Goal Checkbox (conditional) */}
        {(goalType === 'boolean' || goalType === 'both') && selectedSubcategory && (
          <BooleanGoalCheckbox
            control={form.control}
            label={getBooleanGoalLabel()}
            required={goalType === 'boolean'}
          />
        )}

        {/* Validation Alerts */}
        <GoalValidationAlert
          goalType={goalType}
          durationMinutes={durationMinutes}
          isCompleted={isCompleted}
          colorValidationError={colorValidationError}
        />

        {/* Notes - Full width */}
        <NotesInput control={form.control} />

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={!isFormValid()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? "Logging Time..." : "Log Time"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
