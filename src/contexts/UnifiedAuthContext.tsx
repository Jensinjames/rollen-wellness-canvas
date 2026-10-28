
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

  // Session timeout monitoring
  useEffect(() => {
    if (!session) return;

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
  }, [session, sessionWarningShown, user?.id]);

  useEffect(() => {
    let lastUserId: string | undefined;

    // Listen for auth changes. The callback must stay synchronous: awaiting
    // other Supabase calls here deadlocks the auth client and every
    // getSession() call (leaving the app stuck on a spinner).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state changed:', event);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setSessionWarningShown(false);

      // Defer audit logging so it never blocks the auth client.
      const previousUserId = lastUserId;
      lastUserId = session?.user?.id;
      setTimeout(() => {
        if (event === 'SIGNED_IN' && session?.user?.id !== previousUserId) {
          securityLogger.logAuthEvent('auth.login.success', session?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          securityLogger.logAuthEvent('auth.logout', previousUserId);
        }
      }, 0);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      lastUserId = session?.user?.id ?? lastUserId;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    try {
      await securityLogger.logAuthEvent('auth.logout', user?.id);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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
