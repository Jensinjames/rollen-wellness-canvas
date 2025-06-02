
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimeGoalPresetsProps {
  onSelectDaily: (minutes: number) => void;
  onSelectWeekly: (minutes: number) => void;
}

export const TimeGoalPresets: React.FC<TimeGoalPresetsProps> = ({
  onSelectDaily,
  onSelectWeekly,
}) => {
  const dailyPresets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
  ];

  const weeklyPresets = [
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '5 hours', value: 300 },
    { label: '7 hours', value: 420 },
    { label: '10 hours', value: 600 },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Daily Presets</p>
        <div className="flex flex-wrap gap-2">
          {dailyPresets.map((preset) => (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              onClick={() => onSelectDaily(preset.value)}
              className="h-8 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Weekly Presets</p>
        <div className="flex flex-wrap gap-2">
          {weeklyPresets.map((preset) => (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              onClick={() => onSelectWeekly(preset.value)}
              className="h-8 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
