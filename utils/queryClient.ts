import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Single QueryClient instance following industry standard
 * Features:
 * - Offline-first with persistence (like Gojek/Bank Jago)
 * - Smart retry logic
 * - Background sync
 * - Network-aware caching
 */

// Network-aware retry function
const retryFn = (failureCount: number, error: any) => {
  // Don't retry on 4xx errors (client errors)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }
  
  // Progressive backoff: 1s, 2s, 4s
  return failureCount < 3;
};

// Query client with industry-standard configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Retry failed requests
      retry: retryFn,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus (mobile app behavior)
      refetchOnWindowFocus: false,
      // Refetch when network reconnects
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
      // Network mode for proper offline handling
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations on network errors
      retry: retryFn,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode for mutations
      networkMode: 'offlineFirst',
    },
  },
});

// Async storage persister for offline-first experience
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  throttleTime: 1000, // Only persist every 1 second to avoid excessive writes
});

// Setup cache persistence with error handling
// Note: Using a simpler approach to avoid version compatibility issues
if (__DEV__) {
  console.log('[QueryClient] Persistence setup skipped in development');
} else {
  try {
    // Only enable persistence in production to avoid development issues
    persistQueryClient({
      queryClient,
      persister: asyncStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    } as any); // Type assertion to avoid version compatibility issues
  } catch (error) {
    console.warn('[QueryClient] Failed to setup persistence:', error);
  }
}// Network status monitoring for background sync
let isOnline = true;

NetInfo.addEventListener((state) => {
  const wasOffline = !isOnline;
  isOnline = state.isConnected ?? false;
  
  if (__DEV__) {
    console.log('[QueryClient] Network status:', isOnline ? 'ONLINE' : 'OFFLINE');
  }
  
  // When coming back online, refetch all queries
  if (wasOffline && isOnline) {
    console.log('[QueryClient] Back online - refetching queries');
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  }
});

// Query keys factory - centralized and type-safe
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'currentUser'] as const,
  
  // Todos
  todos: ['todos'] as const,
  todosList: (userId: string) => [...queryKeys.todos, 'list', userId] as const,
  todo: (id: string) => [...queryKeys.todos, 'detail', id] as const,
  
  // Transactions
  transactions: ['transactions'] as const,
  transactionsList: (userId: string) => [...queryKeys.transactions, 'list', userId] as const,
  transaction: (id: string) => [...queryKeys.transactions, 'detail', id] as const,
  
  // Categories
  categories: ['categories'] as const,
  categoriesList: (userId: string) => [...queryKeys.categories, 'list', userId] as const,
  categoriesByType: (userId: string, type: 'income' | 'expense') => [...queryKeys.categories, 'list', userId, 'type', type] as const,
  
  // Profiles
  profiles: ['profiles'] as const,
  profile: (userId: string) => [...queryKeys.profiles, 'detail', userId] as const,
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  todos: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.todosList(userId) });
  },
  transactions: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsList(userId) });
  },
  auth: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth });
  },
} as const;

// Cache prefetching helpers
export const prefetchQueries = {
  todos: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.todosList(userId),
      staleTime: 30 * 1000, // Consider fresh for 30 seconds
    });
  },
  transactions: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.transactionsList(userId),
      staleTime: 30 * 1000,
    });
  },
} as const;

// Development helpers
if (__DEV__) {
  // Log cache changes in development
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'updated') {
      console.log('[QueryClient] Cache updated:', event.query.queryKey);
    }
  });
  
  // Global error handler for development
  queryClient.setDefaultOptions({
    queries: {
      onError: (error: any) => {
        console.error('[QueryClient] Query error:', error);
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error('[QueryClient] Mutation error:', error);
      },
    },
  });
}

export default queryClient;
