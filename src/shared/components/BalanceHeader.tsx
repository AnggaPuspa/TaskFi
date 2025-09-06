import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface BalanceHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currency?: string;
  allowVisibilityToggle?: boolean;
}

export function BalanceHeader({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  currency = '$',
  allowVisibilityToggle = true,
}: BalanceHeaderProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  
  const incomeColor = useThemeColor({}, 'success');
  const expenseColor = useThemeColor({}, 'destructive');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const textColor = useThemeColor({}, 'foreground');

  const formatAmount = (amount: number): string => {
    if (!isBalanceVisible) return '••••••';
    return `${currency}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const netIncome = monthlyIncome - monthlyExpenses;
  const isPositive = netIncome >= 0;

  return (
    <View className="bg-card p-6 rounded-xl shadow-sm">
      {/* Total Balance */}
      <View className="items-center mb-6">
        <View className="flex-row items-center">
          <Text className="text-sm text-muted-foreground mb-2">
            Total Balance
          </Text>
          {allowVisibilityToggle && (
            <TouchableOpacity
              onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {isBalanceVisible ? (
                <Eye size={16} color={mutedColor} />
              ) : (
                <EyeOff size={16} color={mutedColor} />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <Text 
          className="text-3xl font-bold text-center"
          style={{ color: isPositive ? incomeColor : expenseColor }}
        >
          {formatAmount(totalBalance)}
        </Text>
      </View>

      {/* Income vs Expenses */}
      <View className="flex-row justify-between">
        {/* Income */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center mb-1">
            <TrendingUp size={16} color={incomeColor} />
            <Text className="text-xs text-muted-foreground ml-1">
              Income
            </Text>
          </View>
          <Text 
            className="text-lg font-semibold"
            style={{ color: incomeColor }}
          >
            {formatAmount(monthlyIncome)}
          </Text>
        </View>

        {/* Divider */}
        <View className="w-px bg-border mx-4" />

        {/* Expenses */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center mb-1">
            <TrendingDown size={16} color={expenseColor} />
            <Text className="text-xs text-muted-foreground ml-1">
              Expenses
            </Text>
          </View>
          <Text 
            className="text-lg font-semibold"
            style={{ color: expenseColor }}
          >
            {formatAmount(monthlyExpenses)}
          </Text>
        </View>
      </View>

      {/* Net Income Indicator */}
      <View className="mt-4 pt-4 border-t border-border">
        <View className="flex-row items-center justify-center">
          <Text className="text-sm text-muted-foreground mr-2">
            This month:
          </Text>
          <Text 
            className="text-sm font-medium"
            style={{ color: isPositive ? incomeColor : expenseColor }}
          >
            {isPositive ? '+' : ''}{formatAmount(netIncome)}
          </Text>
        </View>
      </View>
    </View>
  );
}