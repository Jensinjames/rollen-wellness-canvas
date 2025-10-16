import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType = 
  | 'security.validation_error'
  | 'security.suspicious_activity'
  | 'security.password_policy_violation'
  | 'validation.input_rejected'
  | 'session.timeout_warning'
  | 'session.force_logout'
  | 'session.fingerprint_mismatch'
  | string;

interface SecurityEvent {
  event_type: string;
  user_id: string;
  timestamp: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

interface BrowserInfo {
  user_agent: string;
  ip_address: string;
  screen_resolution: string;
  timezone: string;
}

class EnhancedSecurityLogger {
  private async getBrowserInfo(): Promise<BrowserInfo> {
    return {
      user_agent: navigator.userAgent,
      ip_address: 'client', // IP captured server-side
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  async logSecurityEvent(
    eventType: string,
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const browserInfo = await this.getBrowserInfo();

      const logEntry: SecurityEvent = {
        event_type: eventType,
        user_id: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        details: {
          ...details,
          browser_info: browserInfo,
          timestamp: new Date().toISOString(),
        },
        ip_address: details.ip_address || browserInfo.ip_address,
        user_agent: details.user_agent || browserInfo.user_agent,
      };

      // Log to server-side database for tamper-proof audit trail
      try {
        const { error } = await supabase.rpc('log_security_event', {
          p_event_type: eventType,
          p_event_details: logEntry.details,
          p_ip_address: logEntry.ip_address,
          p_user_agent: logEntry.user_agent,
        });

        if (error) {
          console.error('[Security Logger] Server logging failed:', error);
          // Fall back to localStorage if server logging fails
          this.storeLocally(logEntry);
        }
      } catch (error) {
        console.error('[Security Logger] Server logging error:', error);
        // Fall back to localStorage if server logging fails
        this.storeLocally(logEntry);
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Security Audit]', logEntry);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Security Logger] Error:', error);
      }
    }
  }

  private storeLocally(logEntry: SecurityEvent): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      existingLogs.push(logEntry);
      // Keep only last 100 logs
      if (existingLogs.length > 100) {
        existingLogs.shift();
      }
      localStorage.setItem('security_audit_logs', JSON.stringify(existingLogs));
    } catch (e) {
      // localStorage might be full or disabled
    }
  }

  async logAuthEvent(userId: string | undefined, action: string, success: boolean, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent('auth.' + action, userId, {
      success,
      ...details,
    });
  }

  async logResourceEvent(action: string, userId: string, resourceId: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent(action, userId, {
      resource_id: resourceId,
      ...details,
    });
  }

  async logAccessControl(userId: string, resource: string, action: string, allowed: boolean): Promise<void> {
    await this.logSecurityEvent('access_control', userId, {
      resource,
      action,
      allowed,
    });
  }

  getClientLogs(): SecurityEvent[] {
    try {
      return JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearClientLogs(): void {
    localStorage.removeItem('security_audit_logs');
  }
}

export const securityLogger = new EnhancedSecurityLogger();
