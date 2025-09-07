import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '~/utils/supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
import { queryClient, invalidateQueries } from '~/utils/queryClient';

/**
 * Modern AuthProvider following industry standards
 * Features:
 * - Single auth state source of truth
 * - Proper loading states
 * - Automatic query cache invalidation
 * - Session persistence
 * - Background refresh
 */

// Auth state types - more specific than before
type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// Enhanced session interface
interface AuthSession extends Session {
  // Future: add custom properties like subscription status, roles, etc.
}

// Context value interface with better typing
interface AuthContextType {
  // Core state
  session: AuthSession | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;
  
  // Actions with proper error handling
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  
  // Utils
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create context with better default
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [error, setError] = useState<string | null>(null);
  
  // Refs to track mounting state and prevent race conditions
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);

  // Clear error when status changes to loading
  useEffect(() => {
    if (status === 'loading') {
      setError(null);
    }
  }, [status]);

  // Initialize auth state - only run once
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    
    const initializeAuth = async () => {
      try {
        setStatus('loading');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Error getting initial session:', sessionError);
          if (isMountedRef.current) {
            setError(sessionError.message);
            setStatus('error');
          }
          return;
        }
        
        if (isMountedRef.current) {
          setSession(initialSession as AuthSession);
          setStatus(initialSession ? 'authenticated' : 'unauthenticated');
          
          // If user is authenticated, clear any auth-related cache
          if (initialSession?.user) {
            invalidateQueries.auth();
          }
        }
      } catch (error: any) {
        console.error('[Auth] Error initializing auth:', error);
        if (isMountedRef.current) {
          setError(error.message || 'Failed to initialize authentication');
          setStatus('error');
        }
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (!isMountedRef.current) return;
        
        console.log('[Auth] State change:', event);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            setSession(session as AuthSession);
            setStatus('authenticated');
            setError(null);
            
            // Clear and refetch user-specific data
            if (session?.user?.id) {
              invalidateQueries.auth();
              invalidateQueries.todos(session.user.id);
              invalidateQueries.transactions(session.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
            setSession(null);
            setStatus('unauthenticated');
            setError(null);
            
            // Clear all cached data on sign out
            queryClient.clear();
            break;
            
          case 'TOKEN_REFRESHED':
            if (session) {
              setSession(session as AuthSession);
              setStatus('authenticated');
              setError(null);
              console.log('[Auth] Token refreshed successfully');
            }
            break;
            
          case 'USER_UPDATED':
            if (session) {
              setSession(session as AuthSession);
              setStatus('authenticated');
              // Invalidate user-related queries
              invalidateQueries.auth();
            }
            break;
            
          default:
            console.log('[Auth] Unhandled auth event:', event);
            break;
        }
        
        // Update realtime auth token
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token);
        } else {
          supabase.realtime.setAuth('');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle app state changes for background refresh
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && status === 'authenticated') {
        // Refresh session when app becomes active
        await refreshSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sign in function with better error handling
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setStatus('loading');
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (signInError) {
        setStatus('unauthenticated');
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }
      
      // Success case - state will be updated by onAuthStateChange
      return { success: true };
      
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred during sign in';
      setStatus('error');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign up function with better error handling
  const signUp = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setStatus('loading');
      setError(null);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (signUpError) {
        setStatus('unauthenticated');
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        setStatus('unauthenticated');
        return { 
          success: true, 
          error: 'Please check your email and click the confirmation link to complete your registration.'
        };
      }
      
      // If session exists, user is automatically signed in
      return { success: true };
      
    } catch (error: any) {
      console.error('[Auth] Sign up error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred during sign up';
      setStatus('error');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out function with proper cleanup
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setStatus('loading');
      setError(null);
      
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('[Auth] Sign out error:', signOutError);
        setError(signOutError.message);
        return { success: false, error: signOutError.message };
      }
      
      // State will be updated by onAuthStateChange
      return { success: true };
      
    } catch (error: any) {
      console.error('[Auth] Sign out error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.getSession();
      
      if (refreshError) {
        console.error('[Auth] Error refreshing session:', refreshError);
        setError(refreshError.message);
        return;
      }
      
      if (isMountedRef.current) {
        setSession(refreshedSession as AuthSession);
        setStatus(refreshedSession ? 'authenticated' : 'unauthenticated');
        setError(null);
      }
    } catch (error: any) {
      console.error('[Auth] Error refreshing session:', error);
      if (isMountedRef.current) {
        setError(error?.message || 'Failed to refresh session');
      }
    }
  }, []);

  // Computed values
  const isLoading = status === 'loading' || status === 'initial';
  const isAuthenticated = status === 'authenticated';

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo((): AuthContextType => ({
    session,
    user: session?.user || null,
    status,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isLoading,
    isAuthenticated,
  }), [session, status, error, signIn, signUp, signOut, refreshSession, isLoading, isAuthenticated]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Helper hook to check if auth is loading
export function useIsAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}

// Helper hook to get current user
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Helper hook for auth status
export function useAuthStatus(): AuthStatus {
  const { status } = useAuth();
  return status;
}