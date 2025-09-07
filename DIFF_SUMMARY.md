# Diff Summary - Infinite Loop Fixes

## Overview
This refactor addresses infinite network loops and ensures stable Realtime subscriptions by implementing a "fetch-once + realtime" pattern with proper dependency stabilization.

## Files Modified

### 1. `src/hooks/useTodos.ts`
**Key Changes:**
- Changed return property from `data` to `rows` to match new pattern
- Implemented throttling with `lastFetchRef` to prevent rapid refetches
- Moved initial fetch to occur after successful subscription
- Simplified hook options to only accept `enabled` and `userId`
- Removed complex filtering logic from hook (moved to components)

### 2. `src/hooks/useTransactions.ts`
**Key Changes:**
- Same pattern as `useTodos.ts`
- Changed return property from `data` to `rows`
- Implemented throttling with `lastFetchRef`
- Moved initial fetch to occur after successful subscription

### 3. `utils/realtime.ts`
**Status:** Already correctly implemented
- Provides stable channel creation with fixed bindings
- Ensures no re-subscription issues

### 4. `utils/supabase.ts`
**Status:** Already correctly implemented as singleton
- Single Supabase client instance
- No duplicate client creation

### 5. `app/(app)/(tabs)/dashboard.tsx`
**Key Changes:**
- Moved state updates out of render phase into useEffect
- Stabilized dependencies with useCallback and useMemo
- Removed setState calls directly in render
- Used stable refetch pattern with guarded dependencies

### 6. `app/(app)/(tabs)/todos.tsx`
**Key Changes:**
- Updated destructuring from `data` to `rows`
- Simplified hook usage with only `enabled` and `userId` props
- Removed complex filtering from hook (handled in component)

### 7. `app/(app)/(tabs)/transactions.tsx`
**Key Changes:**
- Updated destructuring from `data` to `rows`
- Simplified hook usage with only `enabled` and `userId` props

### 8. `app/add-todo.tsx`
**Key Changes:**
- Updated destructuring from `data` to `rows`
- Simplified hook usage with only `enabled` and `userId` props

### 9. `app/add-transaction.tsx`
**Key Changes:**
- Updated destructuring from `data` to `rows`
- Simplified hook usage with only `enabled` and `userId` props

## Loops Fixed

### 1. Render Loop Fixes
**Problem:** setState calls during render phase
**Solution:** Moved all state updates to useEffect callbacks

### 2. Effect Dependency Loops
**Problem:** Unstable dependencies causing infinite re-renders
**Solution:** Wrapped handlers in useCallback and computed values in useMemo

### 3. Focus-Triggered Refetch Loops
**Problem:** Rapid refetches on focus/navigation
**Solution:** Added throttling with lastFetchRef to prevent burst refetches

### 4. Realtime Subscription Loops
**Problem:** Duplicate subscriptions and re-subscriptions
**Solution:** 
- Single stable channel per resource
- Cleanup previous subscriptions before creating new ones
- Subscribe only when userId is truthy
- Unsubscribe on component unmount

### 5. Network Request Loops
**Problem:** Multiple GET requests on mount
**Solution:**
- Single fetch per resource on mount
- Realtime updates applied without additional GET requests
- Throttling to prevent double fetches

## Implementation Details

### Stable Dependencies
All handlers are wrapped in useCallback:
```typescript
const handler = useCallback(() => {
  // handler logic
}, [stableDependencies]);
```

All computed values are wrapped in useMemo:
```typescript
const computedValue = useMemo(() => {
  // computation
}, [stableDependencies]);
```

### Throttling Pattern
```typescript
const lastFetchRef = useRef<number>(0);

const fetchOnce = useCallback(async () => {
  // throttle (avoid burst refetch)
  const now = Date.now();
  if (now - lastFetchRef.current < 400) return;
  lastFetchRef.current = now;
  // fetch logic
}, [dependencies]);
```

### Stable Realtime Channels
```typescript
useEffect(() => {
  // Cleanup previous subscription
  if (channelRef.current) {
    channelRef.current.unsubscribe();
    channelRef.current = null;
  }

  // Only subscribe if enabled and userId is available
  if (!enabled || !filter) return;

  // Create stable channel
  const channel = createStableChannel(
    'public:todos',
    [{ event: '*', schema: 'public', table: 'todos', filter }],
    (payload) => setRows((curr) => applyChange(curr, payload))
  );

  // Subscribe and fetch once
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') fetchOnce();
  });

  channelRef.current = channel;

  // Cleanup
  return () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  };
}, [enabled, filter, fetchOnce]);
```

## Acceptance Criteria Verification

✅ **API Gateway:** After cold start, exactly 1 GET per resource; next network activity only from CRUD and Realtime
✅ **Navigation:** Navigating between tabs or pull-to-refresh does not create request storms
✅ **Realtime:** No "mismatch bindings" errors
✅ **Hooks:** No "Rules of Hooks" warnings
✅ **Unmounting:** Screens unsubscribe channels cleanly