import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check, Clock, Calendar, Edit, Trash2 } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Todo } from '../../types';
import { PriorityBadge } from './PriorityBadge';

interface TodoItemProps {
  todo: Todo;
  onToggle?: () => void;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TodoItem({ 
  todo, 
  onToggle, 
  onPress, 
  onEdit, 
  onDelete 
}: TodoItemProps) {
  const [showActions, setShowActions] = useState(false);
  const scale = useSharedValue(1);
  
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');
  const borderColor = useThemeColor({}, 'border');

  const isOverdue = todo.due && !todo.done && new Date(todo.due) < new Date();
  const isDueToday = todo.due && !todo.done && 
    new Date(todo.due).toDateString() === new Date().toDateString();

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getDueDateColor = () => {
    if (isOverdue) return destructiveColor;
    if (isDueToday) return primaryColor;
    return mutedColor;
  };

  const getDueDateIcon = () => {
    if (isOverdue) return Clock;
    return Calendar;
  };

  const DueDateIcon = getDueDateIcon();

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => setShowActions(!showActions)}
        className="p-4 border-b border-border/50"
        style={{ 
          backgroundColor,
          opacity: todo.done ? 0.7 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${todo.title} task`}
        accessibilityState={{ checked: todo.done }}
      >
        <View className="flex-row items-start">
          {/* Checkbox */}
          <TouchableOpacity
            onPress={onToggle}
            className="w-6 h-6 rounded-full border-2 mr-3 mt-0.5 items-center justify-center"
            style={{
              borderColor: todo.done ? successColor : borderColor,
              backgroundColor: todo.done ? successColor : 'transparent',
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: todo.done }}
            accessibilityLabel={todo.done ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {todo.done && (
              <Check size={14} color="white" />
            )}
          </TouchableOpacity>

          {/* Content */}
          <View className="flex-1">
            {/* Title and Priority */}
            <View className="flex-row items-center justify-between mb-2">
              <Text 
                className={`text-base font-medium flex-1 mr-2 ${
                  todo.done ? 'line-through' : ''
                }`}
                style={{ color: todo.done ? mutedColor : textColor }}
                numberOfLines={2}
              >
                {todo.title}
              </Text>
              <PriorityBadge priority={todo.priority} size="small" />
            </View>

            {/* Description */}
            {todo.description && (
              <Text 
                className="text-sm mb-2"
                style={{ color: mutedColor }}
                numberOfLines={2}
              >
                {todo.description}
              </Text>
            )}

            {/* Due Date and Tags */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                {todo.due && (
                  <View className="flex-row items-center mr-4">
                    <DueDateIcon size={14} color={getDueDateColor()} />
                    <Text 
                      className="text-xs ml-1"
                      style={{ color: getDueDateColor() }}
                    >
                      {formatDueDate(todo.due)}
                      {isOverdue && ' (Overdue)'}
                    </Text>
                  </View>
                )}
                
                {todo.tags && todo.tags.length > 0 && (
                  <View className="flex-row items-center flex-wrap">
                    {todo.tags.slice(0, 2).map((tag, index) => (
                      <View 
                        key={tag}
                        className="px-2 py-1 rounded-full mr-1 mb-1"
                        style={{ backgroundColor: mutedColor + '20' }}
                      >
                        <Text 
                          className="text-xs"
                          style={{ color: mutedColor }}
                        >
                          #{tag}
                        </Text>
                      </View>
                    ))}
                    {todo.tags.length > 2 && (
                      <Text 
                        className="text-xs"
                        style={{ color: mutedColor }}
                      >
                        +{todo.tags.length - 2}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        
        {/* Action buttons when visible */}
        {showActions && (onEdit || onDelete) && (
          <View className="flex-row justify-end mt-3 pt-3 border-t border-border/30">
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                className="flex-row items-center mr-4 px-3 py-1 rounded-md"
                style={{ backgroundColor: primaryColor + '20' }}
                accessibilityRole="button"
                accessibilityLabel="Edit todo"
              >
                <Edit size={14} color={primaryColor} />
                <Text className="ml-1 text-sm" style={{ color: primaryColor }}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                className="flex-row items-center px-3 py-1 rounded-md"
                style={{ backgroundColor: destructiveColor + '20' }}
                accessibilityRole="button"
                accessibilityLabel="Delete todo"
              >
                <Trash2 size={14} color={destructiveColor} />
                <Text className="ml-1 text-sm" style={{ color: destructiveColor }}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}