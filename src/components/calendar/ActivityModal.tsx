
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
import { useCategories } from "@/hooks/useCategories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  activityId: string | null;
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

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    duration: "",
    notes: "",
  });

  const activity = activityId ? activities?.find(a => a.id === activityId) : null;
  const isEditing = !!activityId && !!activity;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && activity) {
        setFormData({
          name: activity.name,
          categoryId: activity.category_id,
          duration: activity.duration_minutes.toString(),
          notes: activity.notes || "",
        });
      } else {
        setFormData({
          name: "",
          categoryId: "",
          duration: "",
          notes: "",
        });
      }
    }
  }, [isOpen, isEditing, activity]);

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
    
    if (!formData.name || !formData.categoryId || !formData.duration || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      toast.error('Duration must be a positive number');
      return;
    }

    if (isEditing && activity) {
      updateActivityMutation.mutate({
        id: activity.id,
        updates: {
          name: formData.name,
          category_id: formData.categoryId,
          duration_minutes: duration,
          notes: formData.notes || null,
        }
      });
    } else {
      createActivity.mutate({
        name: formData.name,
        category_id: formData.categoryId,
        date_time: selectedDate.toISOString(),
        duration_minutes: duration,
        notes: formData.notes || null,
      });
    }
  };

  const handleDelete = () => {
    if (activity && window.confirm('Are you sure you want to delete this activity?')) {
      deleteActivityMutation.mutate(activity.id);
    }
  };

  const allCategories = categories?.flatMap(cat => [cat, ...(cat.children || [])]) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Activity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning workout"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="">Select a category</option>
              {allCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="30"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this activity"
              rows={3}
            />
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
                disabled={createActivity.isPending || updateActivityMutation.isPending}
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
