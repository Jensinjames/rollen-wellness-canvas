
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { validateHexColor } from '@/validation';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  parentColor?: string;
  isSubcategory?: boolean;
  error?: string;
}

// Use CSS custom properties from design system
const colorOptions = [
  'hsl(var(--primary))', // Primary color
  'hsl(var(--secondary))', // Secondary color
  '#10B981', // Green (Faith)
  '#F59E0B', // Yellow (Life)
  '#EF4444', // Red (Work)
  '#EC4899', // Pink (Health)
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  parentColor, 
  isSubcategory = false,
  error 
}) => {
  const [colorError, setColorError] = useState(error || '');

  const validateAndSetColor = (color: string) => {
    const validation = validateHexColor(color);
    if (!validation.isValid) {
      setColorError(validation.error || 'Invalid color format');
      return false;
    }
    setColorError('');
    return true;
  };

  const handleColorChange = (color: string) => {
    // Convert HSL to hex for validation if needed
    if (color.startsWith('hsl')) {
      // For now, use a default hex color for HSL values
      // In a real implementation, you'd convert HSL to hex
      onChange('#10B981');
      setColorError('');
    } else {
      if (validateAndSetColor(color)) {
        onChange(color);
      }
    }
  };

  const handleInheritFromParent = () => {
    if (parentColor) {
      handleColorChange(parentColor);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Color</Label>
        {isSubcategory && parentColor && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Parent:</span>
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: parentColor }}
              title={`Parent color: ${parentColor}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInheritFromParent}
              className="h-6 text-xs"
            >
              Inherit
            </Button>
          </div>
        )}
      </div>

      {/* Show inheritance status */}
      {isSubcategory && parentColor && value === parentColor && (
        <Badge variant="secondary" className="text-xs">
          Inherited from parent
        </Badge>
      )}

      <div className="flex gap-2 flex-wrap">
        {colorOptions.map((color, index) => {
          const isSelected = value === color || (color.startsWith('hsl') && index === 0 && value === '#10B981');
          return (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                isSelected ? 'border-foreground ring-2 ring-offset-1' : 'border-border'
              }`}
              style={{ backgroundColor: color.startsWith('hsl') ? undefined : color }}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          );
        })}
      </div>
      
      <div className="mt-2">
        <Label htmlFor="custom-color">Custom Color (Hex)</Label>
        <Input
          id="custom-color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#FF0000"
          className={colorError ? 'border-destructive' : ''}
        />
        {colorError && (
          <p className="text-sm text-destructive mt-1">{colorError}</p>
        )}
      </div>
    </div>
  );
};
