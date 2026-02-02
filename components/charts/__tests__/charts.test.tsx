/**
 * Chart Components Tests
 * 
 * Basic tests for chart wrapper components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineChartWrapper } from '../LineChartWrapper';
import { BarChartWrapper } from '../BarChartWrapper';
import { PieChartWrapper } from '../PieChartWrapper';

describe('Chart Components', () => {
  describe('LineChartWrapper', () => {
    it('should render loading state', () => {
      render(
        <LineChartWrapper
          data={[]}
          lines={[{ dataKey: 'value', name: 'Test' }]}
          loading={true}
        />
      );
      expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <LineChartWrapper
          data={[]}
          lines={[{ dataKey: 'value', name: 'Test' }]}
          emptyMessage="No data"
        />
      );
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render chart with data', () => {
      const data = [
        { name: 'Jan', value: 10 },
        { name: 'Feb', value: 20 },
      ];
      const { container } = render(
        <LineChartWrapper
          data={data}
          lines={[{ dataKey: 'value', name: 'Test' }]}
        />
      );
      // Chart should render ResponsiveContainer
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  describe('BarChartWrapper', () => {
    it('should render loading state', () => {
      render(
        <BarChartWrapper
          data={[]}
          bars={[{ dataKey: 'value', name: 'Test' }]}
          loading={true}
        />
      );
      expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <BarChartWrapper
          data={[]}
          bars={[{ dataKey: 'value', name: 'Test' }]}
          emptyMessage="No data"
        />
      );
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render chart with data', () => {
      const data = [
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
      ];
      const { container } = render(
        <BarChartWrapper
          data={data}
          bars={[{ dataKey: 'value', name: 'Test' }]}
        />
      );
      // Chart should render ResponsiveContainer
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  describe('PieChartWrapper', () => {
    it('should render loading state', () => {
      render(
        <PieChartWrapper
          data={[]}
          loading={true}
        />
      );
      expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <PieChartWrapper
          data={[]}
          emptyMessage="No data"
        />
      );
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render chart with data', () => {
      const data = [
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
      ];
      const { container } = render(
        <PieChartWrapper data={data} />
      );
      // Chart should render ResponsiveContainer
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });
});
