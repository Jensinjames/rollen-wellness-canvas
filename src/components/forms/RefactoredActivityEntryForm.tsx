
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCreateActivity } from "@/hooks/useActivities";
import { validateTextInput, validateNumber } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { QuickDurationSelector } from "./QuickDurationSelector";
import { BooleanGoalCheckbox } from "./BooleanGoalCheckbox";

const activitySchema = z.object({
  category_id: z.string().min(1, "Parent category is required"),
  subcategory_id: z.string().min(1, "Subcategory is required"),
  date_time: z.string().min(1, "Date and time is required"),
  duration_minutes: z.coerce.number().min(0, "Duration cannot be negative").max(1440, "Duration cannot exceed 24 hours"),
  is_completed: z.boolean().optional(),
  notes: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

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

  // Validate hex colors
  const validateCategoryColors = (categoryId: string, subcategoryId: string): boolean => {
    const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;
    
    const parentCategory = parentCategories.find(cat => cat.id === categoryId);
    const subcategory = availableSubcategories.find(sub => sub.id === subcategoryId);
    
    if (!parentCategory || !hexColorRegex.test(parentCategory.color)) {
      setColorValidationError(`Parent category color is invalid: ${parentCategory?.color || 'missing'}`);
      return false;
    }
    
    if (!subcategory || !hexColorRegex.test(subcategory.color)) {
      setColorValidationError(`Subcategory color is invalid: ${subcategory?.color || 'missing'}`);
      return false;
    }
    
    setColorValidationError("");
    return true;
  };

  // Custom validation based on goal type
  const validateGoalRequirements = (): string | null => {
    if (goalType === 'time') {
      if (durationMinutes <= 0) {
        return "Duration must be greater than 0 minutes for time-based goals";
      }
    } else if (goalType === 'boolean') {
      if (!isCompleted) {
        return "You must mark this activity as complete for boolean-based goals";
      }
    } else if (goalType === 'both') {
      if (durationMinutes <= 0 && !isCompleted) {
        return "Either enter a duration or mark as complete";
      }
    }
    return null;
  };

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      // Validate colors before submission
      if (!validateCategoryColors(data.category_id, data.subcategory_id)) {
        setLoading(false);
        return;
      }

      // Validate goal requirements
      const goalValidationError = validateGoalRequirements();
      if (goalValidationError) {
        form.setError("duration_minutes", { message: goalValidationError });
        setLoading(false);
        return;
      }

      // Validate notes if provided
      if (data.notes) {
        const notesValidation = validateTextInput(data.notes, { maxLength: 1000 });
        if (!notesValidation.isValid) {
          form.setError("notes", { message: notesValidation.error });
          setLoading(false);
          return;
        }
      }

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

      await createActivity.mutateAsync({
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        name: `${selectedParentCategory?.name} - ${availableSubcategories.find(sub => sub.id === data.subcategory_id)?.name}`,
        date_time: new Date(data.date_time).toISOString(),
        duration_minutes: goalType === 'boolean' && !data.duration_minutes ? 0 : (durationValidation.value || 0),
        is_completed: data.is_completed || false,
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
    const goalValidationError = validateGoalRequirements();
    return !loading && selectedCategoryId && availableSubcategories.length > 0 && !colorValidationError && !goalValidationError;
  };

  const getBooleanGoalLabel = () => {
    return selectedSubcategory?.boolean_goal_label || "Mark as Complete";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Real-time timestamp display */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <Clock className="h-4 w-4" />
          <span>Logging time for: {format(new Date(), "PPP 'at' p")}</span>
        </div>

        {/* Desktop: Two-column grid, Mobile: Single column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Category Selection */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category *</FormLabel>
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

          {/* Subcategory Selection */}
          <FormField
            control={form.control}
            name="subcategory_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory *</FormLabel>
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
                          <span className="text-xs text-gray-500 ml-1">
                            ({subcategory.goal_type})
                          </span>
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

          {/* Date & Time */}
          <FormField
            control={form.control}
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

          {/* Duration and Quick Duration (conditional) */}
          {(goalType === 'time' || goalType === 'both') && (
            <div className="space-y-3">
              <FormField
                control={form.control}
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
                onSelect={handleQuickDurationSelect}
                selectedValue={durationMinutes}
              />
            </div>
          )}
        </div>

        {/* Boolean Goal Checkbox (conditional) */}
        {(goalType === 'boolean' || goalType === 'both') && selectedSubcategory && (
          <BooleanGoalCheckbox
            control={form.control}
            label={getBooleanGoalLabel()}
            required={goalType === 'boolean'}
          />
        )}

        {/* Color Validation Error */}
        {colorValidationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{colorValidationError}</AlertDescription>
          </Alert>
        )}

        {/* Goal Type Validation Error */}
        {validateGoalRequirements() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validateGoalRequirements()}</AlertDescription>
          </Alert>
        )}

        {/* Notes - Full width */}
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
