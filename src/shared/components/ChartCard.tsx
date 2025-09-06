import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BarChart3, PieChart, TrendingUp, MoreHorizontal } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  chartType?: 'bar' | 'pie' | 'line';
  onPress?: () => void;
  onMenuPress?: () => void;
  children?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  value,
  change,
  changeType = 'neutral',
  chartType = 'bar',
  onPress,
  onMenuPress,
  children,
}: ChartCardProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');
  const primaryColor = useThemeColor({}, 'primary');

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return successColor;
      case 'negative':
        return destructiveColor;
      default:
        return mutedColor;
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'pie':
        return PieChart;
      case 'line':
        return TrendingUp;
      default:
        return BarChart3;
    }
  };

  const ChartIcon = getChartIcon();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card p-4 rounded-xl border border-border"
      style={{ backgroundColor }}
      accessibilityRole="button"
      accessibilityLabel={`${title} chart`}
      disabled={!onPress}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold" style={{ color: textColor }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm mt-1" style={{ color: mutedColor }}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View className="flex-row items-center">
          <ChartIcon size={20} color={primaryColor} />
          {onMenuPress && (
            <TouchableOpacity
              onPress={onMenuPress}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel="Chart options"
            >
              <MoreHorizontal size={20} color={mutedColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Value and Change */}
      {(value || change) && (
        <View className="flex-row items-end justify-between mb-4">
          {value && (
            <Text className="text-2xl font-bold" style={{ color: textColor }}>
              {value}
            </Text>
          )}
          {change && (
            <Text className="text-sm font-medium" style={{ color: getChangeColor() }}>
              {change}
            </Text>
          )}
        </View>
      )}

      {/* Chart Content */}
      {children ? (
        children
      ) : (
        <View className="h-32 items-center justify-center bg-muted/20 rounded-lg">
          <ChartIcon size={32} color={mutedColor} />
          <Text className="text-sm mt-2" style={{ color: mutedColor }}>
            Chart will be displayed here
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Simple Bar Chart Placeholder
interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const primaryColor = useThemeColor({}, 'primary');
  
  const max = maxValue || Math.max(...data.map(d => Math.abs(d.value)));

  return (
    <View className="h-32">
      <View className="flex-row items-end justify-between mb-2" style={{ height: 96 }}>
        {data.map((item, index) => {
          const height = max > 0 ? (Math.abs(item.value) / max) * 80 : 4;
          return (
            <View key={index} className="flex-1 items-center justify-end px-1">
              <View 
                className="w-6 rounded-t"
                style={{
                  height: Math.max(height, 4),
                  backgroundColor: item.color || primaryColor,
                }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between">
        {data.map((item, index) => (
          <Text 
            key={index} 
            className="text-xs flex-1 text-center" 
            style={{ color: mutedColor }}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Simple Pie Chart Placeholder
interface SimplePieChartProps {
  data: { label: string; value: number; color: string }[];
}

export function SimplePieChart({ data }: SimplePieChartProps) {
  const mutedColor = useThemeColor({}, 'muted-foreground');
  
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View className="h-32 flex-row items-center">
      {/* Pie Chart Placeholder */}
      <View className="w-24 h-24 rounded-full border-8 border-muted/20 items-center justify-center mr-4">
        <PieChart size={32} color={mutedColor} />
      </View>
      
      {/* Legend */}
      <View className="flex-1">
        {data.slice(0, 4).map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <View key={index} className="flex-row items-center mb-1">
              <View 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-xs flex-1" style={{ color: mutedColor }}>
                {item.label}
              </Text>
              <Text className="text-xs font-medium" style={{ color: mutedColor }}>
                {percentage}%
              </Text>
            </View>
          );
        })}
        {data.length > 4 && (
          <Text className="text-xs" style={{ color: mutedColor }}>
            +{data.length - 4} more
          </Text>
        )}
      </View>
    </View>
  );
}
