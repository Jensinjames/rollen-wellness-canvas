
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, CheckCircle2, Calendar } from 'lucide-react';

interface GoalTypeSelectorProps {
  value: 'time' | 'boolean' | 'both';
  onChange: (value: 'time' | 'boolean' | 'both') => void;
}

export const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Goal Type</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 gap-3"
      >
        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
          <RadioGroupItem value="time" id="time" />
          <div className="flex items-center gap-2 flex-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <Label htmlFor="time" className="font-medium">Time-Based</Label>
              <p className="text-xs text-muted-foreground">
                Track time spent on activities (minutes/hours)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
          <RadioGroupItem value="boolean" id="boolean" />
          <div className="flex items-center gap-2 flex-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <Label htmlFor="boolean" className="font-medium">Completion-Based</Label>
              <p className="text-xs text-muted-foreground">
                Track completion status (done/not done)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
          <RadioGroupItem value="both" id="both" />
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-4 w-4 text-purple-500" />
            <div>
              <Label htmlFor="both" className="font-medium">Both</Label>
              <p className="text-xs text-muted-foreground">
                Track both time and completion status
              </p>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
