import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActivities, useCreateActivity, Activity } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { validateTextInput, validateNumber } from "@/validation";
import { logResourceEvent } from "@/utils/auditLog";
import { useAuth } from "@/contexts/UnifiedAuthContext";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  activityId: string | null;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  subcategoryId?: string;
  duration?: string;
  notes?: string;
}

export function ActivityModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  activityId 
}: ActivityModalProps) {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();
  const createActivity = useCreateActivity();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    subcategoryId: "",
    duration: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const activity = activityId ? activities?.find(a => a.id === activityId) : null;
  const isEditing = !!activityId && !!activity;

  // Get available parent categories (level 0)
  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];
  
  // Get subcategories for selected parent
  const selectedParentCategory = parentCategories.find(cat => cat.id === formData.categoryId);
  const availableSubcategories = selectedParentCategory?.children?.filter(sub => sub.is_active) || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && activity) {
        setFormData({
          name: activity.name,
          categoryId: activity.category_id,
          subcategoryId: activity.subcategory_id,
          duration: activity.duration_minutes.toString(),
          notes: activity.notes || "",
        });
      } else {
        setFormData({
          name: "",
          categoryId: "",
          subcategoryId: "",
          duration: "",
          notes: "",
        });
      }
      setFormErrors({});
    }
  }, [isOpen, isEditing, activity]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate name
    const nameValidation = validateTextInput(formData.name, {
      required: true,
      minLength: 1,
      maxLength: 100,
      allowEmpty: false
    });
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }

    // Validate category selection
    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category';
    }

    // Validate subcategory selection
    if (!formData.subcategoryId) {
      errors.subcategoryId = 'Please select a subcategory';
    }

    // Validate duration
    const durationValidation = validateNumber(formData.duration, {
      required: true,
      min: 1,
      max: 1440, // Max 24 hours
      integer: true
    });
    if (!durationValidation.isValid) {
      errors.duration = durationValidation.error;
    }

    // Validate notes (optional)
    if (formData.notes) {
      const notesValidation = validateTextInput(formData.notes, {
        maxLength: 500
      });
      if (!notesValidation.isValid) {
        errors.notes = notesValidation.error;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateActivityMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Activity> }) => {
      const { error } = await supabase
        .from('activities')
        .update(data.updates)
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      if (user) {
        logResourceEvent('activity.update', user.id, activityId!, {
          name: formData.name,
          duration: formData.duration
        });
      }
      
      toast.success('Activity updated successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      if (user) {
        logResourceEvent('activity.delete', user.id, activityId!);
      }
      
      toast.success('Activity deleted successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedDate) {
      if (!selectedDate) {
        toast.error('Please select a date');
      }
      return;
    }

    const duration = parseInt(formData.duration);
    
    // Sanitize inputs
    const nameValidation = validateTextInput(formData.name, { required: true, maxLength: 100 });
    const notesValidation = validateTextInput(formData.notes, { maxLength: 500 });
    
    if (!nameValidation.isValid || !notesValidation.isValid) {
      toast.error('Invalid input detected');
      return;
    }

    if (isEditing && activity) {
      updateActivityMutation.mutate({
        id: activity.id,
        updates: {
          name: nameValidation.sanitized,
          category_id: formData.categoryId,
          subcategory_id: formData.subcategoryId,
          duration_minutes: duration,
          notes: notesValidation.sanitized || null,
        }
      });
    } else {
      createActivity.mutate({
        name: nameValidation.sanitized,
        category_id: formData.categoryId,
        subcategory_id: formData.subcategoryId,
        date_time: selectedDate.toISOString(),
        duration_minutes: duration,
        notes: notesValidation.sanitized || null,
      });
    }
  };

  const handleDelete = () => {
    if (activity && window.confirm('Are you sure you want to delete this activity?')) {
      deleteActivityMutation.mutate(activity.id);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      categoryId, 
      subcategoryId: "" // Reset subcategory when parent changes
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="activity-modal-description"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Activity' : 'Add Activity'}
            {selectedDate && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div id="activity-modal-description" className="sr-only">
          {isEditing ? 'Edit an existing activity entry' : 'Create a new activity entry'} for the selected date.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Activity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning workout"
              required
              maxLength={100}
            />
            {formErrors.name && (
              <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Parent Category *</Label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="">Select a parent category</option>
              {parentCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.categoryId && (
              <p className="text-sm text-red-600 mt-1">{formErrors.categoryId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategory *</Label>
            <select
              id="subcategory"
              value={formData.subcategoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
              disabled={!formData.categoryId}
            >
              <option value="">
                {!formData.categoryId 
                  ? "Select a parent category first" 
                  : availableSubcategories.length === 0
                    ? "No subcategories available - create one first"
                    : "Select a subcategory"
                }
              </option>
              {availableSubcategories.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {formErrors.subcategoryId && (
              <p className="text-sm text-red-600 mt-1">{formErrors.subcategoryId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="1440"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="30"
              required
            />
            {formErrors.duration && (
              <p className="text-sm text-red-600 mt-1">{formErrors.duration}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this activity"
              rows={3}
              maxLength={500}
            />
            {formErrors.notes && (
              <p className="text-sm text-red-600 mt-1">{formErrors.notes}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formData.notes.length}/500 characters
            </p>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteActivityMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createActivity.isPending || updateActivityMutation.isPending || !formData.categoryId || availableSubcategories.length === 0}
              >
                {isEditing ? 'Update' : 'Add'} Activity
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
