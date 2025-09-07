import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { queryClient } from '../../utils/queryClient';

// Mock the AuthProvider context
jest.mock('../../features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

// Create a custom wrapper with QueryClient
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return Wrapper;
};

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('Transactions Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('useTransactions', () => {
    it('should initialize with empty state when not authenticated', () => {
      // Mock unauthenticated state
      const { useAuth } = require('../../features/auth/AuthProvider');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.transactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(),
      });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
    });
  });
});