
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
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
