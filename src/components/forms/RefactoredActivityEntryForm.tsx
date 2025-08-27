
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/categories";
import { useCreateActivity } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { BooleanGoalCheckbox } from "./BooleanGoalCheckbox";
import { CategorySelector } from "./activity/CategorySelector";
import { DateTimeInput } from "./activity/DateTimeInput";
import { DurationInput } from "./activity/DurationInput";
import { NotesInput } from "./activity/NotesInput";
import { GoalValidationAlert } from "./activity/GoalValidationAlert";
import { ActivityService } from "@/services";
import type { ActivityFormData } from "@/services";

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: ActivityService.createDefaultFormData(preselectedCategoryId),
  });

  // Get category relationships using service
  const { parentCategories, selectedParentCategory, availableSubcategories } = 
    ActivityService.getCategoryRelationships(categories, selectedCategoryId);

  // Get selected subcategory to determine goal type
  const selectedSubcategoryId = form.watch("subcategory_id");
  const selectedSubcategory = availableSubcategories.find(sub => sub.id === selectedSubcategoryId);
  const goalType = selectedSubcategory?.goal_type || 'time';

  // Watch form values for validation
  const durationMinutes = form.watch("duration_minutes");
  const isCompleted = form.watch("is_completed");

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    setValidationErrors([]);

    try {
      // Use service to prepare submission data
      const result = ActivityService.prepareSubmissionData(
        data, 
        goalType, 
        parentCategories, 
        availableSubcategories
      );

      if (!result.success) {
        setValidationErrors(result.errors || [result.error || 'Validation failed']);
        setLoading(false);
        return;
      }

      // Submit the activity
      await createActivity.mutateAsync(result.data!);

      // Log the activity creation
      ActivityService.logActivityCreation(user?.id || '', result.data!, goalType);

      onSuccess();
    } catch (error) {
      console.error("Error creating activity:", error);
      setValidationErrors(['An unexpected error occurred while creating the activity']);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    form.setValue("category_id", categoryId);
    form.setValue("subcategory_id", ""); // Reset subcategory when parent changes
    setValidationErrors([]);
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    form.setValue("subcategory_id", subcategoryId);
    
    // Apply goal type defaults using service
    const updates = ActivityService.getGoalTypeDefaults(goalType, form.getValues());
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof ActivityFormData, value);
    });
    
    setValidationErrors([]);
  };

  const handleQuickDurationSelect = (minutes: number) => {
    form.setValue("duration_minutes", minutes);
  };

  const isFormValid = () => {
    return ActivityService.isFormReady(
      form.getValues(), 
      goalType, 
      parentCategories, 
      availableSubcategories, 
      loading
    );
  };

  const getBooleanGoalLabel = () => {
    return ActivityService.getBooleanGoalLabel(selectedSubcategory);
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
          colorValidationError={validationErrors.join('. ')}
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
