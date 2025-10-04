import { supabase } from '@/integrations/supabase/client';

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
    userId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const browserInfo = await this.getBrowserInfo();

      const logEntry: SecurityEvent = {
        event_type: eventType,
        user_id: userId,
        timestamp: new Date().toISOString(),
        details: {
          ...details,
          browser_info: browserInfo,
          timestamp: new Date().toISOString(),
        },
        ip_address: details.ip_address || browserInfo.ip_address,
        user_agent: details.user_agent || browserInfo.user_agent,
      };

      // RPC function doesn't exist in current schema - log client-side only for now
      // TODO: Create secure_log_audit_event RPC function in database
      if (process.env.NODE_ENV === 'development') {
        console.log('[Security Audit]', logEntry);
      }

      // Store in localStorage as fallback (client-side only)
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
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Security Logger] Error:', error);
      }
    }
  }

  async logAuthEvent(userId: string, action: string, success: boolean, details?: Record<string, any>): Promise<void> {
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
