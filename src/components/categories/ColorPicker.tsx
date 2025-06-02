
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

const colorOptions = [
  '#10B981', // Green (Faith)
  '#F59E0B', // Yellow (Life)
  '#EF4444', // Red (Work)
  '#EC4899', // Pink (Health)
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

// Hex color validation regex
const hexColorRegex = /^#[A-Fa-f0-9]{6}$/;

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, error }) => {
  const [colorError, setColorError] = useState(error || '');

  const validateColor = (color: string) => {
    if (!hexColorRegex.test(color)) {
      setColorError('Color must be a valid 6-digit hex code (e.g., #FF0000)');
      return false;
    }
    setColorError('');
    return true;
  };

  const handleColorChange = (color: string) => {
    onChange(color);
    validateColor(color);
  };

  return (
    <div className="space-y-2">
      <Label>Color</Label>
      <div className="flex gap-2 flex-wrap">
        {colorOptions.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 ${
              value === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
      <div className="mt-2">
        <Label htmlFor="custom-color">Custom Color (Hex)</Label>
        <Input
          id="custom-color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#FF0000"
          className={colorError ? 'border-red-500' : ''}
        />
        {colorError && (
          <p className="text-sm text-red-500 mt-1">{colorError}</p>
        )}
      </div>
    </div>
  );
};
