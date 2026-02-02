/**
 * Bar Chart Wrapper Component
 * 
 * Responsive bar chart component using Recharts.
 * Uses design system colors and provides loading states.
 * 
 * Requirements: 11.2, 11.3, 11.5, 11.6, 24.1, 24.2, 24.5, 24.6
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/design-system/tokens/colors';

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface BarConfig {
  dataKey: string;
  name: string;
  color?: string;
}

interface BarChartWrapperProps {
  data: DataPoint[];
  bars: BarConfig[];
  loading?: boolean;
  emptyMessage?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  stacked?: boolean;
}

export function BarChartWrapper({
  data,
  bars,
  loading = false,
  emptyMessage = 'No data available',
  height = 300,
  xAxisLabel,
  yAxisLabel,
  stacked = false,
}: BarChartWrapperProps) {
  // Loading state
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-neutral-50 rounded-lg animate-pulse"
        style={{ height: `${height}px` }}
      >
        <div className="text-neutral-400">Loading chart...</div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-neutral-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-neutral-400 text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  // Default colors from design system
  const defaultColors = [
    colors.primary[500],
    colors.success[500],
    colors.warning[500],
    colors.error[500],
    colors.info[600],
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
        <XAxis 
          dataKey="name" 
          stroke={colors.neutral[600]}
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
        />
        <YAxis 
          stroke={colors.neutral[600]}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || defaultColors[index % defaultColors.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
