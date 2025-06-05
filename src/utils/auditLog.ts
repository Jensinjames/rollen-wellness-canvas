/**
 * Audit logging system for security monitoring
 */

export type AuditEventType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset'
  | 'activity.create'
  | 'activity.update'
  | 'activity.delete'
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'profile.update'
  | 'preferences.update'
  | 'security.validation_error'
  | 'security.suspicious_activity';

export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'email', 'phone'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getBrowserInfo() {
    if (typeof window === 'undefined') return {};
    
    return {
      user_agent: navigator.userAgent?.slice(0, 200) || 'Unknown',
      // Note: Real IP would come from server, this is just for client logging
      ip_address: 'client-side',
    };
  }

  log(
    eventType: AuditEventType,
    options: {
      userId?: string;
      resourceId?: string;
      details?: Record<string, any>;
    } = {}
  ): void {
    try {
      const entry: AuditLogEntry = {
        event_type: eventType,
        user_id: options.userId,
        resource_id: options.resourceId,
        details: options.details ? this.sanitizeDetails(options.details) : undefined,
        timestamp: new Date().toISOString(),
        ...this.getBrowserInfo(),
      };

      this.logs.push(entry);

      // Keep logs within limit
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Log to console in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit Log:', entry);
      }

      // In production, you might want to send to a logging service
      // this.sendToLoggingService(entry);
    } catch (error) {
      // Silently fail - don't break app if logging fails
      if (process.env.NODE_ENV === 'development') {
        console.error('Audit logging failed:', error);
      }
    }
  }

  // Get recent logs (for admin/debug purposes)
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  // Check for suspicious login patterns based on identifier (email or user ID)
  checkSuspiciousActivity(identifier: string): boolean {
    const recentLogs = this.logs
      .filter(log => log.user_id === identifier || log.details?.identifier === identifier)
      .filter(log => {
        const logTime = new Date(log.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return logTime > fiveMinutesAgo;
      });

    // Check for rapid successive failures
    const recentFailures = recentLogs.filter(log => 
      log.event_type.includes('error') || 
      log.details?.error
    );

    if (recentFailures.length > 10) {
      this.log('security.suspicious_activity', {
        userId: identifier,
        details: { reason: 'rapid_failures', count: recentFailures.length }
      });
      return true;
    }

    return false;
  }

  // Clear logs (for privacy compliance)
  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions
export const logAuthEvent = (eventType: Extract<AuditEventType, `auth.${string}`>, userId?: string, details?: Record<string, any>) => {
  auditLogger.log(eventType, { userId, details });
};

export const logResourceEvent = (
  eventType: AuditEventType, 
  userId: string, 
  resourceId: string, 
  details?: Record<string, any>
) => {
  auditLogger.log(eventType, { userId, resourceId, details });
};

export const logSecurityEvent = (eventType: Extract<AuditEventType, `security.${string}`>, details?: Record<string, any>) => {
  auditLogger.log(eventType, { details });
};
