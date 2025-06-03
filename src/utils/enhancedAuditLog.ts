/**
 * Enhanced audit logging with security event tracking
 */

import { auditLogger, AuditEventType } from './auditLog';

export type SecurityEventType = 
  | 'security.validation_error'
  | 'security.suspicious_activity'
  | 'security.rate_limit_exceeded'
  | 'security.injection_attempt'
  | 'security.xss_attempt'
  | 'security.unauthorized_access'
  | 'security.data_breach_attempt';

export interface SecurityAuditEntry {
  event_type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  timestamp: string;
  mitigation_applied?: boolean;
}

class SecurityAuditLogger {
  private securityLogs: SecurityAuditEntry[] = [];
  private maxLogs = 500;
  private alertThresholds = {
    high_severity_events: 5, // per 10 minutes
    failed_attempts: 10, // per 5 minutes
    suspicious_patterns: 3, // per hour
  };

  private getBrowserInfo() {
    if (typeof window === 'undefined') return {};
    
    return {
      user_agent: navigator.userAgent?.slice(0, 200) || 'Unknown',
      ip_address: 'client-side', // Would be replaced with real IP server-side
    };
  }

  logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, any>,
    options: {
      userId?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      mitigationApplied?: boolean;
    } = {}
  ): void {
    try {
      const { userId, severity = 'medium', mitigationApplied = false } = options;

      const entry: SecurityAuditEntry = {
        event_type: eventType,
        severity,
        user_id: userId,
        details: this.sanitizeSecurityDetails(details),
        timestamp: new Date().toISOString(),
        mitigation_applied: mitigationApplied,
        ...this.getBrowserInfo(),
      };

      this.securityLogs.push(entry);

      // Keep logs within limit
      if (this.securityLogs.length > this.maxLogs) {
        this.securityLogs = this.securityLogs.slice(-this.maxLogs);
      }

      // Also log to main audit system
      auditLogger.log(eventType as AuditEventType, {
        userId,
        details: { ...details, security_severity: severity }
      });

      // Check for alert conditions
      this.checkAlertConditions(entry);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Security Event:', entry);
      }

    } catch (error) {
      // Fail silently but log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Security logging failed:', error);
      }
    }
  }

  private sanitizeSecurityDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or redact sensitive information
    const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'private_key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate long strings to prevent log bloat
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].slice(0, 500) + '...[TRUNCATED]';
      }
    });

    return sanitized;
  }

  private checkAlertConditions(entry: SecurityAuditEntry): void {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for high severity events in last 10 minutes
    const recentHighSeverity = this.securityLogs.filter(log => 
      new Date(log.timestamp) > tenMinutesAgo && 
      (log.severity === 'high' || log.severity === 'critical')
    );

    if (recentHighSeverity.length >= this.alertThresholds.high_severity_events) {
      this.triggerSecurityAlert('high_severity_threshold', {
        count: recentHighSeverity.length,
        threshold: this.alertThresholds.high_severity_events,
        user_id: entry.user_id
      });
    }

    // Check for failed attempts pattern
    const recentFailures = this.securityLogs.filter(log =>
      new Date(log.timestamp) > fiveMinutesAgo &&
      (log.event_type.includes('validation_error') || log.details.error)
    );

    if (recentFailures.length >= this.alertThresholds.failed_attempts) {
      this.triggerSecurityAlert('failed_attempts_threshold', {
        count: recentFailures.length,
        threshold: this.alertThresholds.failed_attempts,
        user_id: entry.user_id
      });
    }
  }

  private triggerSecurityAlert(alertType: string, details: Record<string, any>): void {
    // In a real application, this would trigger actual alerts
    // For now, we'll log it as a critical security event
    this.logSecurityEvent('security.suspicious_activity', {
      alert_type: alertType,
      ...details
    }, { severity: 'critical' });

    if (process.env.NODE_ENV === 'development') {
      console.error('SECURITY ALERT:', alertType, details);
    }
  }

  // Get security logs for analysis
  getSecurityLogs(options: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    eventType?: SecurityEventType;
    userId?: string;
    limit?: number;
  } = {}): SecurityAuditEntry[] {
    const { severity, eventType, userId, limit = 50 } = options;
    
    let filtered = this.securityLogs;

    if (severity) {
      filtered = filtered.filter(log => log.severity === severity);
    }

    if (eventType) {
      filtered = filtered.filter(log => log.event_type === eventType);
    }

    if (userId) {
      filtered = filtered.filter(log => log.user_id === userId);
    }

    return filtered.slice(-limit);
  }

  // Security metrics for monitoring
  getSecurityMetrics() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recent = this.securityLogs.filter(log => 
      new Date(log.timestamp) > last24Hours
    );

    return {
      total_events_24h: recent.length,
      high_severity_events_24h: recent.filter(log => 
        log.severity === 'high' || log.severity === 'critical'
      ).length,
      unique_users_with_events: new Set(recent.map(log => log.user_id).filter(Boolean)).size,
      most_common_events: this.getMostCommonEvents(recent),
      severity_distribution: this.getSeverityDistribution(recent),
    };
  }

  private getMostCommonEvents(logs: SecurityAuditEntry[]) {
    const counts = new Map<string, number>();
    logs.forEach(log => {
      counts.set(log.event_type, (counts.get(log.event_type) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([event, count]) => ({ event, count }));
  }

  private getSeverityDistribution(logs: SecurityAuditEntry[]) {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    logs.forEach(log => {
      distribution[log.severity]++;
    });
    return distribution;
  }

  clearSecurityLogs(): void {
    this.securityLogs = [];
  }
}

// Singleton instance
export const securityAuditLogger = new SecurityAuditLogger();

// Enhanced convenience functions
export const logSecurityEvent = (
  eventType: SecurityEventType, 
  details: Record<string, any>,
  options?: {
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    mitigationApplied?: boolean;
  }
) => {
  securityAuditLogger.logSecurityEvent(eventType, details, options);
};

export const getSecurityMetrics = () => {
  return securityAuditLogger.getSecurityMetrics();
};
