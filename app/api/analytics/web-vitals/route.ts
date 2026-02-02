/**
 * Web Vitals Analytics API
 * Receives and logs Core Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, value, rating, delta, id, navigationType } = body;

    // Log to console (in production, you would send to analytics service)
    console.log('Web Vitals Metric:', {
      name,
      value,
      rating,
      delta,
      id,
      navigationType,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      url: request.headers.get('referer'),
    });

    // TODO: Send to analytics service (e.g., Google Analytics, Vercel Analytics, etc.)
    // Example:
    // await analyticsService.track({
    //   event: 'web_vitals',
    //   properties: { name, value, rating, delta, id, navigationType },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}
