import { QueryClient } from '@tanstack/react-query';

// Create a client with production-ready defaults
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests up to 2 times
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        // Retry with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        // Retry with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

// Query keys for consistent caching
export const queryKeys = {
  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  
  // Items
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
    byCategory: (categoryId: string) => [...queryKeys.items.all, 'category', categoryId] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
  
  // Media
  media: {
    all: ['media'] as const,
    upload: (key: string) => [...queryKeys.media.all, 'upload', key] as const,
    download: (key: string) => [...queryKeys.media.all, 'download', key] as const,
  },
  
  // Health
  health: {
    all: ['health'] as const,
    check: () => [...queryKeys.health.all, 'check'] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  categories: {
    all: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    list: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() }),
    detail: (queryClient: QueryClient, id: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) }),
  },
  
  items: {
    all: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
    list: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() }),
    detail: (queryClient: QueryClient, id: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) }),
    byCategory: (queryClient: QueryClient, categoryId: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.items.byCategory(categoryId) }),
  },
  
  orders: {
    all: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    list: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() }),
    detail: (queryClient: QueryClient, id: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) }),
  },
} as const;

// Optimistic update helpers
export const optimisticUpdates = {
  category: {
    create: (queryClient: QueryClient, newCategory: any) => {
      queryClient.setQueryData(queryKeys.categories.lists(), (old: any[] = []) => [...old, newCategory]);
    },
    
    update: (queryClient: QueryClient, id: string, updates: any) => {
      queryClient.setQueryData(queryKeys.categories.detail(id), updates);
      queryClient.setQueryData(queryKeys.categories.lists(), (old: any[] = []) =>
        old.map(category => category.id === id ? { ...category, ...updates } : category)
      );
    },
    
    delete: (queryClient: QueryClient, id: string) => {
      queryClient.setQueryData(queryKeys.categories.lists(), (old: any[] = []) =>
        old.filter(category => category.id !== id)
      );
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) });
    },
  },
  
  item: {
    create: (queryClient: QueryClient, newItem: any) => {
      queryClient.setQueryData(queryKeys.items.lists(), (old: any[] = []) => [...old, newItem]);
      if (newItem.category_id) {
        queryClient.setQueryData(queryKeys.items.byCategory(newItem.category_id), (old: any[] = []) => [...old, newItem]);
      }
    },
    
    update: (queryClient: QueryClient, id: string, updates: any) => {
      queryClient.setQueryData(queryKeys.items.detail(id), updates);
      queryClient.setQueryData(queryKeys.items.lists(), (old: any[] = []) =>
        old.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      
      // Update in category-specific queries
      queryClient.getQueriesData({ queryKey: queryKeys.items.byCategory('') }).forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(queryKey, data.map((item: any) => 
            item.id === id ? { ...item, ...updates } : item
          ));
        }
      });
    },
    
    delete: (queryClient: QueryClient, id: string) => {
      queryClient.setQueryData(queryKeys.items.lists(), (old: any[] = []) =>
        old.filter(item => item.id !== id)
      );
      
      // Remove from category-specific queries
      queryClient.getQueriesData({ queryKey: queryKeys.items.byCategory('') }).forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          queryClient.setQueryData(queryKey, data.filter((item: any) => item.id !== id));
        }
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.items.detail(id) });
    },
  },
} as const;
