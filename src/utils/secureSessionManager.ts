
import { SECURITY_CONFIG } from './securityConfig';
import { securityLogger, SecurityEventType } from './enhancedSecurityLogger';

interface SessionFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
}

class SecureSessionManager {
  private sessionFingerprint: SessionFingerprint | null = null;
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private warningShown: boolean = false;

  constructor() {
    this.generateFingerprint();
    this.startActivityMonitoring();
  }

  private generateFingerprint(): void {
    if (typeof window === 'undefined') return;

    try {
      this.sessionFingerprint = {
        userAgent: navigator.userAgent.substring(0, 100), // Limit length
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };
    } catch (error) {
      console.error('Failed to generate session fingerprint:', error);
    }
  }

  private startActivityMonitoring(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      this.warningShown = false;
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  validateSession(userId?: string): {
    isValid: boolean;
    shouldWarn: boolean;
    shouldLogout: boolean;
    timeRemaining?: number;
  } {
    const now = Date.now();
    const sessionAge = now - this.sessionStartTime;
    const timeSinceActivity = now - this.lastActivityTime;

    // Check if session has expired
    if (sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT_DURATION) {
      this.logSecurityEvent('security.session_expired', userId);
      return {
        isValid: false,
        shouldWarn: false,
        shouldLogout: true
      };
    }

    // Check if user has been inactive too long
    if (timeSinceActivity > SECURITY_CONFIG.SESSION_TIMEOUT_DURATION) {
      this.logSecurityEvent('security.session_inactive_timeout', userId);
      return {
        isValid: false,
        shouldWarn: false,
        shouldLogout: true
      };
    }

    // Check if we should show warning
    const timeUntilExpiry = SECURITY_CONFIG.SESSION_TIMEOUT_DURATION - sessionAge;
    const shouldWarn = timeUntilExpiry <= SECURITY_CONFIG.SESSION_TIMEOUT_WARNING && !this.warningShown;

    if (shouldWarn) {
      this.warningShown = true;
      this.logSecurityEvent('security.session_warning_shown', userId);
    }

    return {
      isValid: true,
      shouldWarn,
      shouldLogout: false,
      timeRemaining: timeUntilExpiry
    };
  }

  validateFingerprint(): boolean {
    if (!this.sessionFingerprint || typeof window === 'undefined') {
      return true; // Skip validation if fingerprint not available
    }

    try {
      const currentFingerprint: SessionFingerprint = {
        userAgent: navigator.userAgent.substring(0, 100),
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };

      // Allow some flexibility in fingerprint matching
      const criticalMismatch = 
        currentFingerprint.userAgent !== this.sessionFingerprint.userAgent ||
        currentFingerprint.timezone !== this.sessionFingerprint.timezone;

      if (criticalMismatch) {
        this.logSecurityEvent('security.session_fingerprint_mismatch');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Fingerprint validation error:', error);
      return true; // Allow session to continue on validation error
    }
  }

  refreshSession(): void {
    this.lastActivityTime = Date.now();
    this.warningShown = false;
  }

  invalidateSession(): void {
    this.sessionStartTime = 0;
    this.lastActivityTime = 0;
    this.sessionFingerprint = null;
    this.warningShown = false;
  }

  private async logSecurityEvent(eventType: SecurityEventType, userId?: string): Promise<void> {
    try {
      await securityLogger.logSecurityEvent(eventType, {
        event_details: {
          session_age: Date.now() - this.sessionStartTime,
          time_since_activity: Date.now() - this.lastActivityTime,
          fingerprint_available: !!this.sessionFingerprint
        },
        risk_level: 'medium'
      }, userId);
    } catch (error) {
      // Silent fail to prevent breaking session functionality
      console.error('Failed to log security event:', error);
    }
  }
}

export const secureSessionManager = new SecureSessionManager();
