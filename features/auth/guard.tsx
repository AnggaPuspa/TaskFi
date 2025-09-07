import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from './AuthProvider';
import { LoadingScreen } from '~/components/LoadingScreen';

// Props for the withAuth HOC
interface WithAuthProps {
  children: React.ReactNode;
}

/**
 * Higher-order component to protect routes that require authentication
 * Redirects unauthenticated users to the sign-in screen
 */
export function withAuth<P extends WithAuthProps>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAuth(props: P) {
    const { status } = useAuth();

    // Show loading screen while checking auth status
    if (status === 'loading') {
      return <LoadingScreen />;
    }

    // Redirect to sign-in if not authenticated
    if (status === 'unauthenticated') {
      return <Redirect href="/sign-in" />;
    }

    // Render the protected component
    return <Component {...props} />;
  };
}

/**
 * Protected route component for Expo Router
 * Use this in your router configuration to protect routes
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  // Show loading screen while checking auth status
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  // Redirect to sign-in if not authenticated
  if (status === 'unauthenticated') {
    return <Redirect href="/sign-in" />;
  }

  // Render the protected content
  return <>{children}</>;
}

/**
 * Public route component for Expo Router
 * Use this in your router configuration for public routes (like sign-in)
 * Redirects authenticated users to the main app
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  // Show loading screen while checking auth status
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  // Redirect to main app if already authenticated
  if (status === 'authenticated') {
    // Using router.replace instead of Redirect to ensure proper navigation
    router.replace('/(app)/(tabs)/dashboard');
    return null;
  }

  // Render the public content
  return <>{children}</>;
}