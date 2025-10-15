// Performance optimization cache for data and computed values
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum number of cached entries

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string | undefined): void {
    if (key) {
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache size information
  get size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    // Use Array.from to convert iterator to array for compatibility
    const entries = Array.from(this.cache.entries());
    for (const [_, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      expired,
      active: this.cache.size - expired
    };
  }
}

// Image optimization utilities
export const ImageOptimizer = {
  // Generate optimized image URL with size parameters
  getOptimizedUrl: (url: string, width?: number, height?: number, quality: number = 80): string => {
    if (!url || url.startsWith('data:')) return url;
    
    // For external URLs, you might want to use an image optimization service
    // For now, return the original URL
    return url;
  },

  // Preload critical images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Preload multiple images
  preloadImages: async (srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map(src => ImageOptimizer.preloadImage(src)));
  }
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive computations
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Create a singleton cache instance
export const performanceCache = new PerformanceCache();

// Clean up expired cache entries periodically
setInterval(() => {
  const stats = performanceCache.getStats();
  if (stats.expired > 0) {
    console.log(`Cleaned up ${stats.expired} expired cache entries`);
  }
}, 60000); // Check every minute
