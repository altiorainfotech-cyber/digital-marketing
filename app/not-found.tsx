'use client';

/**
 * 404 Not Found Page
 * 
 * Custom 404 error page with branded styling and navigation
 * 
 * Requirements: 23.7
 */

import Link from 'next/link';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-6">
            <span className="text-6xl font-bold text-blue-600">404</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Page not found
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button variant="primary" size="lg" icon={<Home size={20} />} iconPosition="left">
              Go to Home
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="outline" size="lg" icon={<Search size={20} />} iconPosition="left">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Go back to previous page</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
