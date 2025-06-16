import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Clock } from "lucide-react";
import { TimerStartModal } from './timer/TimerStartModal';
import { TimerCompletionSummary } from './timer/TimerCompletionSummary';
import { useTimer } from '@/contexts/TimerContext';

export function ActivityTracking() {
  const [showTimerModal, setShowTimerModal] = useState(false);
  const { currentSession, elapsedTime } = useTimer();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNavigateToActivity = () => {
    // This could navigate to an activity details page or activity history
    // For now, we'll just log it - you can implement navigation as needed
    console.log('Navigate to activity details');
  };

  return (
    <>
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            {currentSession ? (
              <Timer className="h-8 w-8 text-blue-600" />
            ) : (
              <Clock className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div>
            {currentSession ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">Timer Active</h3>
                <p className="text-muted-foreground mb-2">
                  Tracking: {currentSession.categoryName} → {currentSession.subcategoryName}
                </p>
                <div className="text-2xl font-mono font-bold text-blue-600 mb-4">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {currentSession.isPaused ? 'Timer is paused' : 'Timer is running'}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No Active Tracking</h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking an activity to monitor your wellness progress in real-time.
                </p>
              </>
            )}
          </div>
          <Button 
            onClick={() => setShowTimerModal(true)}
            disabled={!!currentSession}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full"
          >
            <Timer className="h-4 w-4 mr-2" />
            {currentSession ? 'Timer Running' : 'Start Tracking'}
          </Button>
        </div>
      </Card>

      <TimerStartModal 
        isOpen={showTimerModal} 
        onOpenChange={setShowTimerModal} 
      />
      
      <TimerCompletionSummary 
        onNavigateToActivity={handleNavigateToActivity}
      />
    </>
  );
}
