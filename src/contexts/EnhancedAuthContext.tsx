
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { securityLogger } from '@/utils/enhancedSecurityLogger';
import { SECURITY_CONFIG } from '@/utils/securityConfig';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const EnhancedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  const signOut = async () => {
    try {
      await securityLogger.logAuthEvent('auth.logout', user?.id);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        
        // You could show a toast or modal here
        // toast.warning('Your session will expire in 5 minutes. Please save your work.');
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
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setSessionWarningShown(false);

      // Log authentication events
      if (event === 'SIGNED_OUT') {
        await securityLogger.logAuthEvent('auth.logout', session?.user?.id);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};
