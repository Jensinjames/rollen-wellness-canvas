
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ExternalLink, X } from 'lucide-react';

interface TimerCompletionData {
  categoryName: string;
  subcategoryName: string;
  duration: number;
  timestamp: string;
  color: string;
}

interface TimerCompletionSummaryProps {
  onNavigateToActivity?: () => void;
}

export const TimerCompletionSummary: React.FC<TimerCompletionSummaryProps> = ({
  onNavigateToActivity,
}) => {
  const [completionData, setCompletionData] = useState<TimerCompletionData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleTimerCompleted = (event: CustomEvent<TimerCompletionData>) => {
      setCompletionData(event.detail);
      setIsVisible(true);
      
      // Auto-dismiss after 8 seconds
      setTimeout(() => setIsVisible(false), 8000);
    };

    window.addEventListener('timerCompleted', handleTimerCompleted as EventListener);
    
    return () => {
      window.removeEventListener('timerCompleted', handleTimerCompleted as EventListener);
    };
  }, []);

  if (!isVisible || !completionData) return null;

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 border-l-4 shadow-lg animate-fade-in" 
          style={{ borderLeftColor: completionData.color }}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-sm text-green-700">Timer Completed</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">{formatTime(completionData.duration)}</span>
              <span className="text-gray-500">logged</span>
            </div>
            
            <div className="pl-6">
              <p className="font-medium" style={{ color: completionData.color }}>
                {completionData.categoryName}
              </p>
              <p className="text-sm text-gray-600">{completionData.subcategoryName}</p>
            </div>
          </div>

          {/* Actions */}
          {onNavigateToActivity && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onNavigateToActivity();
                  setIsVisible(false);
                }}
                className="w-full flex items-center gap-2 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                View Activity Details
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
