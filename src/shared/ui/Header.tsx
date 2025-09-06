import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  rightActions?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  showMenuButton = false,
  onBackPress,
  onMenuPress,
  rightActions,
  backgroundColor,
  titleColor,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColor({}, 'foreground');
  const defaultBgColor = useThemeColor({}, 'background');
  const defaultTitleColor = useThemeColor({}, 'foreground');

  return (
    <View 
      className="border-b border-border px-4 pb-3"
      style={{ 
        paddingTop: insets.top + 12,
        backgroundColor: backgroundColor || defaultBgColor
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Section */}
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress}
              className="mr-3 p-1"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color={iconColor} />
            </TouchableOpacity>
          )}
          
          <View className="flex-1">
            <Text 
              className="text-2xl font-semibold"
              style={{ color: titleColor || defaultTitleColor }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-muted-foreground mt-1" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section */}
        <View className="flex-row items-center">
          {rightActions}
          {showMenuButton && (
            <TouchableOpacity
              onPress={onMenuPress}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <MoreVertical size={24} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}