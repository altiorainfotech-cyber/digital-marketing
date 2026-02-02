/**
 * Sign In Page
 * 
 * Provides login form with email and password authentication
 * Integrates with NextAuth.js for credential-based authentication
 * Also provides activation form for new users to activate their accounts
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 5.1, 5.2, 11.1
 */

'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, Suspense, useEffect } from 'react';
import { Card } from '@/lib/design-system/components/composite/Card/Card';
import { Input } from '@/lib/design-system/components/primitives/Input/Input';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Shield, AlertCircle, LogIn, KeyRound, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

type FormMode = 'login' | 'activate';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ 
    retryAfterMinutes?: number;
    remainingAttempts?: number;
  } | null>(null);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  // Get callback URL or default to home
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');
  const activatedParam = searchParams.get('activated');

  // Countdown timer effect for lockout
  useEffect(() => {
    if (!lockoutEndTime) {
      setCountdownMinutes(0);
      setCountdownSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = lockoutEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setLockoutEndTime(null);
        setRateLimitInfo(null);
        setError('');
        setCountdownMinutes(0);
        setCountdownSeconds(0);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdownMinutes(minutes);
        setCountdownSeconds(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  // Check rate limit when email changes in activation mode
  useEffect(() => {
    if (mode === 'activate' && email && email.includes('@')) {
      const checkRateLimit = async () => {
        try {
          const response = await fetch('/api/auth/activate/rate-limit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!data.allowed && data.retryAfterMinutes) {
            const endTime = new Date();
            endTime.setMinutes(endTime.getMinutes() + data.retryAfterMinutes);
            setLockoutEndTime(endTime);
            setRateLimitInfo({
              retryAfterMinutes: data.retryAfterMinutes,
              remainingAttempts: 0
            });
            setError(`Too many attempts. Please try again in ${data.retryAfterMinutes} minutes.`);
          } else {
            setRateLimitInfo({
              remainingAttempts: data.remainingAttempts
            });
          }
        } catch (err) {
          console.error('Rate limit check error:', err);
        }
      };

      // Debounce the check
      const timer = setTimeout(checkRateLimit, 500);
      return () => clearTimeout(timer);
    }
  }, [email, mode]);

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate input
      if (!email || !password) {
        setError('Email and password are required');
        setIsLoading(false);
        return;
      }

      // Attempt sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Authentication failed
        setError('Invalid email or password');
        setIsLoading(false);
      } else if (result?.ok) {
        // Authentication successful - redirect
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleActivationSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setRateLimitInfo(null);
    setIsLoading(true);

    try {
      // Validate input
      if (!email || !activationCode) {
        setError('Email and activation code are required');
        setIsLoading(false);
        return;
      }

      // Call activation validation API
      const response = await fetch('/api/auth/activate/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: activationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        // Update rate limit info from response
        if (data.retryAfterMinutes) {
          const endTime = new Date();
          endTime.setMinutes(endTime.getMinutes() + data.retryAfterMinutes);
          setLockoutEndTime(endTime);
          setRateLimitInfo({
            retryAfterMinutes: data.retryAfterMinutes,
            remainingAttempts: 0
          });
        } else if (data.remainingAttempts !== undefined) {
          setRateLimitInfo({
            remainingAttempts: data.remainingAttempts
          });
        }
        
        setError(data.error || 'Invalid activation code or email.');
        setIsLoading(false);
        return;
      }

      // Validation successful - redirect to password creation
      router.push(`/auth/activate/set-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(activationCode)}`);
    } catch (err) {
      console.error('Activation validation error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DASCMS
          </h1>
          <p className="mt-2 text-gray-600">Digital Asset & SEO Content Management</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 mb-8 p-1.5 bg-gray-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setActivationCode('');
                  setRateLimitInfo(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('activate');
                  setError('');
                  setPassword('');
                  setRateLimitInfo(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  mode === 'activate'
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <KeyRound className="w-5 h-5" />
                <span>Activate</span>
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? 'Welcome back' : 'Activate Account'}
              </h2>
              <p className="text-gray-600">
                {mode === 'login' 
                  ? 'Sign in to access your dashboard'
                  : 'Enter your code to get started'}
              </p>
            </div>

            {/* Success Message for Activation */}
            {activatedParam && !error && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 animate-slide-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900">
                      Account activated!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      You can now sign in with your credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {(error || errorParam) && (
              <div className={`mb-6 p-4 rounded-xl border animate-slide-in ${
                rateLimitInfo?.retryAfterMinutes 
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    rateLimitInfo?.retryAfterMinutes ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {rateLimitInfo?.retryAfterMinutes ? (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${
                      rateLimitInfo?.retryAfterMinutes ? 'text-yellow-900' : 'text-red-900'
                    }`}>
                      {rateLimitInfo?.retryAfterMinutes ? 'Too many attempts' : (error || 'Authentication failed')}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      rateLimitInfo?.retryAfterMinutes ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {rateLimitInfo?.retryAfterMinutes 
                        ? 'Please wait before trying again.'
                        : 'Please check your credentials and try again.'
                      }
                    </p>
                    {rateLimitInfo?.retryAfterMinutes && lockoutEndTime && (
                      <div className="mt-3 p-3 bg-yellow-100/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-700" />
                          <span className="text-sm font-mono font-semibold text-yellow-900">
                            {countdownMinutes}:{countdownSeconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Attempts Info */}
            {mode === 'activate' && !error && rateLimitInfo?.remainingAttempts !== undefined && rateLimitInfo.remainingAttempts < 5 && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900">
                      {rateLimitInfo.remainingAttempts} {rateLimitInfo.remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Account will be locked for 30 minutes after failed attempts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    fullWidth
                    autoComplete="email"
                  />
                </div>

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
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading}
                  fullWidth
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}

            {/* Activation Form */}
            {mode === 'activate' && (
              <form onSubmit={handleActivationSubmit} className="space-y-5">
                <div>
                  <Input
                    id="activation-email"
                    name="email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    fullWidth
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Input
                    id="activation-code"
                    name="activationCode"
                    type="text"
                    label="Activation Code"
                    placeholder="Enter 6-character code"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    disabled={isLoading}
                    required
                    fullWidth
                    maxLength={6}
                    autoComplete="off"
                    className="font-mono text-lg tracking-widest text-center"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading || (rateLimitInfo?.retryAfterMinutes !== undefined && rateLimitInfo.retryAfterMinutes > 0)}
                  fullWidth
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  {isLoading ? 'Validating...' : 'Continue'}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100">
            <Link 
              href="/" 
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors flex items-center justify-center gap-1"
            >
              <span>←</span>
              <span>Back to home</span>
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-gray-600">Secured by NextAuth.js</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
