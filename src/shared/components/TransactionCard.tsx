import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Edit, Trash2 } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Transaction } from '../../types';
import { getCategoryById } from '../../mocks/categories';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currency?: string;
}

export function TransactionCard({
  transaction,
  onPress,
  onEdit,
  onDelete,
  currency = '$',
}: TransactionCardProps) {
  const scale = useSharedValue(1);
  
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const incomeColor = useThemeColor({}, 'success');
  const expenseColor = useThemeColor({}, 'destructive');
  const primaryColor = useThemeColor({}, 'primary');

  const category = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? incomeColor : expenseColor;
  
  const formatAmount = (amount: number): string => {
    return `${isIncome ? '+' : '-'}${currency}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
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

  const CardContent = (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="p-4 border-b border-border/50"
        style={{ backgroundColor }}
        accessibilityRole="button"
        accessibilityLabel={`${transaction.title} transaction`}
      >
        <View className="flex-row items-center justify-between">
          {/* Left Section - Category Icon and Details */}
          <View className="flex-row items-center flex-1">
            {/* Category Icon */}
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: category?.color + '20' }}
            >
              <Text style={{ color: category?.color || textColor }}>💰</Text>
            </View>

            {/* Transaction Details */}
            <View className="flex-1">
              <Text 
                className="text-base font-medium mb-1" 
                style={{ color: textColor }}
                numberOfLines={1}
              >
                {transaction.title}
              </Text>
              
              <View className="flex-row items-center">
                <Text className="text-sm" style={{ color: mutedColor }}>
                  {category?.name || 'Other'}
                </Text>
                {transaction.note && (
                  <>
                    <Text className="text-sm mx-1" style={{ color: mutedColor }}>•</Text>
                    <Text 
                      className="text-sm flex-1" 
                      style={{ color: mutedColor }}
                      numberOfLines={1}
                    >
                      {transaction.note}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Right Section - Amount and Date */}
          <View className="items-end">
            <Text 
              className="text-lg font-semibold mb-1"
              style={{ color: amountColor }}
            >
              {formatAmount(transaction.amount)}
            </Text>
            <Text className="text-xs" style={{ color: mutedColor }}>
              {formatDate(transaction.date)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (onEdit || onDelete) {
    return (
      <View>
        {CardContent}
        <View className="flex-row justify-end px-4 pb-2">
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              className="flex-row items-center mr-4 px-3 py-1 rounded-md"
              style={{ backgroundColor: primaryColor + '20' }}
              accessibilityRole="button"
              accessibilityLabel="Edit transaction"
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
              style={{ backgroundColor: expenseColor + '20' }}
              accessibilityRole="button"
              accessibilityLabel="Delete transaction"
            >
              <Trash2 size={14} color={expenseColor} />
              <Text className="ml-1 text-sm" style={{ color: expenseColor }}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return CardContent;
}