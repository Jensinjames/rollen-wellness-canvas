
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes, endOfDay } from 'date-fns';

interface EnhancedLiveProgressIndicatorProps {
  categoryName: string;
  dailyGoal?: number;
  actualTime: number;
  color: string;
  timeRemaining: number;
  onQuickAdd?: () => void;
}

export const EnhancedLiveProgressIndicator: React.FC<EnhancedLiveProgressIndicatorProps> = ({
  categoryName,
  dailyGoal,
  actualTime,
  color,
  timeRemaining,
  onQuickAdd,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timeout);
  }, [actualTime]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const progress = dailyGoal ? Math.min((actualTime / dailyGoal) * 100, 100) : 0;
  const isOverGoal = dailyGoal ? actualTime > dailyGoal : false;
  const minutesUntilEndOfDay = differenceInMinutes(endOfDay(currentTime), currentTime);

  return (
    <Card className={`border-l-4 transition-all duration-300 hover:shadow-md group ${isAnimating ? 'ring-2 ring-blue-200' : ''}`} 
          style={{ borderLeftColor: color }}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Quick Add */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{categoryName}</h4>
            <div className="flex items-center gap-2">
              {onQuickAdd && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onQuickAdd}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {format(currentTime, 'HH:mm')}
              </div>
            </div>
          </div>

          {/* Target vs Actual Display */}
          {dailyGoal && (
            <div className="bg-gray-50 rounded-lg p-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target: {formatTime(dailyGoal)}</span>
                <span className="font-medium">Logged: {formatTime(actualTime)}</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {dailyGoal && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily Progress</span>
                <span className={isOverGoal ? 'text-green-600 font-medium' : 'text-gray-900'}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                style={{ 
                  backgroundColor: `${color}20`,
                }}
              />
            </div>
          )}

          {/* Time Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color }} />
              <div>
                <p className="text-gray-600">Logged</p>
                <p className={`font-medium ${isAnimating ? 'animate-pulse' : ''}`}>
                  {formatTime(actualTime)}
                </p>
              </div>
            </div>
            
            {dailyGoal && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">
                    {isOverGoal ? 'Exceeded' : 'Remaining'}
                  </p>
                  <p className="font-medium">
                    {isOverGoal 
                      ? `+${formatTime(actualTime - dailyGoal)}`
                      : formatTime(Math.max(0, dailyGoal - actualTime))
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Day Countdown */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Time left today</span>
              <span>{formatTime(minutesUntilEndOfDay)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
