/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional semantic colors
    foreground: '#11181C',
    'muted-foreground': '#687076',
    primary: '#0a7ea4',
    'primary-foreground': '#ffffff',
    secondary: '#f1f5f9',
    'secondary-foreground': '#0f172a',
    success: '#16a34a',
    destructive: '#dc2626',
    warning: '#ea580c',
    border: '#e5e7eb',
    card: '#ffffff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional semantic colors
    foreground: '#ECEDEE',
    'muted-foreground': '#9BA1A6',
    primary: '#3b82f6',
    'primary-foreground': '#ffffff',
    secondary: '#1e293b',
    'secondary-foreground': '#f8fafc',
    success: '#22c55e',
    destructive: '#ef4444',
    warning: '#f97316',
    border: '#374151',
    card: '#1f2937',
  },
};
