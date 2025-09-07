import React from 'react';
import { FlatListProps, ListRenderItem } from 'react-native';

// Optimized FlatList configuration
export const optimizedFlatListProps = {
  // Performance optimizations
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  windowSize: 10,
  initialNumToRender: 15,
  updateCellsBatchingPeriod: 50,
  
  // Memory optimizations
  getItemLayout: (data: any, index: number) => ({
    length: 80, // Approximate item height
    offset: 80 * index,
    index,
  }),
  
  // Scrolling optimizations
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
};

// Memoized component wrapper
export function withMemo<T extends object>(
  Component: React.ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return React.memo(Component, areEqual);
}

// Shallow comparison for props
export function shallowEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

// Custom hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for throttled functions
export function useThrottle(callback: Function, delay: number) {
  const throttleRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastRan = React.useRef<number>(Date.now());

  return React.useCallback(
    (...args: any[]) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      } else {
        if (throttleRef.current) {
          clearTimeout(throttleRef.current);
        }
        throttleRef.current = setTimeout(() => {
          if (Date.now() - lastRan.current >= delay) {
            callback(...args);
            lastRan.current = Date.now();
          }
        }, delay - (Date.now() - lastRan.current)) as any;
      }
    },
    [callback, delay]
  );
}

// Custom hook for memoizing expensive calculations
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return React.useMemo(calculation, dependencies);
}

// KeyExtractor functions for common patterns
export const createKeyExtractor = {
  byId: <T extends { id: string }>(item: T) => item.id,
  byIndex: (_: any, index: number) => index.toString(),
  byIdAndIndex: <T extends { id: string }>(item: T, index: number) => `${item.id}-${index}`,
};

// Render item factory for optimized FlatList items
export function createOptimizedRenderItem<T>(
  ItemComponent: React.ComponentType<{ item: T; index: number }>,
  arePropsEqual?: (prevProps: any, nextProps: any) => boolean
): ListRenderItem<T> {
  const MemoizedItem = React.memo(ItemComponent, arePropsEqual || shallowEqual);
  
  return ({ item, index }) => React.createElement(MemoizedItem, { item, index });
}

// Performance monitoring hook
export function useRenderCount(componentName: string) {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    if (__DEV__) {
      console.log(`${componentName} rendered: ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
}

// Image optimization helper
export const imageOptimizations = {
  placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  
  getOptimizedImageProps: (uri: string, dimensions?: { width: number; height: number }) => ({
    source: { uri },
    defaultSource: { uri: imageOptimizations.placeholder },
    resizeMode: 'cover' as const,
    ...(dimensions && {
      style: {
        width: dimensions.width,
        height: dimensions.height,
      },
    }),
  }),
};

// Memory usage tracker (development only)
export function useMemoryTracker(componentName: string) {
  React.useEffect(() => {
    if (__DEV__ && typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      console.log(`${componentName} memory usage:`, {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      });
    }
  });
}

// Batch update utility
export function batchUpdates<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => void,
  delay: number = 0
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    if (delay > 0) {
      setTimeout(() => processor(batch), delay * (i / batchSize));
    } else {
      processor(batch);
    }
  }
}

// Virtual list calculation helper
export function calculateVisibleRange(
  scrollOffset: number,
  containerHeight: number,
  itemHeight: number,
  itemCount: number,
  overscan: number = 5
) {
  const start = Math.floor(scrollOffset / itemHeight);
  const end = Math.min(
    itemCount - 1,
    Math.ceil((scrollOffset + containerHeight) / itemHeight)
  );
  
  return {
    start: Math.max(0, start - overscan),
    end: Math.min(itemCount - 1, end + overscan),
  };
}

// Component size measurement hook
export function useComponentSize() {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  
  const onLayout = React.useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);
  
  return { size, onLayout };
}

// Stable reference hook
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = React.useRef(callback);
  
  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return React.useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
}