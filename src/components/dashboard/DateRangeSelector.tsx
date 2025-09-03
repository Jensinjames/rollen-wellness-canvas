import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangeType = '1D' | '7D' | '30D' | '90D' | '6M' | '1Y' | '3Y';

interface DateRangeSelectorProps {
  selectedRange: DateRangeType;
  onRangeChange: (range: DateRangeType) => void;
  className?: string;
}

const dateRangeOptions: { value: DateRangeType; label: string; description: string }[] = [
  { value: '1D', label: 'Today', description: 'Current day' },
  { value: '7D', label: '7D', description: 'Last 7 days' },
  { value: '30D', label: '30D', description: 'Last 30 days' },
  { value: '90D', label: '90D', description: 'Last 3 months' },
  { value: '6M', label: '6M', description: 'Last 6 months' },
  { value: '1Y', label: '1Y', description: 'Last year' },
  { value: '3Y', label: '3Y', description: 'Last 3 years' }
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = memo(({
  selectedRange,
  onRangeChange,
  className
}) => {
  const getDateRangeDescription = () => {
    const option = dateRangeOptions.find(opt => opt.value === selectedRange);
    return option?.description || '';
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Range</span>
          <span className="text-xs text-muted-foreground">
            ({getDateRangeDescription()})
          </span>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {dateRangeOptions.map((option) => {
            const isSelected = selectedRange === option.value;
            const isToday = option.value === '1D';
            
            return (
              <Button
                key={option.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onRangeChange(option.value)}
                className={cn(
                  "relative",
                  isToday && "bg-primary/10 border-primary text-primary hover:bg-primary/20",
                  isSelected && isToday && "bg-primary text-primary-foreground"
                )}
              >
                {isToday && (
                  <Clock className="w-3 h-3 absolute -top-1 -right-1" />
                )}
                {option.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

DateRangeSelector.displayName = 'DateRangeSelector';

export { DateRangeSelector };