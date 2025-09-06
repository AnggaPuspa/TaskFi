import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: React.ComponentType<{ size: number; color: string }>;
  color?: string;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function StatsCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  color,
  onPress,
  size = 'medium',
}: StatsCardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');
  const primaryColor = useThemeColor({}, 'primary');

  const iconColor = color || primaryColor;

  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase':
        return TrendingUp;
      case 'decrease':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return successColor;
      case 'decrease':
        return destructiveColor;
      default:
        return mutedColor;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          title: 'text-sm',
          value: 'text-lg',
          iconSize: 16,
        };
      case 'large':
        return {
          container: 'p-6',
          title: 'text-base',
          value: 'text-3xl',
          iconSize: 24,
        };
      default:
        return {
          container: 'p-4',
          title: 'text-sm',
          value: 'text-2xl',
          iconSize: 20,
        };
    }
  };

  const ChangeIcon = change ? getChangeIcon() : null;
  const sizeClasses = getSizeClasses();

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-card rounded-xl border border-border ${sizeClasses.container}`}
      style={{ backgroundColor }}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
      disabled={!onPress}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text 
          className={`${sizeClasses.title} font-medium`} 
          style={{ color: mutedColor }}
          numberOfLines={1}
        >
          {title}
        </Text>
        
        <View className="flex-row items-center">
          {Icon && (
            <Icon size={sizeClasses.iconSize} color={iconColor} />
          )}
          {onPress && (
            <ArrowRight 
              size={sizeClasses.iconSize - 4} 
              color={mutedColor} 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>

      {/* Value */}
      <Text 
        className={`${sizeClasses.value} font-bold mb-1`}
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {value}
      </Text>

      {/* Subtitle and Change */}
      <View className="flex-row items-center justify-between">
        {subtitle && (
          <Text 
            className="text-xs flex-1" 
            style={{ color: mutedColor }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        
        {change && (
          <View className="flex-row items-center ml-2">
            {ChangeIcon && (
              <ChangeIcon size={12} color={getChangeColor()} />
            )}
            <Text 
              className="text-xs font-medium ml-1"
              style={{ color: getChangeColor() }}
            >
              {change.value}
              {change.period && (
                <Text style={{ color: mutedColor }}> {change.period}</Text>
              )}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Stats Grid Layout
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
}

export function StatsGrid({ children, columns = 2 }: StatsGridProps) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <View className="gap-3">
      {Array.from({ length: Math.ceil(childrenArray.length / columns) }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3">
          {Array.from({ length: columns }).map((_, colIndex) => {
            const childIndex = rowIndex * columns + colIndex;
            const child = childrenArray[childIndex];
            
            if (!child) {
              return <View key={colIndex} className="flex-1" />;
            }
            
            return (
              <View key={colIndex} className="flex-1">
                {child}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
