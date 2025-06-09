
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/utils/validation';
import { securityLogger } from '@/utils/enhancedSecurityLogger';
import { SECURITY_CONFIG } from '@/utils/securityConfig';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const queryClient = useQueryClient();

  // Session timeout monitoring
  useEffect(() => {
    if (!session || isSigningOut) return;

    const checkSessionExpiry = () => {
      const now = Date.now() / 1000;
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = (expiresAt - now) * 1000;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= SECURITY_CONFIG.SESSION_TIMEOUT_WARNING && !sessionWarningShown) {
        setSessionWarningShown(true);
        console.warn('Session will expire soon. Please save your work.');
      }

      // Auto-logout when session expires
      if (timeUntilExpiry <= 0) {
        securityLogger.logAuthEvent('auth.session_expired', user?.id);
        signOut();
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session, sessionWarningShown, user?.id, isSigningOut]);

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
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state changed:', event, session?.user?.email);
      }

      // Log auth events for audit
      if (event === 'SIGNED_IN') {
        await securityLogger.logAuthEvent('auth.login.success', session?.user?.id);
        setIsSigningOut(false); // Reset signing out state on successful sign in
      } else if (event === 'SIGNED_OUT') {
        await securityLogger.logAuthEvent('auth.logout', user?.id);
        // Only clear state if we're not already handling sign out
        if (!isSigningOut) {
          clearAuthState();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed');
      }

      // Don't update state if we're in the middle of signing out
      if (!isSigningOut) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setSessionWarningShown(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id, isSigningOut]);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setSessionWarningShown(false);
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

  const signOut = async () => {
    // Prevent multiple concurrent sign-out calls
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    
    try {
      // Log the event first
      await securityLogger.logAuthEvent('auth.logout', user?.id);
      
      // Clear local state immediately (don't wait for onAuthStateChange)
      clearAuthState();
      
      // Call Supabase signOut with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);

    } catch (error) {
      console.error('Sign out error:', error);
      // Even if Supabase signOut fails, we've already cleared local state
    } finally {
      setIsSigningOut(false);
      
      // Force navigation to auth page
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
