import { useMemo, useState, useEffect } from 'react';
import { TransactionFilters, TodoFilters } from '../types';

/**
 * Hook to create stable filter objects for useEffect dependencies
 * Prevents infinite re-renders when using filter objects as dependencies
 */

export function useStableTransactionFilters(filters: TransactionFilters = {}, searchQuery = '') {
  return useMemo(() => {
    const stableFilters = { ...filters };
    if (searchQuery.trim()) {
      stableFilters.searchQuery = searchQuery.trim();
    }
    return stableFilters;
  }, [
    filters.type,
    filters.category,
    filters.wallet,
    filters.dateFrom,
    filters.dateTo,
    searchQuery,
  ]);
}

export function useStableTodoFilters(filters: TodoFilters = {}) {
  return useMemo(() => ({
    ...filters,
  }), [
    filters.priority,
    filters.completed,
    // Handle tags array comparison properly
    filters.tags ? JSON.stringify(filters.tags.sort()) : undefined,
  ]);
}

/**
 * Debounced search query hook to prevent excessive API calls
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}