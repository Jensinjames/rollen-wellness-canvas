import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/utils/validation';
import { securityLogger } from '@/utils/enhancedSecurityLogger';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { isDevelopment } from '@/utils/environment';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const queryClient = useQueryClient();

  // Enhanced session monitoring with fingerprint validation
  useEffect(() => {
    if (!session || isSigningOut) return;

    const checkSessionSecurity = () => {
      // Validate session fingerprint
      if (!secureSessionManager.validateFingerprint()) {
        securityLogger.logAuthEvent('auth.session_hijack_detected', user?.id);
        signOut();
        return;
      }

      // Check session validity
      const sessionStatus = secureSessionManager.validateSession(user?.id);
      
      if (sessionStatus.shouldLogout) {
        signOut();
        return;
      }

      if (sessionStatus.shouldWarn && !isDevelopment()) {
        // Show session warning in production
        console.warn('Session will expire soon. Please save your work.');
      }
    };

    const interval = setInterval(checkSessionSecurity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session, user?.id, isSigningOut]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isDevelopment()) {
        console.log('Auth state changed:', event, session?.user?.email);
      }

      // Log auth events for audit
      if (event === 'SIGNED_IN') {
        await securityLogger.logAuthEvent('auth.login.success', session?.user?.id);
        secureSessionManager.refreshSession();
        setIsSigningOut(false);
      } else if (event === 'SIGNED_OUT') {
        await securityLogger.logAuthEvent('auth.logout', user?.id);
        secureSessionManager.invalidateSession();
        if (!isSigningOut) {
          clearAuthState();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        secureSessionManager.refreshSession();
        if (isDevelopment()) {
          console.log('Session refreshed');
        }
      }

      if (!isSigningOut) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id, isSigningOut]);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setLoading(false);
    
    // Clear all React Query cache
    queryClient.clear();
    
    // Clear any localStorage/sessionStorage if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
  };

  const signUp = async (email: string, password: string) => {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      await securityLogger.logAuthEvent('auth.signup', undefined, { 
        error: emailValidation.error, 
        email_domain: email.split('@')[1] 
      });
      return { error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      await securityLogger.logAuthEvent('auth.signup', undefined, { 
        error: passwordValidation.error 
      });
      return { error };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      await securityLogger.logAuthEvent('auth.signup', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      await securityLogger.logAuthEvent('auth.signup', undefined, { 
        success: true, 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      await securityLogger.logAuthEvent('auth.login.failure', undefined, { 
        error: emailValidation.error 
      });
      return { error };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await securityLogger.logAuthEvent('auth.login.failure', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      await securityLogger.logAuthEvent('auth.password_reset', undefined, { 
        error: emailValidation.error 
      });
      return { error };
    }

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      await securityLogger.logAuthEvent('auth.password_reset', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      await securityLogger.logAuthEvent('auth.password_reset', undefined, { 
        success: true, 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };

  const signOut = async () => {
    // Prevent multiple concurrent sign-out calls
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    
    try {
      await securityLogger.logAuthEvent('auth.logout', user?.id);
      clearAuthState();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);

    } catch (error) {
      if (isDevelopment()) {
        console.error('Sign out error:', error);
      }
    } finally {
      setIsSigningOut(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
