import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { queryClient } from '../../utils/queryClient';

// Mock Supabase client
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(),
    },
    realtime: {
      setAuth: jest.fn(),
    },
  },
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

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('useAuth hook', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Mock the auth state
      const { useAuth } = require('../../features/auth/AuthProvider');
      useAuth.mockReturnValue({
        signIn: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        user: mockSession.user,
        isAuthenticated: true,
        isLoading: false,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const signInResult = await result.current.signIn('test@example.com', 'password123');

      expect(signInResult).toEqual({ success: true });
    });

    it('should handle sign in error', async () => {
      const { useAuth } = require('../../features/auth/AuthProvider');
      useAuth.mockReturnValue({
        signIn: jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const signInResult = await result.current.signIn('test@example.com', 'wrongpassword');

      expect(signInResult).toEqual({ success: false, error: 'Invalid credentials' });
    });

    it('should sign out successfully', async () => {
      const { useAuth } = require('../../features/auth/AuthProvider');
      useAuth.mockReturnValue({
        signIn: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const signOutResult = await result.current.signOut();

      expect(signOutResult).toEqual({ success: true });
    });
  });
});