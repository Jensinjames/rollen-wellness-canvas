
import { useEffect } from 'react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { securityLogger } from '@/utils/enhancedSecurityLogger';

interface SecurityEvent {
  type: 'data_access' | 'bulk_operation' | 'sensitive_action';
  resource: string;
  details?: Record<string, any>;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      await securityLogger.logSecurityEvent(
        event.type === 'data_access' ? 'data.unauthorized_access_attempt' :
        event.type === 'bulk_operation' ? 'data.bulk_operation' :
        'security.suspicious_activity',
        {
          event_details: {
            resource: event.resource,
            ...event.details,
          },
          risk_level: event.type === 'bulk_operation' ? 'medium' : 'low',
        },
        user?.id
      );
    } catch (error) {
      // Silent fail
      console.error('Security monitoring error:', error);
    }
  };

  const monitorDataAccess = (resource: string, authorized: boolean = true) => {
    if (!authorized) {
      logSecurityEvent({
        type: 'data_access',
        resource,
        details: { authorized: false },
      });
    }
  };

  const monitorBulkOperation = (resource: string, count: number) => {
    if (count > 10) { // Threshold for "bulk"
      logSecurityEvent({
        type: 'bulk_operation',
        resource,
        details: { operation_count: count },
      });
    }
  };

  // Monitor for suspicious patterns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Log when user switches away (could indicate automation)
        logSecurityEvent({
          type: 'sensitive_action',
          resource: 'page_visibility',
          details: { hidden: true },
        });
      }
    };

    // Monitor for rapid clicks/actions
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const handleClick = () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount > 10) { // More than 10 clicks in 1 second
          logSecurityEvent({
            type: 'sensitive_action',
            resource: 'rapid_clicking',
            details: { click_count: clickCount },
          });
        }
        clickCount = 0;
      }, 1000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleClick);
      clearTimeout(clickTimer);
    };
  }, [user]);

  return {
    logSecurityEvent,
    monitorDataAccess,
    monitorBulkOperation,
  };
};
