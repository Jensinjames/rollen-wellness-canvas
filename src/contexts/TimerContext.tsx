
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCreateActivity } from '@/hooks/useActivities';
import { toast } from 'sonner';

export interface TimerSession {
  id: string;
  categoryId: string;
  subcategoryId: string;
  categoryName: string;
  subcategoryName: string;
  startTime: Date;
  pausedDuration: number;
  isActive: boolean;
  isPaused: boolean;
  notes: string;
}

interface TimerContextType {
  currentSession: TimerSession | null;
  elapsedTime: number;
  startTimer: (session: Omit<TimerSession, 'id' | 'startTime' | 'pausedDuration' | 'isActive' | 'isPaused'>) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  cancelTimer: () => void;
  updateNotes: (notes: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY = 'wellness_timer_session';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const createActivity = useCreateActivity();

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        session.startTime = new Date(session.startTime);
        setCurrentSession(session);
      } catch (error) {
        console.error('Error loading saved timer session:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentSession]);

  // Update elapsed time every second
  useEffect(() => {
    if (!currentSession || !currentSession.isActive || currentSession.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000) - currentSession.pausedDuration;
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const startTimer = useCallback((sessionData: Omit<TimerSession, 'id' | 'startTime' | 'pausedDuration' | 'isActive' | 'isPaused'>) => {
    const newSession: TimerSession = {
      ...sessionData,
      id: crypto.randomUUID(),
      startTime: new Date(),
      pausedDuration: 0,
      isActive: true,
      isPaused: false,
    };
    
    setCurrentSession(newSession);
    setElapsedTime(0);
    
    // Dispatch custom event for dashboard updates
    window.dispatchEvent(new CustomEvent('timerStarted', { 
      detail: { 
        categoryName: sessionData.categoryName,
        subcategoryName: sessionData.subcategoryName 
      } 
    }));
    
    toast.success(`Timer started for ${sessionData.categoryName} → ${sessionData.subcategoryName}`);
  }, []);

  const pauseTimer = useCallback(() => {
    if (currentSession && currentSession.isActive && !currentSession.isPaused) {
      setCurrentSession(prev => prev ? { ...prev, isPaused: true } : null);
      toast.info('Timer paused');
    }
  }, [currentSession]);

  const resumeTimer = useCallback(() => {
    if (currentSession && currentSession.isActive && currentSession.isPaused) {
      const now = new Date();
      const pauseStartTime = new Date(currentSession.startTime.getTime() + (currentSession.pausedDuration + elapsedTime) * 1000);
      const additionalPausedTime = Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
      
      setCurrentSession(prev => prev ? {
        ...prev,
        isPaused: false,
        pausedDuration: prev.pausedDuration + additionalPausedTime
      } : null);
      
      toast.info('Timer resumed');
    }
  }, [currentSession, elapsedTime]);

  const stopTimer = useCallback(async () => {
    if (!currentSession || !currentSession.isActive) return;

    try {
      const finalElapsedMinutes = Math.max(1, Math.round(elapsedTime / 60)); // Minimum 1 minute
      
      await createActivity.mutateAsync({
        category_id: currentSession.subcategoryId, // Use subcategoryId as category_id
        date_time: currentSession.startTime.toISOString(),
        duration_minutes: finalElapsedMinutes,
        notes: currentSession.notes || undefined,
      } as any);

      // Dispatch custom event for real-time dashboard updates
      window.dispatchEvent(new CustomEvent('timerCompleted', {
        detail: {
          categoryId: currentSession.categoryId,
          subcategoryId: currentSession.subcategoryId,
          categoryName: currentSession.categoryName,
          subcategoryName: currentSession.subcategoryName,
          duration: finalElapsedMinutes,
          timestamp: currentSession.startTime.toISOString(),
        }
      }));

      setCurrentSession(null);
      setElapsedTime(0);
      
      toast.success(`Timer stopped! Logged ${finalElapsedMinutes} minutes to ${currentSession.categoryName} → ${currentSession.subcategoryName}`);
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to save timer session');
    }
  }, [currentSession, elapsedTime, createActivity]);

  const cancelTimer = useCallback(() => {
    if (currentSession) {
      setCurrentSession(null);
      setElapsedTime(0);
      toast.info('Timer cancelled');
    }
  }, [currentSession]);

  const updateNotes = useCallback((notes: string) => {
    setCurrentSession(prev => prev ? { ...prev, notes } : null);
  }, []);

  return (
    <TimerContext.Provider value={{
      currentSession,
      elapsedTime,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      cancelTimer,
      updateNotes,
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
