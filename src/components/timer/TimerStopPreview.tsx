
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Square, Clock, FileText, Edit3 } from 'lucide-react';
import { TimerSession } from '@/contexts/TimerContext';

interface TimerStopPreviewProps {
  currentSession: TimerSession;
  elapsedTime: number;
  onStopTimer: () => Promise<void>;
  onEditBeforeStop?: () => void;
  formatTime: (seconds: number) => string;
}

export const TimerStopPreview: React.FC<TimerStopPreviewProps> = ({
  currentSession,
  elapsedTime,
  onStopTimer,
  onEditBeforeStop,
  formatTime,
}) => {
  const estimatedMinutes = Math.max(1, Math.round(elapsedTime / 60));

  return (
    <HoverCard openDelay={800} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="default"
          size="sm"
          onClick={onStopTimer}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Square className="h-4 w-4" />
          Stop & Save
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="center">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h4 className="font-semibold text-sm">Ready to Save Timer</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{formatTime(elapsedTime)}</span>
              <span className="text-gray-500">({estimatedMinutes} min{estimatedMinutes !== 1 ? 's' : ''})</span>
            </div>
            
            <div className="pl-6">
              <p className="font-medium text-blue-600">{currentSession.categoryName}</p>
              <p className="text-gray-600">{currentSession.subcategoryName}</p>
            </div>
            
            {currentSession.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <p className="text-gray-600 text-xs leading-relaxed">
                  {currentSession.notes.length > 60 
                    ? `${currentSession.notes.substring(0, 60)}...` 
                    : currentSession.notes
                  }
                </p>
              </div>
            )}
          </div>

          {onEditBeforeStop && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditBeforeStop}
                className="w-full flex items-center gap-2 text-xs"
              >
                <Edit3 className="h-3 w-3" />
                Edit Before Saving
              </Button>
            </div>
          )}
          
          <p className="text-xs text-gray-500 pt-1">
            Click "Stop & Save" to automatically log this activity
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
