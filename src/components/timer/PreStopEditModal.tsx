
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TimerSession } from '@/contexts/TimerContext';
import { Save, X } from 'lucide-react';

interface PreStopEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSession: TimerSession;
  elapsedTime: number;
  onSaveWithEdits: (updates: { notes?: string; adjustedMinutes?: number }) => Promise<void>;
  formatTime: (seconds: number) => string;
}

export const PreStopEditModal: React.FC<PreStopEditModalProps> = ({
  isOpen,
  onOpenChange,
  currentSession,
  elapsedTime,
  onSaveWithEdits,
  formatTime,
}) => {
  const [notes, setNotes] = useState(currentSession.notes || '');
  const [adjustedMinutes, setAdjustedMinutes] = useState(Math.max(1, Math.round(elapsedTime / 60)));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveWithEdits({
        notes: notes.trim() || undefined,
        adjustedMinutes: adjustedMinutes > 0 ? adjustedMinutes : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving timer with edits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Quick Edit Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-blue-600">{currentSession.categoryName}</p>
            <p className="text-sm text-gray-600">{currentSession.subcategoryName}</p>
            <p className="text-xs text-gray-500 mt-1">
              Original time: {formatTime(elapsedTime)}
            </p>
          </div>

          {/* Duration Adjustment */}
          <div className="space-y-2">
            <Label htmlFor="adjusted-minutes">Duration (minutes)</Label>
            <Input
              id="adjusted-minutes"
              type="number"
              min="1"
              max="1440"
              value={adjustedMinutes}
              onChange={(e) => setAdjustedMinutes(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Adjust if needed (original: {Math.round(elapsedTime / 60)} minutes)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Timer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
