const REPORTING_INTERVAL = 30000;

export function initMonitoring() {
  if (typeof window === 'undefined') return;

  if ('performance' in window && 'getEntriesByType' in performance) {
    setTimeout(() => {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        console.log(`[Perf] ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
      });

      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0] as PerformanceNavigationTiming;
        console.log(`[Perf] Page load: ${nav.loadEventEnd.toFixed(2)}ms`);
      }
    }, REPORTING_INTERVAL);
  }

  window.addEventListener('error', (event) => {
    console.error('[Error]', event.error?.message || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledRejection]', event.reason);
  });
}
