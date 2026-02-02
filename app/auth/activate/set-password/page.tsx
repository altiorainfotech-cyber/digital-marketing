/**
 * Password Creation Page
 * 
 * Allows new users to set their password after successful activation code validation
 * Includes password strength validation and confirmation
 * 
 * Requirements: 5.3, 5.4, 5.7
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useEffect, Suspense } from 'react';
import { Card } from '@/lib/design-system/components/composite/Card/Card';
import { Input } from '@/lib/design-system/components/primitives/Input/Input';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Shield, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'invalid' | 'weak' | 'general'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Too weak',
    color: 'red'
  });

  const email = searchParams.get('email');
  const code = searchParams.get('code');

  // Redirect if email or code is missing
  useEffect(() => {
    if (!email || !code) {
      router.push('/auth/signin');
    }
  }, [email, code, router]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: 'Too weak', color: 'red' });
      return;
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Cap at 4
    score = Math.min(score, 4);

    const strengthMap: Record<number, PasswordStrength> = {
      0: { score: 0, label: 'Too weak', color: 'red' },
      1: { score: 1, label: 'Weak', color: 'orange' },
      2: { score: 2, label: 'Fair', color: 'yellow' },
      3: { score: 3, label: 'Good', color: 'blue' },
      4: { score: 4, label: 'Strong', color: 'green' }
    };

    setPasswordStrength(strengthMap[score]);
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setErrorType('general');

    // Validation
    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      setErrorType('general');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setErrorType('weak');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setErrorType('general');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please use a stronger password with a mix of letters, numbers, and symbols.');
      setErrorType('weak');
      return;
    }

    setIsLoading(true);

    try {
      // Call set password API
      const response = await fetch('/api/auth/activate/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Determine error type based on message
        const errorMessage = data.error || 'Failed to set password. Please try again.';
        
        if (errorMessage.includes('expired')) {
          setErrorType('expired');
        } else if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
          setErrorType('invalid');
        } else if (errorMessage.includes('weak') || errorMessage.includes('strength')) {
          setErrorType('weak');
        } else {
          setErrorType('general');
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success - redirect to login page
      router.push('/auth/signin?activated=true');
    } catch (err) {
      console.error('Password setting error:', err);
      setError('An unexpected error occurred. Please try again.');
      setErrorType('general');
      setIsLoading(false);
    }
  };

  if (!email || !code) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-slide-in">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Shield className="w-8 h-8 text-white" />
          </Link>
        </div>

        {/* Password Creation Card */}
        <Card variant="elevated" padding="lg" className="shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create your password
            </h2>
            <p className="text-gray-600">
              Set a strong password to secure your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-lg border animate-slide-in ${
              errorType === 'expired' 
                ? 'bg-orange-50 border-orange-200' 
                : errorType === 'weak'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  errorType === 'expired'
                    ? 'text-orange-600'
                    : errorType === 'weak'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${
                    errorType === 'expired'
                      ? 'text-orange-800'
                      : errorType === 'weak'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {errorType === 'expired' 
                      ? 'Activation code expired' 
                      : errorType === 'weak'
                      ? 'Password too weak'
                      : errorType === 'invalid'
                      ? 'Invalid activation code'
                      : 'Error'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    errorType === 'expired'
                      ? 'text-orange-700'
                      : errorType === 'weak'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {error}
                  </p>
                  {errorType === 'expired' && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">
                      Please contact your administrator to request a new activation code.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Password Creation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                fullWidth
                autoComplete="new-password"
              />
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1">
                      {password.length >= 8 ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      At least 8 characters
                    </p>
                    <p className="flex items-center gap-1">
                      {/[a-z]/.test(password) && /[A-Z]/.test(password) ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      Uppercase and lowercase letters
                    </p>
                    <p className="flex items-center gap-1">
                      {/\d/.test(password) ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      At least one number
                    </p>
                    <p className="flex items-center gap-1">
                      {/[^a-zA-Z0-9]/.test(password) ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      At least one special character
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading || passwordStrength.score < 2}
              fullWidth
              className="shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Setting password...' : 'Set password and activate'}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </Card>

        {/* Footer Text */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Your password will be securely encrypted
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
