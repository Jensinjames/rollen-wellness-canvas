
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePasswordStrength } from '@/utils/securityConfig';
import { secureValidateEmail, secureValidateTextInput, validateRateLimit } from '@/utils/secureValidation';

export const AuthForm = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setPasswordErrors([]);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Rate limiting check
    const rateLimitCheck = await validateRateLimit(
      email || 'anonymous',
      isSignUp ? 'signup' : 'signin',
      { maxAttempts: 5, windowMinutes: 15 }
    );

    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || 'Too many attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    // Enhanced email validation with security checks
    const emailValidation = secureValidateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email address');
      setIsLoading(false);
      return;
    }

    // Enhanced password validation
    const passwordValidation = secureValidateTextInput(password, {
      minLength: 1,
      maxLength: 128,
      fieldName: 'password'
    });

    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Invalid password');
      setIsLoading(false);
      return;
    }

    // Validate password strength for both sign in and sign up with consistent rules
    const passwordStrengthValidation = validatePasswordStrength(password);
    if (!passwordStrengthValidation.isValid) {
      if (isSignUp) {
        setPasswordErrors(passwordStrengthValidation.errors);
        setError('Password does not meet security requirements');
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
      return;
    }

    try {
      const { error } = isSignUp 
        ? await signUp(emailValidation.sanitized!, password)
        : await signIn(emailValidation.sanitized!, password);

      if (error) {
        setError(error.message);
      } else if (isSignUp) {
        setMessage('Check your email for the confirmation link!');
      } else {
        // Successful sign in - redirect to dashboard
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // Rate limiting check
    const rateLimitCheck = await validateRateLimit(
      email || 'anonymous',
      'password_reset',
      { maxAttempts: 3, windowMinutes: 60 }
    );

    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || 'Too many reset attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    // Enhanced email validation with security checks
    const emailValidation = secureValidateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email address');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(emailValidation.sanitized!);

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setMessage(null);

    // Rate limiting check for OAuth
    const rateLimitCheck = await validateRateLimit(
      'google_oauth',
      'oauth',
      { maxAttempts: 10, windowMinutes: 15 }
    );

    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || 'Too many OAuth attempts. Please try again later.');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message);
      }
      // Note: On successful OAuth initiation, user will be redirected to Google
      // and then back to our app, so we don't need to handle success here
    } catch (err) {
      setError('Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl">🎯</span>
              <span className="ml-2 text-2xl font-bold">Rollen</span>
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>

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
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                    setMessage(null);
                  }}
                  disabled={isLoading}
                >
                  Forgot your password?
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    required
                    disabled={isLoading}
                  />
                  {passwordErrors.length > 0 && (
                    <div className="text-sm text-destructive space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {passwordErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || passwordErrors.length > 0}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Google OAuth Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-4"
            >
              {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
          
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
