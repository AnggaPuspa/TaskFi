import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'small' | 'medium' | 'large';
}

const priorityConfig = {
  low: {
    label: 'Low',
    color: '#6B7280', // gray-500
    backgroundColor: '#F3F4F6', // gray-100
    darkBackgroundColor: '#374151', // gray-700
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B', // yellow-500
    backgroundColor: '#FEF3C7', // yellow-100
    darkBackgroundColor: '#92400E', // yellow-800
  },
  high: {
    label: 'High',
    color: '#EF4444', // red-500
    backgroundColor: '#FEE2E2', // red-100
    darkBackgroundColor: '#991B1B', // red-800
  },
};

const sizeConfig = {
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    borderRadius: 10,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    borderRadius: 12,
  },
};

export function PriorityBadge({ priority, size = 'medium' }: PriorityBadgeProps) {
  const isDark = useThemeColor({}, 'background') === 'hsl(var(--background))';
  
  const config = priorityConfig[priority];
  const sizeStyle = sizeConfig[size];
  
  const backgroundColor = isDark 
    ? config.darkBackgroundColor + '40' 
    : config.backgroundColor;

  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        paddingVertical: sizeStyle.paddingVertical,
        borderRadius: sizeStyle.borderRadius,
      }}
    >
      <Text
        style={{
          color: config.color,
          fontSize: sizeStyle.fontSize,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}