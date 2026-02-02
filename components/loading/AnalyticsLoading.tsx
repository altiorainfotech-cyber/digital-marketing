/**
 * Loading component for Analytics Dashboard
 * Displays skeleton UI while analytics components are being loaded
 */

export function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Skeleton */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-neutral-200 rounded mr-3"></div>
              <div className="h-6 bg-neutral-200 rounded w-48"></div>
            </div>
            <div className="flex items-center">
              <div className="h-8 bg-neutral-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* Date Range Selector Skeleton */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-5 bg-neutral-200 rounded w-48"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-neutral-200 rounded w-24"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-neutral-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-32"></div>
                </div>
                <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200"
            >
              <div className="h-6 bg-neutral-200 rounded w-32 mb-4"></div>
              <div className="h-64 bg-neutral-100 rounded"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
