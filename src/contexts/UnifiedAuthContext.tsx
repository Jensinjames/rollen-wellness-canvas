import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/validation';
import { securityLogger } from '@/utils/enhancedSecurityLogger';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { shouldShowDebugInfo, safeConsoleLog, safeConsoleError, safeConsoleWarn } from '@/utils/environment';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword?: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  const queryClient = useQueryClient();


  useEffect(() => {
    let isMounted = true;
    if (shouldShowDebugInfo()) {
      safeConsoleLog('🔐 UnifiedAuthProvider initializing...');
    }

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (shouldShowDebugInfo()) {
        safeConsoleLog('🔄 Auth state change:', { event, user: session?.user?.email || 'No user' });
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (event === 'SIGNED_OUT') {
        clearAuthState();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fire-and-forget security logging (non-blocking)
        securityLogger.logAuthEvent(session.user.id, 'login.success', true, { 
          email_domain: session.user.email?.split('@')[1] 
        }).catch(() => {}); // Silent catch to prevent unhandled rejections
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      if (shouldShowDebugInfo()) {
        safeConsoleLog('🔍 Session check result:', session ? '✅ Session exists' : '❌ No session');
      }
      
      if (error) {
        safeConsoleError('❌ Error getting session:', error);
        // Fire-and-forget security logging (non-blocking)
        securityLogger.logAuthEvent(undefined, 'login.failure', false, {
          error: error.message 
        }).catch(() => {}); // Silent catch
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      if (!isMounted) return;
      safeConsoleError('❌ Failed to get session:', error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(undefined, 'signup', false, { 
        error: emailValidation.error, 
        email_domain: email.split('@')[1] 
      }).catch(() => {});
      return { error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(undefined, 'signup', false, { 
        error: passwordValidation.error 
      }).catch(() => {});
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

    // Fire-and-forget logging (non-blocking)
    if (error) {
      securityLogger.logAuthEvent(undefined, 'signup', false, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      }).catch(() => {});
    } else {
      securityLogger.logAuthEvent(undefined, 'signup', true, { 
        email_domain: email.split('@')[1] 
      }).catch(() => {});
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (shouldShowDebugInfo()) {
      safeConsoleLog('Attempting sign in for:', email);
    }
    
    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(undefined, 'login.failure', false, { 
        error: emailValidation.error 
      }).catch(() => {});
      return { error };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        safeConsoleError('Sign in error:', error);
        
        // Provide more specific error messages
        let userFriendlyMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        }
        
        const enhancedError = new Error(userFriendlyMessage);
        
        // Fire-and-forget logging (non-blocking)
        securityLogger.logAuthEvent(undefined, 'login.failure', false, { 
          error: error.message, 
          email_domain: email.split('@')[1] 
        }).catch(() => {});
        
        return { error: enhancedError };
      }

      if (shouldShowDebugInfo()) {
        safeConsoleLog('Sign in successful for:', email);
      }
      return { error: null };
      
    } catch (error: any) {
      safeConsoleError('Unexpected sign in error:', error);
      const enhancedError = new Error('An unexpected error occurred. Please try again.');
      return { error: enhancedError };
    }
  };

  const resetPassword = async (email: string) => {
    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(undefined, 'password_reset', false, { 
        error: emailValidation.error 
      }).catch(() => {});
      return { error };
    }

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    // Fire-and-forget logging (non-blocking)
    if (error) {
      securityLogger.logAuthEvent(undefined, 'password_reset', false, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      }).catch(() => {});
    } else {
      securityLogger.logAuthEvent(undefined, 'password_reset', true, { 
        email_domain: email.split('@')[1] 
      }).catch(() => {});
    }

    return { error };
  };


  const updatePassword = async (password: string) => {
    // Validate password input
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(user?.id, 'password_update', false, { 
        error: passwordValidation.error 
      }).catch(() => {});
      return { error };
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    // Fire-and-forget logging (non-blocking)
    if (error) {
      securityLogger.logAuthEvent(user?.id, 'password_update', false, { 
        error: error.message 
      }).catch(() => {});
    } else {
      securityLogger.logAuthEvent(user?.id, 'password_update', true, {}).catch(() => {});
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Fire-and-forget logging (non-blocking)
      securityLogger.logAuthEvent(user?.id, 'logout', true, {}).catch(() => {});
      clearAuthState();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);

    } catch (error) {
    } finally {
      
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
