
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/utils/validation';
import { logAuthEvent, auditLogger } from '@/utils/auditLog';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  // Enhanced authentication state logging
  const logAuthenticationState = (context: string) => {
    console.log(`=== AUTH STATE DIAGNOSTIC [${context}] ===`);
    console.log('Loading:', loading);
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('Session object:', session);
    console.log('Session expires at:', session?.expires_at);
    console.log('Timestamp:', new Date().toISOString());
    console.log('===========================================');
  };

  // Session timeout monitoring (merged from EnhancedAuthContext)
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE EVENT ===');
        console.log('Event:', event);
        console.log('Session:', session);
        console.log('User:', session?.user);
        console.log('==============================');

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setSessionWarningShown(false);

        // Log authentication events
        if (event === 'SIGNED_OUT') {
          await logAuthEvent('auth.logout', session?.user?.id);
          await securityLogger.logAuthEvent('auth.logout', session?.user?.id);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed');
        } else if (event === 'SIGNED_IN') {
          logAuthenticationState('SIGNED_IN_EVENT');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('=== INITIAL SESSION CHECK ===');
      console.log('Initial session:', session);
      console.log('Initial user:', session?.user);
      console.log('=============================');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        logAuthenticationState('INITIAL_SESSION');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      logAuthEvent('auth.signup', undefined, { error: emailValidation.error, email_domain: email.split('@')[1] });
      return { error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      logAuthEvent('auth.signup', undefined, { error: passwordValidation.error });
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
      console.error('=== SIGNUP ERROR ===');
      console.error('Error:', error);
      console.error('===================');
      logAuthEvent('auth.signup', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      logAuthEvent('auth.signup', undefined, { 
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
      logAuthEvent('auth.login', undefined, { error: emailValidation.error });
      return { error };
    }

    // Check for suspicious activity
    if (auditLogger.checkSuspiciousActivity(email)) {
      const error = new Error('Too many failed attempts. Please try again later.');
      return { error };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('=== SIGNIN ERROR ===');
      console.error('Error:', error);
      console.error('===================');
      logAuthEvent('auth.login', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };

  const signOut = async () => {
    logAuthEvent('auth.logout', user?.id);
    await securityLogger.logAuthEvent('auth.logout', user?.id);
    await supabase.auth.signOut();
  };

  // Log authentication state on every render for diagnostics
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logAuthenticationState('RENDER_CYCLE');
    }
  });

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
