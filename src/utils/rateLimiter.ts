
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  isLocked: boolean;
  lockUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      // Remove expired entries
      if (entry.lockUntil && now > entry.lockUntil) {
        this.attempts.delete(key);
      } else if (!entry.isLocked && (now - entry.firstAttempt) > 60000) { // 1 minute window
        this.attempts.delete(key);
      }
    }
  }
  
  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  } {
    this.cleanupExpired();
    
    const now = Date.now();
    const entry = this.attempts.get(identifier);
    
    if (!entry) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        isLocked: false
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }
    
    // Check if currently locked
    if (entry.isLocked) {
      const lockUntil = entry.lockUntil || 0;
      if (now < lockUntil) {
        return { 
          allowed: false, 
          remainingAttempts: 0,
          resetTime: lockUntil
        };
      } else {
        // Lock expired, reset
        this.attempts.delete(identifier);
        this.attempts.set(identifier, {
          count: 1,
          firstAttempt: now,
          isLocked: false
        });
        return { allowed: true, remainingAttempts: maxAttempts - 1 };
      }
    }
    
    // Check if window has expired
    if ((now - entry.firstAttempt) > windowMs) {
      // Reset window
      entry.count = 1;
      entry.firstAttempt = now;
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }
    
    // Increment count
    entry.count++;
    
    if (entry.count > maxAttempts) {
      // Lock the identifier
      entry.isLocked = true;
      entry.lockUntil = now + (15 * 60 * 1000); // 15 minutes
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: entry.lockUntil
      };
    }
    
    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - entry.count 
    };
  }
  
  recordFailedAttempt(identifier: string): void {
    this.checkRateLimit(identifier);
  }
  
  recordSuccessfulAttempt(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  isLocked(identifier: string): boolean {
    const entry = this.attempts.get(identifier);
    if (!entry || !entry.isLocked) return false;
    
    const now = Date.now();
    if (entry.lockUntil && now > entry.lockUntil) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();
