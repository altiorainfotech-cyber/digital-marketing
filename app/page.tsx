/**
 * Home Page
 * 
 * Landing page that redirects authenticated users to dashboard
 * and unauthenticated users to sign in
 * 
 * Requirements: 4.1, 4.2, 4.7, 4.9, 11.1
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import Link from 'next/link';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Shield, Zap, Users, CheckCircle } from 'lucide-react';

export default async function Home() {
  const session = await getCurrentSession();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-blue-600/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center animate-fade-in">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              DASCMS
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Digital Asset & SEO Content Management System
            </p>
            
            {/* Value Proposition */}
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Streamline your marketing workflow with powerful asset management, 
              role-based access control, and seamless approval workflows.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center gap-4 animate-slide-in">
              <Link href="/auth/signin">
                <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Feature 1 */}
          <div className="text-center animate-slide-in" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-100 text-blue-600 mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Role-Based Access
            </h3>
            <p className="text-gray-600">
              Secure, granular permissions ensure users only access what they need. 
              Admin, Content Creator, and SEO Specialist roles built-in.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-purple-100 text-purple-600 mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Approval Workflows
            </h3>
            <p className="text-gray-600">
              Streamlined approval process for content review. Track status, 
              manage approvals, and maintain quality control effortlessly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center animate-slide-in" style={{ animationDelay: '300ms' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-green-100 text-green-600 mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Company Organization
            </h3>
            <p className="text-gray-600">
              Multi-company support with isolated data. Perfect for agencies 
              managing multiple clients or enterprise teams.
            </p>
          </div>
        </div>

        {/* Additional Features List */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to manage digital assets
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              'Asset versioning and history',
              'Advanced search and filtering',
              'Usage tracking and analytics',
              'Secure file storage',
              'Real-time notifications',
              'Responsive design',
            ].map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            Built with Next.js, Cloudflare, and Neon PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}

