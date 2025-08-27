
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { AuthService } from '@/services/authService';
import { useAuthForm } from '@/hooks/useAuthForm';
import { SignInForm } from './forms/SignInForm';
import { SignUpForm } from './forms/SignUpForm';
import { ForgotPasswordForm } from './forms/ForgotPasswordForm';
import { GoogleSignInButton } from './forms/GoogleSignInButton';
import { AlertCircle } from 'lucide-react';

export const AuthForm = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
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

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
    clearMessages();
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    clearMessages();
  };

  if (showForgotPassword) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
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
    </div>
  );
};
