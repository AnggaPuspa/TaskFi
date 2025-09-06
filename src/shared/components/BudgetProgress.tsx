import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Progress } from '../../../components/ui/progress';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Category } from '../../types';

interface BudgetProgressProps {
  category: Category;
  spent: number;
  currency?: string;
}

export function BudgetProgress({ 
  category, 
  spent, 
  currency = '$' 
}: BudgetProgressProps) {
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const warningColor = useThemeColor({}, 'warning');
  const dangerColor = useThemeColor({}, 'destructive');
  
  if (!category.budget) {
    return null;
  }

  const percentage = (spent / category.budget) * 100;
  const remaining = category.budget - spent;
  const isOverBudget = spent > category.budget;
  const isNearLimit = percentage >= 80 && !isOverBudget;
  
  const getProgressColor = (): string => {
    if (isOverBudget) return dangerColor;
    if (isNearLimit) return warningColor;
    return category.color;
  };

  const formatAmount = (amount: number): string => {
    return `${currency}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View className="bg-card p-4 rounded-lg border border-border">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View 
            className="w-6 h-6 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: category.color + '20' }}
          >
            <Text style={{ fontSize: 12 }}>💰</Text>
          </View>
          <Text className="text-base font-medium" style={{ color: textColor }}>
            {category.name}
          </Text>
        </View>
        
        <Text 
          className="text-sm font-medium"
          style={{ 
            color: isOverBudget ? dangerColor : isNearLimit ? warningColor : textColor 
          }}
        >
          {formatAmount(spent)} / {formatAmount(category.budget)}
        </Text>
      </View>
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className="h-2 mb-2"
        indicatorClassName="bg-primary"
        style={{ 
          backgroundColor: getProgressColor() 
        }}
      />
      
      <View className="flex-row items-center justify-between">
        <Text className="text-xs" style={{ color: mutedColor }}>
          {percentage.toFixed(1)}% used
        </Text>
        
        <Text 
          className="text-xs"
          style={{ 
            color: isOverBudget ? dangerColor : mutedColor 
          }}
        >
          {isOverBudget 
            ? `Over by ${formatAmount(Math.abs(remaining))}`
            : `${formatAmount(remaining)} left`
          }
        </Text>
      </View>
      
      {isOverBudget && (
        <View className="mt-2 p-2 rounded bg-destructive/10">
          <Text className="text-xs" style={{ color: dangerColor }}>
            ⚠️ Budget exceeded! Consider reviewing your spending in this category.
          </Text>
        </View>
      )}
      
      {isNearLimit && !isOverBudget && (
        <View className="mt-2 p-2 rounded bg-warning/10">
          <Text className="text-xs" style={{ color: warningColor }}>
            ⚡ You're approaching your budget limit for this category.
          </Text>
        </View>
      )}
    </View>
  );
}