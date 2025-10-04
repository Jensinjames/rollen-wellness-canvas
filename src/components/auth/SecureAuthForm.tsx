
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { validatePasswordStrength } from '@/utils/securityConfig';
import { rateLimiter } from '@/utils/rateLimiter';
import { securityLogger } from '@/utils/enhancedSecurityLogger';
import { LiveRegion } from '@/components/accessibility/LiveRegion';

export const SecureAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!isLogin && value) {
      const validation = validatePasswordStrength(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    try {
      // Check rate limiting
      const identifier = email || 'anonymous';
      const rateCheck = rateLimiter.checkRateLimit(identifier, 5, 60000);
      
      if (!rateCheck.allowed) {
        const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'soon';
        const errorMessage = `Too many attempts. Please try again at ${resetTime}`;
        toast.error(errorMessage);
        setStatusMessage(errorMessage);
        await securityLogger.logAuthEvent(undefined, 'login.rate_limited', false, { 
          email, 
          remaining_attempts: rateCheck.remainingAttempts 
        });
        return;
      }

      if (!email || !password) {
        const errorMessage = 'Please fill in all fields';
        toast.error(errorMessage);
        setStatusMessage(errorMessage);
        return;
      }

      if (!isLogin) {
        // Validate password strength for registration
        const validation = validatePasswordStrength(password);
        if (!validation.isValid) {
          const errorMessage = 'Password does not meet security requirements';
          toast.error(errorMessage);
          setStatusMessage(errorMessage);
          setPasswordErrors(validation.errors);
          await securityLogger.logSecurityEvent('security.password_policy_violation', undefined, {
            event_details: { errors: validation.errors },
            risk_level: 'medium',
          });
          return;
        }

        if (password !== confirmPassword) {
          const errorMessage = 'Passwords do not match';
          toast.error(errorMessage);
          setStatusMessage(errorMessage);
          return;
        }
      }

      let result;
      if (isLogin) {
        setStatusMessage('Signing in...');
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        setStatusMessage('Creating account...');
        result = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (result.error) {
        rateLimiter.recordFailedAttempt(identifier);
        await securityLogger.logAuthEvent(undefined, 'login.failure', false, {
          email,
          error: result.error.message,
          remaining_attempts: rateCheck.remainingAttempts - 1,
        });
        toast.error(result.error.message);
        setStatusMessage(result.error.message);
      } else {
        rateLimiter.recordSuccessfulAttempt(identifier);
        
        if (isLogin) {
          await securityLogger.logAuthEvent(result.data.user?.id, 'login.success', true, { email });
          const successMessage = 'Welcome back!';
          toast.success(successMessage);
          setStatusMessage(successMessage);
        } else {
          await securityLogger.logAuthEvent(result.data.user?.id, 'signup', true, { email });
          const successMessage = 'Account created successfully! Please check your email for verification.';
          toast.success(successMessage);
          setStatusMessage(successMessage);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      rateLimiter.recordFailedAttempt(email || 'anonymous');
      await securityLogger.logAuthEvent(undefined, 'login.failure', false, {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      const errorMessage = 'An unexpected error occurred';
      toast.error(errorMessage);
      setStatusMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LiveRegion message={statusMessage} />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl text-center" id="auth-form-title">
            {isLogin ? 'Welcome back' : 'Create account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="auth-form-title">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-describedby={!email ? undefined : 'email-error'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  aria-describedby={passwordErrors.length > 0 ? 'password-requirements' : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              
              {!isLogin && passwordErrors.length > 0 && (
                <div id="password-requirements" className="text-sm text-destructive space-y-1" role="alert">
                  <p className="font-medium">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  aria-describedby={password !== confirmPassword && confirmPassword ? 'password-mismatch' : undefined}
                />
                {password !== confirmPassword && confirmPassword && (
                  <div id="password-mismatch" className="text-sm text-destructive" role="alert">
                    Passwords do not match
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!isLogin && passwordErrors.length > 0)}
              aria-describedby="form-status"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setPasswordErrors([]);
                setPassword('');
                setConfirmPassword('');
                setStatusMessage('');
              }}
              aria-describedby="auth-switch-description"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
            <div id="auth-switch-description" className="sr-only">
              Switch between sign in and sign up forms
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
