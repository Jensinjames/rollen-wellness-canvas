
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit3, Palette } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { ColorPicker } from './ColorPicker';

interface InlineSubcategoryEditorProps {
  subcategory: Category;
  onSave: (updates: Partial<Category>) => void;
  onCancel: () => void;
}

export const InlineSubcategoryEditor: React.FC<InlineSubcategoryEditorProps> = ({
  subcategory,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: subcategory.name,
    description: subcategory.description || '',
    color: subcategory.color,
    daily_time_goal_minutes: subcategory.daily_time_goal_minutes,
    weekly_time_goal_minutes: subcategory.weekly_time_goal_minutes,
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      daily_time_goal_minutes: formData.daily_time_goal_minutes || undefined,
      weekly_time_goal_minutes: formData.weekly_time_goal_minutes || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Edit3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Edit Subcategory</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Subcategory name"
            className="flex-1"
            autoFocus
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: formData.color }}
            />
          </Button>
        </div>

        {showColorPicker && (
          <ColorPicker
            value={formData.color}
            onChange={(color) => setFormData({ ...formData, color })}
          />
        )}

        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Daily (min)</label>
            <Input
              type="number"
              min="0"
              value={formData.daily_time_goal_minutes || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                daily_time_goal_minutes: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="30"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Weekly (min)</label>
            <Input
              type="number"
              min="0"
              value={formData.weekly_time_goal_minutes || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                weekly_time_goal_minutes: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="300"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {formData.daily_time_goal_minutes && (
              <Badge variant="outline" className="text-xs">
                Daily: {formData.daily_time_goal_minutes}m
              </Badge>
            )}
            {formData.weekly_time_goal_minutes && (
              <Badge variant="outline" className="text-xs">
                Weekly: {Math.floor(formData.weekly_time_goal_minutes / 60)}h {formData.weekly_time_goal_minutes % 60}m
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Press Ctrl+Enter to save, Esc to cancel
      </div>
    </div>
  );
};
