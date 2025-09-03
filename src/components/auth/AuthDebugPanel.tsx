/**
 * Debug panel for authentication issues
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const AuthDebugPanel: React.FC = () => {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  const checkEnvironment = () => {
    const env = {
      supabaseUrl: 'https://dhtgoqoapwxioayzbdfu.supabase.co',
      currentOrigin: window.location.origin,
      pathname: window.location.pathname,
      href: window.location.href,
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      sessionExpiresAt: session?.expires_at,
      isSessionValid: session ? Date.now() < (session.expires_at * 1000) : false
    };
    setDebugInfo(env);
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Direct session check:', { data, error });
      
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log('Direct user check:', { user, error: userError });
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 mb-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={checkEnvironment}
          >
            Check Environment
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testConnection}
          >
            Test Connection
          </Button>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Loading:</span>
            <Badge variant={loading ? "destructive" : "default"}>
              {loading.toString()}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>User:</span>
            <Badge variant={user ? "default" : "destructive"}>
              {user ? 'Present' : 'None'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Session:</span>
            <Badge variant={session ? "default" : "destructive"}>
              {session ? 'Present' : 'None'}
            </Badge>
          </div>
        </div>

        {debugInfo && (
          <div className="mt-4 p-2 bg-white rounded border">
            <pre className="text-xs overflow-auto max-h-32">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};