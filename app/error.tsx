/**
 * Error Page
 * 
 * Custom error page (500) with retry option and branded styling
 * 
 * Requirements: 23.7
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* Error Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-6">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          We encountered an unexpected error. Don't worry, our team has been notified 
          and we're working to fix it.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-lg mx-auto">
            <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
            <p className="text-sm text-red-700 font-mono break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="primary" 
            size="lg" 
            icon={<RefreshCw size={20} />} 
            iconPosition="left"
            onClick={reset}
          >
            Try again
          </Button>
          
          <Link href="/">
            <Button variant="outline" size="lg" icon={<Home size={20} />} iconPosition="left">
              Go to Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}
