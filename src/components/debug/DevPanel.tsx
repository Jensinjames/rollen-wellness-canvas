import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { isDevelopment } from '@/utils/environment';

export const DevPanel = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [storageStatus, setStorageStatus] = useState<{
    localStorage: boolean;
    sessionStorage: boolean;
  }>({ localStorage: false, sessionStorage: false });

  useEffect(() => {
    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        setSupabaseStatus(error ? 'error' : 'connected');
      } catch (err) {
        setSupabaseStatus('error');
      }
    };

    // Check storage access
    const checkStorage = () => {
      try {
        localStorage.setItem('_test', 'test');
        localStorage.removeItem('_test');
        sessionStorage.setItem('_test', 'test');
        sessionStorage.removeItem('_test');
        setStorageStatus({ localStorage: true, sessionStorage: true });
      } catch (err) {
        setStorageStatus({
          localStorage: false,
          sessionStorage: false,
        });
      }
    };

    checkSupabase();
    checkStorage();
  }, []);

  // Only show in development
  if (!isDevelopment()) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm z-50 text-xs">
      <div className="font-bold mb-2 text-foreground">🔧 Dev Panel</div>
      
      <div className="space-y-2">
        <div>
          <span className="font-semibold text-muted-foreground">Route:</span>{' '}
          <span className="text-foreground">{location.pathname}</span>
        </div>
        
        <div>
          <span className="font-semibold text-muted-foreground">Auth:</span>{' '}
          {loading ? (
            <span className="text-yellow-500">⏳ Loading...</span>
          ) : user ? (
            <span className="text-green-500">✅ Authenticated</span>
          ) : (
            <span className="text-red-500">❌ Not Authenticated</span>
          )}
        </div>

        {user && (
          <div>
            <span className="font-semibold text-muted-foreground">User ID:</span>{' '}
            <span className="text-foreground font-mono text-[10px]">{user.id.slice(0, 8)}...</span>
          </div>
        )}

        {session && (
          <div>
            <span className="font-semibold text-muted-foreground">Session:</span>{' '}
            <span className="text-green-500">✅ Valid</span>
          </div>
        )}

        <div>
          <span className="font-semibold text-muted-foreground">Supabase:</span>{' '}
          {supabaseStatus === 'checking' ? (
            <span className="text-yellow-500">⏳ Checking...</span>
          ) : supabaseStatus === 'connected' ? (
            <span className="text-green-500">✅ Connected</span>
          ) : (
            <span className="text-red-500">❌ Error</span>
          )}
        </div>

        <div>
          <span className="font-semibold text-muted-foreground">Storage:</span>{' '}
          {storageStatus.localStorage && storageStatus.sessionStorage ? (
            <span className="text-green-500">✅ Accessible</span>
          ) : (
            <span className="text-red-500">❌ Blocked</span>
          )}
        </div>

        <div>
          <span className="font-semibold text-muted-foreground">Env:</span>{' '}
          <span className="text-foreground">
            {window.location.hostname.includes('lovable') ? '🔵 Preview' : '🟢 Local'}
          </span>
        </div>
      </div>
    </div>
  );
};
