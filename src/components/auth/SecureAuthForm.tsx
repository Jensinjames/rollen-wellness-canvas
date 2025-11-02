
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

export const SecureAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

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

    try {
      // Check rate limiting
      const identifier = email || 'anonymous';
      const rateCheck = rateLimiter.checkRateLimit(identifier, 5, 60000);
      
      if (!rateCheck.allowed) {
        const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'soon';
        toast.error(`Too many attempts. Please try again at ${resetTime}`);
        await securityLogger.logAuthEvent('auth.login.rate_limited', undefined, { 
          email, 
          remaining_attempts: rateCheck.remainingAttempts 
        });
        return;
      }

      if (!email || !password) {
        toast.error('Please fill in all fields');
        return;
      }

      if (!isLogin) {
        // Validate password strength for registration
        const validation = validatePasswordStrength(password);
        if (!validation.isValid) {
          toast.error('Password does not meet security requirements');
          setPasswordErrors(validation.errors);
          await securityLogger.logSecurityEvent('security.password_policy_violation', {
            event_details: { errors: validation.errors },
            risk_level: 'medium',
          });
          return;
        }

        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
      }

      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (result.error) {
        rateLimiter.recordFailedAttempt(identifier);
        await securityLogger.logAuthEvent('auth.login.failure', undefined, {
          email,
          error: result.error.message,
          remaining_attempts: rateCheck.remainingAttempts - 1,
        });
        toast.error(result.error.message);
      } else {
        rateLimiter.recordSuccessfulAttempt(identifier);
        
        if (isLogin) {
          await securityLogger.logAuthEvent('auth.login.success', result.data.user?.id, { email });
          toast.success('Welcome back!');
        } else {
          await securityLogger.logAuthEvent('auth.signup', result.data.user?.id, { email });
          toast.success('Account created successfully! Please check your email for verification.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      rateLimiter.recordFailedAttempt(email || 'anonymous');
      await securityLogger.logAuthEvent('auth.login.failure', undefined, {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Welcome back' : 'Create account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!isLogin && passwordErrors.length > 0 && (
                <div className="text-sm text-red-600 space-y-1">
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
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!isLogin && passwordErrors.length > 0)}
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
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
