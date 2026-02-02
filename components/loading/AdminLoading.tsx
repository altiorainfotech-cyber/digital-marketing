/**
 * Loading component for Admin Panel
 * Displays skeleton UI while admin components are being loaded
 */

export function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-6 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
