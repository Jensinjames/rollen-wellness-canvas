
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { AuthForm } from './AuthForm';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, show the auth form
  return <AuthForm />;
};
