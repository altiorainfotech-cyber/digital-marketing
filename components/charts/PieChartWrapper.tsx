/**
 * Pie Chart Wrapper Component
 * 
 * Responsive pie chart component using Recharts.
 * Uses design system colors and provides loading states.
 * 
 * Requirements: 11.2, 11.3, 11.5, 11.6, 24.1, 24.2, 24.5, 24.6
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '@/lib/design-system/tokens/colors';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartWrapperProps {
  data: DataPoint[];
  loading?: boolean;
  emptyMessage?: string;
  height?: number;
  showLabels?: boolean;
  innerRadius?: number;
}

export function PieChartWrapper({
  data,
  loading = false,
  emptyMessage = 'No data available',
  height = 300,
  showLabels = true,
  innerRadius = 0,
}: PieChartWrapperProps) {
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
    colors.primary[300],
    colors.success[300],
    colors.warning[300],
  ];

  // Custom label renderer
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0);
    return `${entry.name}: ${percent}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabels}
          label={showLabels ? renderLabel : false}
          outerRadius={Math.min(height * 0.35, 120)}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || defaultColors[index % defaultColors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
