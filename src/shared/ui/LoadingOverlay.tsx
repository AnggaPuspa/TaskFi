import React from 'react';
import { View, ActivityIndicator, Modal } from 'react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...', 
  transparent = false 
}: LoadingOverlayProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View 
        className="flex-1 justify-center items-center"
        style={{ 
          backgroundColor: transparent ? 'rgba(0, 0, 0, 0.5)' : backgroundColor 
        }}
      >
        <View className="bg-card rounded-xl p-8 shadow-lg items-center">
          <ActivityIndicator 
            size="large" 
            color={primaryColor}
            className="mb-4"
          />
          <Text className="text-base text-center">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'small', 
  color, 
  className 
}: LoadingSpinnerProps) {
  const defaultColor = useThemeColor({}, 'primary');

  return (
    <View className={`justify-center items-center ${className || ''}`}>
      <ActivityIndicator 
        size={size} 
        color={color || defaultColor}
      />
    </View>
  );
}