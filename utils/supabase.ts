import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

// Enhanced logging for debugging
const DEBUG_MODE = __DEV__;

// Development logging counters
let networkCounter = 0;

function logNetwork(operation: string, details?: any) {
  if (__DEV__) {
    networkCounter++;
    console.log(`[Supabase #${networkCounter}] ${operation}`, details || '');
  }
}

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[Supabase Debug] ${message}`, data || '');
  }
}

function errorLog(message: string, error?: any) {
  console.error(`[Supabase Error] ${message}`, error || '');
}

// Environment variable validation with detailed logging
const supabaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_DATABASE_ANON_KEY;

debugLog('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase environment variables. Please check your .env file.';
  errorLog(errorMsg, {
    EXPO_PUBLIC_DATABASE_URL: !!supabaseUrl,
    EXPO_PUBLIC_DATABASE_ANON_KEY: !!supabaseAnonKey
  });
  throw new Error(errorMsg);
}

// Check for placeholder values with better detection
const placeholderIndicators = ['placeholder', 'your-project', 'example.com', 'localhost'];
const hasPlaceholder = placeholderIndicators.some(indicator => 
  supabaseUrl.toLowerCase().includes(indicator) || 
  supabaseAnonKey.toLowerCase().includes(indicator)
);

if (hasPlaceholder) {
  console.warn('⚠️  Using placeholder Supabase credentials. Please set up your actual Supabase project.');
  console.warn('📝 Instructions:');
  console.warn('1. Go to https://supabase.com and create a new project');
  console.warn('2. Go to Settings > API in your Supabase dashboard');
  console.warn('3. Copy the Project URL to EXPO_PUBLIC_DATABASE_URL in .env');
  console.warn('4. Copy the anon/public key to EXPO_PUBLIC_DATABASE_ANON_KEY in .env');
}

// Validate URL format
try {
  new URL(supabaseUrl);
  debugLog('Supabase URL validation passed');
} catch (error) {
  errorLog('Invalid Supabase URL format', { url: supabaseUrl, error });
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

// Enhanced Supabase client configuration with logging
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: DEBUG_MODE,
  },
  global: {
    headers: {
      'X-Client-Info': 'react-native-expo',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Wrap Supabase methods with logging
const originalFrom = supabase.from;
supabase.from = function(...args: any[]) {
  const tableName = args[0];
  logNetwork(`Accessing table: ${tableName}`);
  return originalFrom.apply(supabase, args as any);
};

/**
 * Get Supabase instrumentation statistics (development only)
 */
export function getSupabaseStats() {
  if (__DEV__) {
    return {
      totalRequests: networkCounter,
      averagePerMinute: networkCounter / (Date.now() / 60000) || 0
    };
  }
  return null;
}

// Enhanced connection testing
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    debugLog('Testing Supabase connection...');
    
    const startTime = Date.now();
    logNetwork('Testing connection to profiles table');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      errorLog('Connection test failed', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: { error, duration }
      };
    }
    
    debugLog('Connection test successful', { duration, data });
    return {
      success: true,
      message: `Connected successfully (${duration}ms)`,
      details: { duration, data }
    };
  } catch (error) {
    errorLog('Connection test error', error);
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
}

// Auth state monitoring with logging
supabase.auth.onAuthStateChange((event, session) => {
  debugLog('Auth state change', {
    event,
    hasSession: !!session,
    userId: session?.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Set realtime auth token when session changes
  supabase.realtime.setAuth(session?.access_token ?? '');
  
  if (event === 'SIGNED_IN') {
    debugLog('User signed in successfully', {
      userId: session?.user?.id,
      email: session?.user?.email
    });
  } else if (event === 'SIGNED_OUT') {
    debugLog('User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    debugLog('Token refreshed successfully');
  }
});

debugLog('Supabase client initialized successfully');

// Export types for use in components
export type { Database } from '../supabase/database.types';
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];