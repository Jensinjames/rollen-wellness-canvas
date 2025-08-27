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
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword?: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const queryClient = useQueryClient();

  // Temporarily disable session monitoring to prevent blank screen issues
  // TODO: Re-enable with better error handling
  // useEffect(() => {
  //   if (!session || isSigningOut) return;
  //   // Session monitoring code disabled
  // }, [session, user?.id, isSigningOut]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isDevelopment()) {
        console.log('Auth state changed:', event, session?.user?.email);
      }

      // Simplified auth event handling - no async logging that can cause issues
      if (event === 'SIGNED_IN') {
        setIsSigningOut(false);
      } else if (event === 'SIGNED_OUT') {
        if (!isSigningOut) {
          clearAuthState();
        }
      }

      if (!isSigningOut) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isSigningOut]);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setLoading(false);
    
    // Clear all React Query cache
    queryClient.clear();
    
    // Clear Supabase auth tokens
    if (typeof window !== 'undefined') {
      // Clear all Supabase auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
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
    console.log('🚀 UnifiedAuthContext.signIn called with:', { email, hasPassword: !!password });
    
    // TEMPORARY: Bypass email validation for debugging
    console.log('⚠️ Email validation temporarily bypassed for debugging');
    // const emailValidation = validateEmail(email);
    // if (!emailValidation.isValid) {
    //   console.log('❌ Email validation failed:', emailValidation.error);
    //   const error = new Error(emailValidation.error);
    //   await securityLogger.logAuthEvent('auth.login.failure', undefined, { 
    //     error: emailValidation.error 
    //   });
    //   return { error };
    // }

    console.log('🔗 Calling supabase.auth.signInWithPassword...');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📡 Supabase signIn response:', { 
      hasError: !!error, 
      errorMessage: error?.message,
      errorName: error?.name
    });

    if (error) {
      console.log('❌ SignIn failed, logging failure...');
      await securityLogger.logAuthEvent('auth.login.failure', undefined, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      console.log('✅ SignIn successful!');
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

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        await securityLogger.logAuthEvent('auth.oauth.failure', undefined, { 
          error: error.message, 
          provider: 'google' 
        });
      } else {
        await securityLogger.logAuthEvent('auth.oauth.initiate', undefined, { 
          provider: 'google' 
        });
      }

      return { error };
    } catch (error: any) {
      await securityLogger.logAuthEvent('auth.oauth.failure', undefined, { 
        error: error?.message || 'OAuth error', 
        provider: 'google' 
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    // Validate password input
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      await securityLogger.logAuthEvent('auth.password_update', user?.id, { 
        error: passwordValidation.error 
      });
      return { error };
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      await securityLogger.logAuthEvent('auth.password_update', user?.id, { 
        error: error.message 
      });
    } else {
      await securityLogger.logAuthEvent('auth.password_update', user?.id, { 
        success: true 
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
    signInWithGoogle,
    resetPassword,
    updatePassword,
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
