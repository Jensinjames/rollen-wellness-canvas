
import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType = 
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.login.rate_limited'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset'
  | 'auth.session_expired'
  | 'security.suspicious_activity'
  | 'security.password_policy_violation'
  | 'security.account_locked'
  | 'data.unauthorized_access_attempt'
  | 'data.bulk_operation'
  | 'activity.create'
  | 'activity.update'
  | 'activity.delete'
  | 'validation.input_rejected';

interface SecurityLogDetails {
  ip_address?: string;
  user_agent?: string;
  event_details?: Record<string, any>;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  session_id?: string;
}

class EnhancedSecurityLogger {
  private getBrowserInfo(): Pick<SecurityLogDetails, 'user_agent' | 'ip_address'> {
    if (typeof window === 'undefined') return {};
    
    return {
      user_agent: navigator.userAgent?.slice(0, 500) || 'Unknown',
      // Note: Real IP would come from server headers
      ip_address: 'client-detected',
    };
  }

  async logSecurityEvent(
    eventType: SecurityEventType,
    details: SecurityLogDetails = {},
    userId?: string
  ): Promise<void> {
    try {
      const browserInfo = this.getBrowserInfo();
      const logEntry = {
        event_type: eventType,
        user_id: userId,
        details: {
          ...details.event_details,
          risk_level: details.risk_level || 'low',
          session_id: details.session_id,
          timestamp: new Date().toISOString(),
        },
        ip_address: details.ip_address || browserInfo.ip_address,
        user_agent: details.user_agent || browserInfo.user_agent,
      };

      // Use the database function for secure logging
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: logEntry.details,
        p_ip_address: logEntry.ip_address,
        p_user_agent: logEntry.user_agent,
      });

      if (error && process.env.NODE_ENV === 'development') {
        console.error('Security logging failed:', error);
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Event:', logEntry);
      }

    } catch (error) {
      // Silent fail - security logging should never break the app
      if (process.env.NODE_ENV === 'development') {
        console.error('Security logging error:', error);
      }
    }
  }

  async logAuthEvent(
    eventType: Extract<SecurityEventType, `auth.${string}`>,
    userId?: string,
    additionalDetails?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent(eventType, {
      event_details: additionalDetails,
      risk_level: eventType.includes('failure') || eventType.includes('rate_limited') ? 'medium' : 'low',
    }, userId);
  }

  async logResourceEvent(
    eventType: Extract<SecurityEventType, `activity.${string}`>,
    userId: string,
    resourceId: string,
    additionalDetails?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent(eventType, {
      event_details: {
        resource_id: resourceId,
        ...additionalDetails,
      },
      risk_level: 'low',
    }, userId);
  }

  async logSuspiciousActivity(
    reason: string,
    userId?: string,
    riskLevel: SecurityLogDetails['risk_level'] = 'high'
  ): Promise<void> {
    await this.logSecurityEvent('security.suspicious_activity', {
      event_details: { reason },
      risk_level: riskLevel,
    }, userId);
  }

  async logDataAccessAttempt(
    resource: string,
    userId?: string,
    authorized: boolean = true
  ): Promise<void> {
    if (!authorized) {
      await this.logSecurityEvent('data.unauthorized_access_attempt', {
        event_details: { resource },
        risk_level: 'high',
      }, userId);
    }
  }
}

export const securityLogger = new EnhancedSecurityLogger();
