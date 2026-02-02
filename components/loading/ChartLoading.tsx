/**
 * Loading component for Chart components
 * Displays skeleton UI while chart library is being loaded
 */

interface ChartLoadingProps {
  height?: number;
}

export function ChartLoading({ height = 300 }: ChartLoadingProps) {
  return (
    <div
      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-neutral-400 dark:text-neutral-600 text-sm">
        Loading chart...
      </div>
    </div>
  );
}
