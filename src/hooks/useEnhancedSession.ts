
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ENHANCED_SECURITY_CONFIG } from '@/utils/securityHeaders';
import { securityLogger } from '@/utils/enhancedSecurityLogger';

interface SessionState {
  isActive: boolean;
  expiresAt: number | null;
  warningShown: boolean;
  lastActivity: number;
}

export const useEnhancedSession = () => {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: !!user,
    expiresAt: null,
    warningShown: false,
    lastActivity: Date.now(),
  });

  // Track user activity
  const updateActivity = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      lastActivity: Date.now(),
      warningShown: false,
    }));
  }, []);

  // Refresh session proactively
  const refreshSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        await securityLogger.logSecurityEvent('auth.session_refresh_failed', {
          error: error.message,
        });
        return false;
      }

      if (data.session) {
        setSessionState(prev => ({
          ...prev,
          expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : null,
          warningShown: false,
        }));
        
        await securityLogger.logSecurityEvent('auth.session_refreshed', {
          expires_at: data.session.expires_at,
        });
        
        return true;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
    return false;
  }, [user]);

  // Show session warning
  const showSessionWarning = useCallback(() => {
    if (sessionState.warningShown) return;

    toast.warning('Session Expiring Soon', {
      description: 'Your session will expire in 5 minutes. Continue working to extend it.',
      duration: 10000,
      action: {
        label: 'Extend Session',
        onClick: () => {
          updateActivity();
          refreshSession();
        },
      },
    });

    setSessionState(prev => ({ ...prev, warningShown: true }));
  }, [sessionState.warningShown, updateActivity, refreshSession]);

  // Monitor session expiry
  useEffect(() => {
    if (!user || !sessionState.expiresAt) return;

    const checkSession = () => {
      const now = Date.now();
      const timeUntilExpiry = sessionState.expiresAt! - now;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= ENHANCED_SECURITY_CONFIG.SESSION_SECURITY.REFRESH_THRESHOLD && 
          timeUntilExpiry > 0 && 
          !sessionState.warningShown) {
        showSessionWarning();
      }

      // Auto-refresh if user is active and session is expiring soon
      if (timeUntilExpiry <= ENHANCED_SECURITY_CONFIG.SESSION_SECURITY.REFRESH_THRESHOLD && 
          timeUntilExpiry > 0 && 
          (now - sessionState.lastActivity) < 60000) { // Active within last minute
        refreshSession();
      }
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, sessionState, showSessionWarning, refreshSession]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Initialize session state
  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionState(prev => ({
            ...prev,
            isActive: true,
            expiresAt: session.expires_at ? session.expires_at * 1000 : null,
          }));
        }
      });
    } else {
      setSessionState({
        isActive: false,
        expiresAt: null,
        warningShown: false,
        lastActivity: Date.now(),
      });
    }
  }, [user]);

  return {
    sessionState,
    refreshSession,
    updateActivity,
  };
};
