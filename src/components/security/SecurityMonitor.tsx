
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedSession } from '@/hooks/useEnhancedSession';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { applySecurityHeaders } from '@/utils/securityHeaders';
import { securityLogger } from '@/utils/enhancedSecurityLogger';

interface SecurityMonitorProps {
  children: React.ReactNode;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ children }) => {
  const { user } = useAuth();
  const { sessionState } = useEnhancedSession();
  const { logSecurityEvent } = useSecurityMonitoring();

  // Apply security headers on mount
  useEffect(() => {
    applySecurityHeaders();
  }, []);

  // Monitor page visibility changes for security
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && user) {
        await securityLogger.logSecurityEvent('security.page_hidden', {
          session_active: sessionState.isActive,
          timestamp: new Date().toISOString(),
        });
      } else if (!document.hidden && user) {
        await securityLogger.logSecurityEvent('security.page_visible', {
          session_active: sessionState.isActive,
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, sessionState.isActive]);

  // Monitor for potential security threats
  useEffect(() => {
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const handleRapidClicks = () => {
      clickCount++;
      clearTimeout(clickTimer);
      
      clickTimer = setTimeout(async () => {
        if (clickCount > 20 && user) { // More than 20 clicks in 1 second
          await logSecurityEvent({
            type: 'sensitive_action',
            resource: 'rapid_clicking_detected',
            details: { 
              click_count: clickCount,
              risk_level: 'medium',
              timestamp: new Date().toISOString(),
            },
          });
        }
        clickCount = 0;
      }, 1000);
    };

    // Monitor for console manipulation attempts
    const originalConsole = { ...console };
    let consoleAccessCount = 0;

    const monitorConsole = () => {
      consoleAccessCount++;
      if (consoleAccessCount > 10) {
        logSecurityEvent({
          type: 'sensitive_action',
          resource: 'console_manipulation',
          details: {
            access_count: consoleAccessCount,
            risk_level: 'high',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Override console methods to detect manipulation
    ['log', 'warn', 'error', 'debug'].forEach(method => {
      console[method as keyof Console] = (...args: any[]) => {
        monitorConsole();
        return (originalConsole[method as keyof typeof originalConsole] as any)(...args);
      };
    });

    document.addEventListener('click', handleRapidClicks);

    return () => {
      document.removeEventListener('click', handleRapidClicks);
      clearTimeout(clickTimer);
      
      // Restore original console
      Object.assign(console, originalConsole);
    };
  }, [user, logSecurityEvent]);

  // Monitor for DevTools detection
  useEffect(() => {
    let devToolsOpen = false;
    
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true;
        if (user) {
          logSecurityEvent({
            type: 'sensitive_action',
            resource: 'devtools_opened',
            details: {
              window_dimensions: {
                outer: { width: window.outerWidth, height: window.outerHeight },
                inner: { width: window.innerWidth, height: window.innerHeight },
              },
              risk_level: 'low',
              timestamp: new Date().toISOString(),
            },
          });
        }
      } else if (!widthThreshold && !heightThreshold && devToolsOpen) {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    return () => clearInterval(interval);
  }, [user, logSecurityEvent]);

  return <>{children}</>;
};
