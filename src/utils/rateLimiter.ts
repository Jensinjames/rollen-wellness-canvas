import { SECURITY_CONFIG } from './securityConfig';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  failedAttempts: number;
  lastFailure?: number;
}

class SecurityRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  checkRateLimit(
    identifier: string,
    maxRequests: number = SECURITY_CONFIG.API_RATE_LIMIT_MAX_REQUESTS,
    windowMs: number = SECURITY_CONFIG.API_RATE_LIMIT_WINDOW
  ): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  } {
    const now = Date.now();
    const key = this.sanitizeIdentifier(identifier);
    
    let entry = this.store.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        failedAttempts: 0
      };
      this.store.set(key, entry);
    }
    
    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
      // Keep failed attempts for longer tracking
    }
    
    // Check for lockout due to failed attempts
    if (entry.failedAttempts >= SECURITY_CONFIG.LOGIN_ATTEMPTS_MAX) {
      const lockoutEnd = (entry.lastFailure || 0) + SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
      if (now < lockoutEnd) {
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: lockoutEnd
        };
      } else {
        // Reset failed attempts after lockout period
        entry.failedAttempts = 0;
        entry.lastFailure = undefined;
      }
    }
    
    entry.count++;
    
    return {
      allowed: entry.count <= maxRequests,
      remainingAttempts: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  recordFailedAttempt(identifier: string): void {
    const key = this.sanitizeIdentifier(identifier);
    const entry = this.store.get(key) || {
      count: 0,
      resetTime: Date.now() + SECURITY_CONFIG.API_RATE_LIMIT_WINDOW,
      failedAttempts: 0
    };
    
    entry.failedAttempts++;
    entry.lastFailure = Date.now();
    this.store.set(key, entry);
  }

  recordSuccessfulAttempt(identifier: string): void {
    const key = this.sanitizeIdentifier(identifier);
    const entry = this.store.get(key);
    
    if (entry) {
      // Reset failed attempts on successful login
      entry.failedAttempts = 0;
      entry.lastFailure = undefined;
    }
  }

  private sanitizeIdentifier(identifier: string): string {
    // Remove any potentially harmful characters and limit length
    return identifier
      .replace(/[^a-zA-Z0-9@._-]/g, '')
      .substring(0, 100);
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      // Remove entries that are well past their expiration
      const maxAge = Math.max(
        SECURITY_CONFIG.API_RATE_LIMIT_WINDOW,
        SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION
      ) * 2;
      
      if (now > entry.resetTime + maxAge) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export const rateLimiter = new SecurityRateLimiter();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    rateLimiter.destroy();
  });
}
