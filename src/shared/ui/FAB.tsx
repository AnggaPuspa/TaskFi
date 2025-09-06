import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface FABProps {
  onPress: () => void;
  icon?: React.ComponentType<{ size: number; color: string }>;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const sizeConfig = {
  small: { size: 48, iconSize: 20 },
  medium: { size: 56, iconSize: 24 },
  large: { size: 64, iconSize: 28 },
};

export function FAB({
  onPress,
  icon: Icon = Plus,
  size = 'medium',
  variant = 'primary',
  style,
  accessibilityLabel = 'Add new item',
}: FABProps) {
  const scale = useSharedValue(1);
  const backgroundColor = useThemeColor({}, variant === 'primary' ? 'primary' : 'secondary');
  const iconColor = useThemeColor({}, variant === 'primary' ? 'primary-foreground' : 'secondary-foreground');
  
  const { size: fabSize, iconSize } = sizeConfig[size];

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: interpolate(
            scale.value,
            [0.95, 1],
            [0.95, 1]
          )
        }
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="shadow-lg"
        style={{
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8, // Android shadow
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Icon size={iconSize} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}