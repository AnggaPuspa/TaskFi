import { supabase, testSupabaseConnection } from './supabase';
import { Alert } from 'react-native';

// Enhanced logging utilities
const DEBUG_MODE = __DEV__;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    const timestamp = new Date().toISOString();
    console.log(`[Auth Debug ${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

function errorLog(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[Auth Error ${timestamp}] ${message}`, error);
}

interface AuthResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

/**
 * Enhanced login function with comprehensive logging and error handling
 */
export async function enhancedLogin(email: string, password: string): Promise<AuthResult> {
  debugLog('Starting login process', { email: email.substring(0, 3) + '***' });
  
  // Step 1: Validate inputs
  if (!email || !password) {
    const errorMsg = 'Email and password are required';
    errorLog(errorMsg);
    return { success: false, message: errorMsg, error: 'INVALID_INPUT' };
  }
  
  // Step 2: Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const errorMsg = 'Please enter a valid email address';
    errorLog(errorMsg, { email });
    return { success: false, message: errorMsg, error: 'INVALID_EMAIL_FORMAT' };
  }
  
  // Step 3: Test connection before attempting login
  debugLog('Testing Supabase connection...');
  const connectionTest = await testSupabaseConnection();
  
  if (!connectionTest.success) {
    errorLog('Connection test failed', connectionTest);
    return {
      success: false,
      message: 'Unable to connect to authentication server. Please check your internet connection.',
      error: 'CONNECTION_FAILED',
      data: connectionTest
    };
  }
  
  debugLog('Connection test passed', connectionTest);
  
  // Step 4: Attempt login with detailed error handling
  try {
    debugLog('Attempting Supabase authentication...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    });
    
    const duration = Date.now() - startTime;
    debugLog('Authentication attempt completed', { 
      duration,
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      hasError: !!error 
    });
    
    if (error) {
      errorLog('Supabase authentication error', {
        code: error.message,
        status: (error as any)?.status,
        details: error
      });
      
      // Handle specific error types
      switch (error.message) {
        case 'Invalid login credentials':
          return {
            success: false,
            message: 'Invalid email or password. Please check your credentials and try again.',
            error: 'INVALID_CREDENTIALS'
          };
        case 'Email not confirmed':
          return {
            success: false,
            message: 'Please confirm your email address before signing in. Check your inbox for a confirmation email.',
            error: 'EMAIL_NOT_CONFIRMED'
          };
        case 'Too many requests':
          return {
            success: false,
            message: 'Too many login attempts. Please wait a few minutes and try again.',
            error: 'RATE_LIMITED'
          };
        default:
          if (error.message.toLowerCase().includes('network') || 
              error.message.toLowerCase().includes('fetch') ||
              error.message.toLowerCase().includes('timeout')) {
            return {
              success: false,
              message: 'Network error. Please check your internet connection and try again.',
              error: 'NETWORK_ERROR',
              data: { originalError: error.message }
            };
          }
          return {
            success: false,
            message: `Authentication failed: ${error.message}`,
            error: 'AUTH_ERROR',
            data: { originalError: error.message }
          };
      }
    }
    
    if (!data?.user || !data?.session) {
      errorLog('Authentication succeeded but missing user/session data', { data });
      return {
        success: false,
        message: 'Authentication incomplete. Please try again.',
        error: 'INCOMPLETE_AUTH'
      };
    }
    
    debugLog('Login successful', {
      userId: data.user.id,
      email: data.user.email,
      sessionExpiry: data.session.expires_at,
      duration
    });
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: data.user,
        session: data.session,
        duration
      }
    };
    
  } catch (error) {
    errorLog('Unexpected login error', error);
    
    // Network-specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Network connection failed. Please check your internet connection and try again.',
        error: 'FETCH_ERROR',
        data: { originalError: error.message }
      };
    }
    
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'UNEXPECTED_ERROR',
      data: { originalError: error }
    };
  }
}

/**
 * Enhanced signup function with comprehensive logging
 */
export async function enhancedSignUp(email: string, password: string): Promise<AuthResult> {
  debugLog('Starting signup process', { email: email.substring(0, 3) + '***' });
  
  // Input validation
  if (!email || !password) {
    const errorMsg = 'Email and password are required';
    errorLog(errorMsg);
    return { success: false, message: errorMsg, error: 'INVALID_INPUT' };
  }
  
  if (password.length < 6) {
    const errorMsg = 'Password must be at least 6 characters long';
    errorLog(errorMsg);
    return { success: false, message: errorMsg, error: 'WEAK_PASSWORD' };
  }
  
  // Test connection
  const connectionTest = await testSupabaseConnection();
  if (!connectionTest.success) {
    errorLog('Connection test failed for signup', connectionTest);
    return {
      success: false,
      message: 'Unable to connect to server. Please check your internet connection.',
      error: 'CONNECTION_FAILED'
    };
  }
  
  try {
    debugLog('Attempting Supabase signup...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
    });
    
    const duration = Date.now() - startTime;
    debugLog('Signup attempt completed', { 
      duration,
      hasData: !!data,
      hasUser: !!data?.user,
      needsConfirmation: !data?.session,
      hasError: !!error 
    });
    
    if (error) {
      errorLog('Supabase signup error', error);
      return {
        success: false,
        message: `Signup failed: ${error.message}`,
        error: 'SIGNUP_ERROR'
      };
    }
    
    if (data?.user && !data?.session) {
      debugLog('Signup successful, email confirmation required', {
        userId: data.user.id,
        email: data.user.email
      });
      return {
        success: true,
        message: 'Account created! Please check your email for a confirmation link.',
        data: { user: data.user, needsConfirmation: true }
      };
    }
    
    debugLog('Signup successful with automatic sign-in', {
      userId: data?.user?.id,
      email: data?.user?.email
    });
    
    return {
      success: true,
      message: 'Account created and signed in successfully!',
      data: { user: data?.user, session: data?.session }
    };
    
  } catch (error) {
    errorLog('Unexpected signup error', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Test authentication connection and log results
 */
export async function testAuthConnection(): Promise<void> {
  debugLog('=== Testing Authentication Connection ===');
  
  try {
    // Test 1: Basic connection
    const connectionResult = await testSupabaseConnection();
    debugLog('Connection test result', connectionResult);
    
    // Test 2: Auth endpoint
    const { data: { session }, error } = await supabase.auth.getSession();
    debugLog('Session check result', { 
      hasSession: !!session,
      hasError: !!error,
      error: error?.message 
    });
    
    // Test 3: User info if logged in
    if (session) {
      debugLog('Current session info', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
        isExpired: session.expires_at ? Date.now() / 1000 > session.expires_at : false
      });
    }
    
    debugLog('=== Authentication Connection Test Complete ===');
    
  } catch (error) {
    errorLog('Auth connection test failed', error);
  }
}

/**
 * Show user-friendly error with fallback options
 */
export function showAuthError(result: AuthResult, onRetry?: () => void, onDemo?: () => void): void {
  if (result.error === 'CONNECTION_FAILED' || result.error === 'NETWORK_ERROR') {
    Alert.alert(
      'Connection Error',
      `${result.message}\n\nFor development: You can use Demo Login to test the app without a server connection.`,
      [
        { text: 'Retry', onPress: onRetry },
        { text: 'Demo Login', onPress: onDemo },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  } else {
    Alert.alert('Authentication Error', result.message);
  }
}