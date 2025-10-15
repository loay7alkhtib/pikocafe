import { useEffect, useState } from 'react';
import { performanceCache } from '../lib/PerformanceCache';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  cacheHitRate: number;
  memoryUsage?: number;
  cacheStats: {
    total: number;
    active: number;
    expired: number;
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !localStorage.getItem('show-perf')) {
      return;
    }

    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
      const renderTime = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      const cacheStats = performanceCache.getStats();
      const cacheHitRate = cacheStats.total > 0 ? ((cacheStats.active / cacheStats.total) * 100) : 0;

      setMetrics({
        loadTime,
        renderTime,
        cacheHitRate,
        cacheStats,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      });
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!metrics || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">⚡ Performance</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
        <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
        <div>Cache: {metrics.cacheHitRate.toFixed(1)}%</div>
        <div>Active: {metrics.cacheStats.active}</div>
        <div>Total: {metrics.cacheStats.total}</div>
        {metrics.memoryUsage && (
          <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [renderStart, setRenderStart] = useState<number>(0);

  useEffect(() => {
    setRenderStart(performance.now());
  }, []);

  const measureRender = (componentName: string) => {
    if (renderStart) {
      const renderTime = performance.now() - renderStart;
      console.log(`🎨 ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  };

  return { measureRender };
}
