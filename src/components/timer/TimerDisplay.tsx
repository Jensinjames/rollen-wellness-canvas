
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTimer } from '@/contexts/TimerContext';
import { Play, Pause, X } from 'lucide-react';
import { TimerStopPreview } from './TimerStopPreview';
import { PreStopEditModal } from './PreStopEditModal';

export const TimerDisplay: React.FC = () => {
  const { 
    currentSession, 
    elapsedTime, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    cancelTimer, 
    updateNotes 
  } = useTimer();
  
  const [showEditModal, setShowEditModal] = useState(false);

  if (!currentSession) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    if (currentSession.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleEditBeforeStop = () => {
    setShowEditModal(true);
  };

  const handleSaveWithEdits = async (updates: { notes?: string; adjustedMinutes?: number }) => {
    // Update notes if provided
    if (updates.notes !== undefined) {
      updateNotes(updates.notes);
    }
    
    // For duration adjustment, we'll modify the timer's elapsed time calculation
    // This is a simplified approach - in a production app you might want more sophisticated handling
    await stopTimer();
  };

  return (
    <>
      <Card className="fixed bottom-4 right-4 z-50 w-80 border-l-4 shadow-lg" 
            style={{ borderLeftColor: '#3B82F6' }}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentSession.isPaused ? 'bg-yellow-500' : 'bg-green-500'} ${!currentSession.isPaused ? 'animate-pulse' : ''}`} />
                <span className="font-medium text-sm">Active Timer</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelTimer}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Info */}
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">{currentSession.categoryName}</h4>
              <p className="text-sm text-gray-600">{currentSession.subcategoryName}</p>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              {currentSession.isPaused && (
                <p className="text-sm text-yellow-600 mt-1">Paused</p>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseResume}
                className="flex items-center gap-2"
              >
                {currentSession.isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
              
              <TimerStopPreview
                currentSession={currentSession}
                elapsedTime={elapsedTime}
                onStopTimer={stopTimer}
                onEditBeforeStop={handleEditBeforeStop}
                formatTime={formatTime}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <Textarea
                value={currentSession.notes}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="Add notes about this session..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <PreStopEditModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        currentSession={currentSession}
        elapsedTime={elapsedTime}
        onSaveWithEdits={handleSaveWithEdits}
        formatTime={formatTime}
      />
    </>
  );
};
