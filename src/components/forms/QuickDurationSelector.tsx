
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useQuickDurations } from '@/hooks/useQuickDurations';

interface QuickDurationSelectorProps {
  onSelect: (minutes: number) => void;
  selectedValue?: number;
}

export const QuickDurationSelector: React.FC<QuickDurationSelectorProps> = ({
  onSelect,
  selectedValue,
}) => {
  const { quickDurations } = useQuickDurations();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Quick Duration
      </label>
      <div className="grid grid-cols-3 gap-2">
        {quickDurations.map((duration) => (
          <Button
            key={duration.value}
            type="button"
            variant={selectedValue === duration.value ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(duration.value)}
            className="text-xs h-8"
          >
            {duration.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
