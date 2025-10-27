import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/validation';
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
    if (isDevelopment()) {
      console.log('🔐 UnifiedAuthProvider initializing...');
    }

    // Set up a timeout to detect if auth check is hanging
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        if (isDevelopment()) {
          console.error('⚠️ Auth check timeout - forcing loading to false');
        }
        setLoading(false);
      }
    }, 8000);

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (isDevelopment()) {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (event === 'SIGNED_OUT') {
        clearAuthState();
      } else if (event === 'SIGNED_IN' && session?.user) {
        securityLogger.logAuthEvent(session.user.id, 'login.success', true, { 
          email_domain: session.user.email?.split('@')[1] 
        }).catch(console.error);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      if (isDevelopment()) {
        console.log('🔍 Session check result:', session ? '✅ Session exists' : '❌ No session');
      }
      
      if (error) {
        if (isDevelopment()) {
          console.error('❌ Error getting session:', error);
        }
        securityLogger.logAuthEvent(undefined, 'login.failure', false, {
          error: error.message 
        }).catch(err => {
          if (isDevelopment()) console.error(err);
        });
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(authTimeout);
    }).catch((error) => {
      if (!isMounted) return;
      if (isDevelopment()) {
        console.error('❌ Failed to get session:', error);
      }
      setLoading(false);
      clearTimeout(authTimeout);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(authTimeout);
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
      await securityLogger.logAuthEvent(undefined, 'signup', false, { 
        error: emailValidation.error, 
        email_domain: email.split('@')[1] 
      });
      return { error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      await securityLogger.logAuthEvent(undefined, 'signup', false, { 
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
      await securityLogger.logAuthEvent(undefined, 'signup', false, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      await securityLogger.logAuthEvent(undefined, 'signup', true, { 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (isDevelopment()) {
      console.log('Attempting sign in for:', email);
    }
    
    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      await securityLogger.logAuthEvent(undefined, 'login.failure', false, { 
        error: emailValidation.error 
      });
      return { error };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (isDevelopment()) {
          console.error('Sign in error:', error);
        }
        
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
        
        await securityLogger.logAuthEvent(undefined, 'login.failure', false, { 
          error: error.message, 
          email_domain: email.split('@')[1] 
        });
        
        return { error: enhancedError };
      }

      if (isDevelopment()) {
        console.log('Sign in successful for:', email);
      }
      return { error: null };
      
    } catch (error: any) {
      if (isDevelopment()) {
        console.error('Unexpected sign in error:', error);
      }
      const enhancedError = new Error('An unexpected error occurred. Please try again.');
      return { error: enhancedError };
    }
  };

  const resetPassword = async (email: string) => {
    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = new Error(emailValidation.error);
      await securityLogger.logAuthEvent(undefined, 'password_reset', false, { 
        error: emailValidation.error 
      });
      return { error };
    }

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      await securityLogger.logAuthEvent(undefined, 'password_reset', false, { 
        error: error.message, 
        email_domain: email.split('@')[1] 
      });
    } else {
      await securityLogger.logAuthEvent(undefined, 'password_reset', true, { 
        email_domain: email.split('@')[1] 
      });
    }

    return { error };
  };


  const updatePassword = async (password: string) => {
    // Validate password input
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.error);
      await securityLogger.logAuthEvent(user?.id, 'password_update', false, { 
        error: passwordValidation.error 
      });
      return { error };
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      await securityLogger.logAuthEvent(user?.id, 'password_update', false, { 
        error: error.message 
      });
    } else {
      await securityLogger.logAuthEvent(user?.id, 'password_update', true, {});
    }

    return { error };
  };

  const signOut = async () => {
    
    try {
      await securityLogger.logAuthEvent(user?.id, 'logout', true, {});
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
