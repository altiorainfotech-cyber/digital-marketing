/**
 * Chart Components
 * 
 * Wrapper components for Recharts with design system integration.
 * Uses dynamic imports for code splitting.
 */

import dynamic from 'next/dynamic';
import { ChartLoading } from '@/components/loading';

// Dynamic imports for chart components to reduce initial bundle size
export const LineChartWrapper = dynamic(
  () => import('./LineChartWrapper').then((mod) => ({ default: mod.LineChartWrapper })),
  {
    loading: () => <ChartLoading />,
    ssr: false,
  }
);

export const BarChartWrapper = dynamic(
  () => import('./BarChartWrapper').then((mod) => ({ default: mod.BarChartWrapper })),
  {
    loading: () => <ChartLoading />,
    ssr: false,
  }
);

export const PieChartWrapper = dynamic(
  () => import('./PieChartWrapper').then((mod) => ({ default: mod.PieChartWrapper })),
  {
    loading: () => <ChartLoading />,
    ssr: false,
  }
);
