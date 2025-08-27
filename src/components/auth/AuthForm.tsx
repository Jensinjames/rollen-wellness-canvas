
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { AuthService } from '@/services/authService';
import { useAuthForm } from '@/hooks/useAuthForm';
import { SignInForm } from './forms/SignInForm';
import { SignUpForm } from './forms/SignUpForm';
import { ForgotPasswordForm } from './forms/ForgotPasswordForm';
import { ResetPasswordForm } from './forms/ResetPasswordForm';
import { GoogleSignInButton } from './forms/GoogleSignInButton';
import { DebugAuthTest } from './DebugAuthTest';
import { AlertCircle } from 'lucide-react';

export const AuthForm = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  
  const {
    isLoading,
    error,
    message,
    passwordErrors,
    isGoogleLoading,
    setLoading,
    setGoogleLoading,
    setError,
    setMessage,
    setPasswordErrors,
    clearMessages
  } = useAuthForm();

  // Check for password reset token in URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    if (accessToken && refreshToken && type === 'recovery') {
      setAuthMode('reset');
      clearMessages();
    }
  }, [searchParams, clearMessages]);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    clearMessages();

    const result = await AuthService.processSignIn(
      { email, password },
      signIn
    );

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Sign in failed');
    }

    setLoading(false);
  };

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    clearMessages();

    const result = await AuthService.processSignUp(
      { email, password },
      signUp
    );

    if (result.success) {
      setMessage('Check your email for the confirmation link!');
    } else {
      setError(result.error || 'Sign up failed');
      if (result.errors) {
        setPasswordErrors(result.errors);
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (email: string) => {
    setLoading(true);
    clearMessages();

    const result = await AuthService.processPasswordReset(
      { email },
      resetPassword
    );

    if (result.success) {
      setMessage('Check your email for the password reset link!');
    } else {
      setError(result.error || 'Password reset failed');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearMessages();

    const result = await AuthService.processGoogleSignIn(signInWithGoogle);

    if (!result.success) {
      setError(result.error || 'Google sign in failed');
    }
    // Note: On successful OAuth initiation, user will be redirected to Google
    // and then back to our app, so we don't need to handle success here

    setGoogleLoading(false);
  };

  const handleResetPassword = async (password: string) => {
    setLoading(true);
    clearMessages();

    if (!updatePassword) {
      setError('Password update functionality is not available');
      setLoading(false);
      return;
    }

    const result = await AuthService.processPasswordUpdate(
      { password },
      updatePassword
    );

    if (result.success) {
      setMessage('Password updated successfully! You can now sign in with your new password.');
      // Redirect to home after successful password reset
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } else {
      setError(result.error || 'Password update failed');
      if (result.errors) {
        setPasswordErrors(result.errors);
      }
    }

    setLoading(false);
  };

  const handleShowForgotPassword = () => {
    setAuthMode('forgot');
    clearMessages();
  };

  const handleBackToSignIn = () => {
    setAuthMode('signin');
    clearMessages();
  };

  if (authMode === 'forgot') {
    return (
      <ForgotPasswordForm
        onSubmit={handleForgotPassword}
        onBack={handleBackToSignIn}
        isLoading={isLoading}
        error={error}
        message={message}
      />
    );
  }

  if (authMode === 'reset') {
    return (
      <ResetPasswordForm
        onSubmit={handleResetPassword}
        isLoading={isLoading}
        error={error}
        message={message}
        passwordErrors={passwordErrors}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-6xl flex gap-8">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
            <span className="ml-2 text-2xl font-bold">Rollen</span>
          </div>
          <CardTitle>Welcome to your Wellness Dashboard</CardTitle>
          <CardDescription>
            Track your wellness journey with personalized insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm
                onSubmit={handleSignIn}
                onForgotPassword={handleShowForgotPassword}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm
                onSubmit={handleSignUp}
                isLoading={isLoading}
                passwordErrors={passwordErrors}
              />
            </TabsContent>
          </Tabs>

          <GoogleSignInButton
            onSignIn={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            disabled={isLoading}
          />
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="mt-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <DebugAuthTest />
      </div>
    </div>
  );
};
