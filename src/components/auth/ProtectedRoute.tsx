
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { shouldShowDebugInfo, safeConsoleWarn, safeConsoleError } from '@/utils/environment';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showTimeout, setShowTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (loading) {
        safeConsoleWarn('⚠️ Authentication check taking longer than expected (5+ seconds)');
        setShowTimeout(true);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading authentication...</p>
        {showTimeout && (
          <div className="text-xs text-destructive max-w-md text-center space-y-2">
            <p className="font-semibold">Authentication is taking longer than expected.</p>
            <p className="text-muted-foreground">This might be a connection issue or browser storage problem.</p>
            <div className="flex gap-2 justify-center mt-3">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs"
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }} 
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-xs"
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    safeConsoleError('ProtectedRoute render error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Application Error</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};
