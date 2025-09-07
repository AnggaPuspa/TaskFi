import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '~/features/auth/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { queryClient } from '~/utils/queryClient'; // Single source of truth
import '~/i18n'; // Initialize i18n

/**
 * Root Layout following industry standards
 * Features:
 * - Single QueryClient instance
 * - Proper provider hierarchy
 * - Theme support
 * - Error boundaries (future)
 */

const LIGHT_THEME = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};

const DARK_THEME = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export default function RootLayout() {
  const { isDarkColorScheme } = useColorScheme();
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  return (
    <Stack>
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <Stack.Screen 
        name="(app)" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <Stack.Screen 
        name="add-todo" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <Stack.Screen 
        name="add-transaction" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <Stack.Screen 
        name="+not-found" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}