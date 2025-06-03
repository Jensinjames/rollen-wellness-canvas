
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useCategories';
import { useTimer } from '@/contexts/TimerContext';
import { toast } from 'sonner';
import { Timer } from 'lucide-react';

interface TimerStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimerStartModal: React.FC<TimerStartModalProps> = ({ isOpen, onClose }) => {
  const { data: categories } = useCategories();
  const { startTimer, currentSession } = useTimer();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [notes, setNotes] = useState('');

  // Get available parent categories (level 0)
  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];
  
  // Get subcategories for selected parent
  const selectedParentCategory = parentCategories.find(cat => cat.id === selectedCategoryId);
  const availableSubcategories = selectedParentCategory?.children?.filter(sub => sub.is_active) || [];

  const handleStart = () => {
    if (!selectedCategoryId || !selectedSubcategoryId) {
      toast.error('Please select both a category and subcategory');
      return;
    }

    const category = parentCategories.find(cat => cat.id === selectedCategoryId);
    const subcategory = availableSubcategories.find(sub => sub.id === selectedSubcategoryId);

    if (!category || !subcategory) {
      toast.error('Invalid category selection');
      return;
    }

    startTimer({
      categoryId: selectedCategoryId,
      subcategoryId: selectedSubcategoryId,
      categoryName: category.name,
      subcategoryName: subcategory.name,
      notes,
    });

    // Reset form
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setNotes('');
    onClose();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(''); // Reset subcategory when parent changes
  };

  const handleClose = () => {
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-600" />
            Start Activity Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentSession && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ You already have an active timer running for <strong>{currentSession.categoryName} → {currentSession.subcategoryName}</strong>. 
                Please stop the current timer before starting a new one.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategoryId} disabled={!!currentSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategory *</Label>
            <Select 
              onValueChange={setSelectedSubcategoryId} 
              value={selectedSubcategoryId}
              disabled={!selectedCategoryId || !!currentSession}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedCategoryId 
                    ? "Select a category first" 
                    : availableSubcategories.length === 0
                      ? "No subcategories available - create one first"
                      : "Select a subcategory"
                } />
              </SelectTrigger>
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
            {selectedCategoryId && availableSubcategories.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                No subcategories found. Please create a subcategory for this category first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about what you'll be working on..."
              rows={3}
              disabled={!!currentSession}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleStart}
              disabled={!selectedCategoryId || !selectedSubcategoryId || availableSubcategories.length === 0 || !!currentSession}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Timer className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
