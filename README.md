# Production-Ready Expo App Architecture

This repository contains a production-ready Expo (React Native) application with the following features:

## Architecture Overview

### 1. Feature-Based Structure
```
features/
├── auth/
│   ├── AuthProvider.tsx
│   ├── guard.tsx
│   ├── api.ts
│   ├── hooks.ts
│   └── types.ts
├── transactions/
│   ├── api.ts
│   ├── hooks.ts
│   ├── screens/
│   └── components/
└── todos/
    ├── api.ts
    ├── hooks.ts
    ├── screens/
    └── components/
```

### 2. Providers Layer
The app uses a layered provider architecture in `app/_layout.tsx`:
- **ThemeProvider**: For dark/light mode
- **SafeAreaProvider**: For safe area handling
- **GestureHandlerRootView**: For gesture handling
- **QueryClientProvider**: For TanStack Query caching
- **AuthProvider**: For authentication state management

### 3. Authentication
The authentication system is implemented in `features/auth/AuthProvider.tsx` with:
- Session persistence
- Automatic token refresh
- App state change handling
- Protected route guards

### 4. Data Layer
Each feature has its own data layer:

#### API Layer (`features/*/api.ts`)
- Pure Supabase queries
- No UI logic
- Proper error handling
- Type-safe operations

#### Hooks Layer (`features/*/hooks.ts`)
- TanStack Query integration
- Caching with persistence
- Optimistic updates
- Real-time subscriptions

### 5. Caching & Offline Support

#### Cache Implementation
- **TanStack Query** for server state caching
- **AsyncStorage** for cache persistence
- **Stale time**: 60 seconds
- **Refetch on reconnect**: Enabled
- **Refetch on window focus**: Disabled for better UX

#### Offline-First Features
- **Cached data serving**: When offline, data is served from cache
- **Mutation queueing**: Mutations are queued when offline and executed when online
- **Optimistic UI**: Immediate UI updates with automatic rollback on error
- **Network status**: NetInfo integration to detect online/offline state

### 6. Real-Time Subscriptions
- **Stable channels**: Properly managed realtime subscriptions
- **Single subscription per user**: No duplicate subscriptions
- **Automatic cleanup**: Channels are unsubscribed when components unmount
- **Efficient updates**: Only updated data is refreshed, not entire lists

## How to Add New Features

1. **Create feature directory**:
   ```
   mkdir features/newFeature
   ```

2. **Implement API layer** (`features/newFeature/api.ts`):
   ```typescript
   import { supabase } from '~/utils/supabase';
   
   export async function fetchData(userId: string) {
     const { data, error } = await supabase
       .from('table')
       .select('*')
       .eq('user_id', userId);
       
     if (error) throw new Error(error.message);
     return data;
   }
   ```

3. **Implement hooks layer** (`features/newFeature/hooks.ts`):
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { useAuth } from '~/features/auth/AuthProvider';
   import * as Api from './api';
   import { queryKeys } from '~/constants/queryKeys';
   
   export function useData() {
     const { user } = useAuth();
     const userId = user?.id;
     
     return useQuery({
       queryKey: queryKeys.newFeature(userId || ''),
       queryFn: () => Api.fetchData(userId!),
       enabled: !!userId,
       staleTime: 60_000,
       refetchOnReconnect: true,
     });
   }
   ```

4. **Add query keys** (`constants/queryKeys.ts`):
   ```typescript
   export const queryKeys = {
     // ... existing keys
     newFeature: (userId: string) => ['newFeature', userId] as const,
   };
   ```

5. **Use in components**:
   ```typescript
   import { useData } from '~/features/newFeature/hooks';
   
   function MyComponent() {
     const { data, isLoading, error } = useData();
     
     if (isLoading) return <Loading />;
     if (error) return <Error message={error.message} />;
     
     return <DataList data={data} />;
   }
   ```

## Performance Optimizations

1. **Memoization**: Extensive use of `useMemo` and `useCallback`
2. **Virtualized lists**: FlatList with proper configuration
3. **Lazy loading**: Components loaded only when needed
4. **Bundle optimization**: Proper tree-shaking and code splitting
5. **Image optimization**: Efficient image loading and caching

## Error Handling

1. **Centralized error boundaries**
2. **User-friendly error messages**
3. **Graceful degradation**
4. **Retry mechanisms**
5. **Logging system**

## Testing

1. **Unit tests** for all hooks and utility functions
2. **Integration tests** for API functions
3. **Component tests** for UI components
4. **E2E tests** for critical user flows

## CI/CD

1. **GitHub Actions** for automated testing
2. **Type checking** on every PR
3. **Linting** on every PR
4. **Build verification** on every PR