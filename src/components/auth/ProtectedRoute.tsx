
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
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
        console.warn('⚠️ Authentication check taking longer than expected');
        setShowTimeout(true);
      }
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading authentication...</p>
        {showTimeout && (
          <div className="text-xs text-destructive max-w-md text-center">
            <p>This is taking longer than expected.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
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
    console.error('ProtectedRoute render error:', error);
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
