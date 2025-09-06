import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, Clock, Calendar, List } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { TodoFilter as TodoFilterType } from '../../types';

interface TodoFilterProps {
  activeFilter: TodoFilterType;
  onFilterChange: (filter: TodoFilterType) => void;
  counts?: {
    all: number;
    today: number;
    week: number;
    completed: number;
  };
}

const filterConfig = {
  all: {
    label: 'All',
    icon: List,
  },
  today: {
    label: 'Today',
    icon: Clock,
  },
  week: {
    label: 'This Week',
    icon: Calendar,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
  },
};

export function TodoFilter({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: TodoFilterProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'foreground');

  const filters = Object.entries(filterConfig) as [TodoFilterType, typeof filterConfig[TodoFilterType]][];

  return (
    <View className="bg-card border-b border-border">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {filters.map(([filter, config]) => {
          const isActive = activeFilter === filter;
          const Icon = config.icon;
          const count = counts?.[filter];
          
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => onFilterChange(filter)}
              className="flex-row items-center mr-4 px-4 py-2 rounded-full border"
              style={{
                backgroundColor: isActive ? primaryColor : 'transparent',
                borderColor: isActive ? primaryColor : borderColor,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${config.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Icon 
                size={16} 
                color={isActive ? 'white' : mutedColor} 
              />
              <Text 
                className="ml-2 text-sm font-medium"
                style={{ 
                  color: isActive ? 'white' : textColor 
                }}
              >
                {config.label}
              </Text>
              {count !== undefined && count > 0 && (
                <View 
                  className="ml-2 px-2 py-0.5 rounded-full min-w-[20px] items-center"
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(255, 255, 255, 0.2)'
                      : primaryColor + '20',
                  }}
                >
                  <Text 
                    className="text-xs font-semibold"
                    style={{
                      color: isActive ? 'white' : primaryColor,
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}