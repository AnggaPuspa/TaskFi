import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  ChevronDown 
} from 'lucide-react-native';

import { formatIDR } from '~/utils/currency';

import { Text } from '~/components/ui/text';
import { Header } from '~/src/shared/ui';
import { 
  ChartCard, 
  SimpleBarChart, 
  SimplePieChart, 
  StatsCard, 
  BudgetProgress 
} from '~/src/shared/components';

import { mockCategories, getCategoriesByType } from '~/src/mocks';
import { useTransactions } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function ReportsScreen() {
  // ✅ ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - BEFORE ANY CONDITIONAL RETURNS
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const mutedForegroundColor = useThemeColor({}, 'muted-foreground');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');
  const warningColor = useThemeColor({}, 'warning');
  const primaryColor = useThemeColor({}, 'primary');
  
  // ✅ Auth state
  const { session, status } = useAuth();
  const userId = session?.user?.id ?? null;
  
  const { rows: transactions, loading: isLoading, error, refetch } = useTransactions({ 
    enabled: !!userId, 
    userId: userId || undefined 
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const periods = ['This Month', 'Last Month', 'Last 3 Months', 'This Year'];

  // Calculate financial data for the selected period
  const financialData = useMemo(() => {
    console.log('📊 Reports Debug:', {
      transactionsCount: transactions.length,
      selectedPeriod,
      userId,
      isLoading,
      error,
      sampleTransactions: transactions.slice(0, 3)
    });

    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    console.log('📅 Date filter:', {
      startDate: startDate.toISOString(),
      now: now.toISOString(),
      selectedPeriod
    });

    const periodTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      const isInPeriod = transactionDate >= startDate;
      console.log('🔍 Transaction filter:', {
        title: t.title,
        date: t.date,
        transactionDate: transactionDate.toISOString(),
        startDate: startDate.toISOString(),
        isInPeriod
      });
      return isInPeriod;
    });

    console.log('✅ Filtered transactions:', {
      total: periodTransactions.length,
      income: periodTransactions.filter((t: any) => t.type === 'income').length,
      expense: periodTransactions.filter((t: any) => t.type === 'expense').length
    });

    const income = periodTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
      
    const expenses = periodTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

    const netIncome = income - expenses;
    const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;

    return {
      income,
      expenses,
      netIncome,
      savingsRate,
      transactions: periodTransactions,
    };
  }, [selectedPeriod, transactions]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    financialData.transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0);
      });

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = mockCategories.find(c => c.id === categoryId);
        return {
          label: category?.name || 'Other',
          value: amount,
          color: category?.color || '#6B7280',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [financialData.transactions]);

  // Monthly trend data for bar chart
  const monthlyTrend = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    financialData.transactions.forEach((t: any) => {
      const monthKey = new Date(t.date).toLocaleDateString('en-US', { 
        month: 'short' 
      });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      label: month,
      value: data.income - data.expenses,
      color: data.income > data.expenses ? '#10B981' : '#EF4444',
    }));
  }, [financialData.transactions]);

  // Budget progress data
  const budgetData = useMemo(() => {
    const categorySpending: { [key: string]: number } = {};
    
    financialData.transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + amount;
      });

    return getCategoriesByType('expense')
      .filter(category => category.budget && categorySpending[category.id])
      .map(category => ({
        category,
        spent: categorySpending[category.id] || 0,
      }));
  }, [financialData.transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  
  // ✅ Load transactions when screen mounts (only once) - HOOK CALLED BEFORE CONDITIONALS
  React.useEffect(() => {
    // Data automatically loaded by useTransactions hook
  }, []);

  const formatCurrency = (amount: number) => {
    return formatIDR(amount);
  };
  
  // ✅ NOW SAFE TO HAVE CONDITIONAL RETURNS - ALL HOOKS CALLED ABOVE
  
  // Show loading state for auth
  if (status === 'loading') {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Reports" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      </View>
    );
  }

  // Show unauthenticated state
  if (status === 'unauthenticated' || !session?.user?.id) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Reports" />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-lg font-semibold mb-2">Please sign in</Text>
          <Text className="text-muted-foreground text-center mb-4">
            Sign in to view your financial reports.
          </Text>
        </View>
      </View>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Reports" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading reports...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Reports" />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-destructive mb-2">Error loading data</Text>
          <Text className="text-muted-foreground text-center mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg"
            onPress={() => refetch()}
          >
            <Text className="text-primary-foreground">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Show empty state if no transactions (but only if we have loaded and there really are none)
  if (!isLoading && transactions.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Reports" />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-lg font-semibold mb-2">No data available</Text>
          <Text className="text-muted-foreground text-center mb-4">
            Add some transactions to see your financial reports.
          </Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-primary-foreground">Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header 
        title="Reports" 
        rightActions={
          <TouchableOpacity
            className="flex-row items-center px-3 py-1 rounded-lg border border-border"
            onPress={() => {
              // In a real app, this would open a period selection modal
              console.log('Open period selector');
            }}
          >
            <Text className="text-sm mr-1">{selectedPeriod}</Text>
            <ChevronDown size={16} color={mutedForegroundColor} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 gap-6">
          {/* Debug Info - Remove in production */}
          {__DEV__ && (
            <View className="bg-muted p-4 rounded-lg">
              <Text className="text-sm font-semibold mb-2">Debug Info:</Text>
              <Text className="text-xs">Total Transactions: {transactions.length}</Text>
              <Text className="text-xs">Period Transactions: {financialData.transactions.length}</Text>
              <Text className="text-xs">Income: {formatCurrency(financialData.income)}</Text>
              <Text className="text-xs">Expenses: {formatCurrency(financialData.expenses)}</Text>
              <Text className="text-xs">User ID: {userId}</Text>
              <Text className="text-xs">Loading: {isLoading.toString()}</Text>
              <Text className="text-xs">Error: {error || 'none'}</Text>
            </View>
          )}

          {/* Key Metrics */}
          <View>
            <Text className="text-lg font-semibold mb-3">Financial Overview</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <StatsCard
                  title="Total Income"
                  value={formatCurrency(financialData.income)}
                  subtitle={selectedPeriod}
                  change={{
                    value: "+8.2%",
                    type: "increase",
                    period: "vs previous"
                  }}
                  icon={TrendingUp}
                  color={successColor}
                />
              </View>
              <View className="flex-1">
                <StatsCard
                  title="Total Expenses"
                  value={formatCurrency(financialData.expenses)}
                  subtitle={selectedPeriod}
                  change={{
                    value: "+3.1%",
                    type: "increase",
                    period: "vs previous"
                  }}
                  icon={TrendingDown}
                  color={destructiveColor}
                />
              </View>
            </View>
          </View>

          <View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <StatsCard
                  title="Net Income"
                  value={formatCurrency(financialData.netIncome)}
                  subtitle={financialData.netIncome >= 0 ? 'Surplus' : 'Deficit'}
                  change={{
                    value: financialData.netIncome >= 0 ? "+" + formatCurrency(financialData.netIncome) : formatCurrency(financialData.netIncome),
                    type: financialData.netIncome >= 0 ? "increase" : "decrease",
                  }}
                  icon={DollarSign}
                  color={financialData.netIncome >= 0 ? successColor : destructiveColor}
                />
              </View>
              <View className="flex-1">
                <StatsCard
                  title="Savings Rate"
                  value={`${financialData.savingsRate.toFixed(1)}%`}
                  subtitle="Of total income"
                  change={{
                    value: "Target: 20%",
                    type: financialData.savingsRate >= 20 ? "increase" : "neutral",
                  }}
                  icon={Target}
                  color={primaryColor}
                />
              </View>
            </View>
          </View>

          {/* Monthly Trend Chart */}
          <ChartCard
            title="Monthly Trend"
            subtitle="Net income over time"
            value={formatCurrency(monthlyTrend.reduce((sum, m) => sum + m.value, 0) / monthlyTrend.length)}
            change="+12.5%"
            changeType={financialData.netIncome >= 0 ? 'positive' : 'negative'}
            chartType="bar"
          >
            <SimpleBarChart data={monthlyTrend} />
          </ChartCard>

          {/* Category Breakdown */}
          <ChartCard
            title="Expense Breakdown"
            subtitle="Top spending categories"
            value={formatCurrency(financialData.expenses)}
            chartType="pie"
          >
            <SimplePieChart data={categoryBreakdown} />
          </ChartCard>

          {/* Budget Progress */}
          {budgetData.length > 0 && (
            <View>
              <Text className="text-lg font-semibold mb-3">Budget Progress</Text>
              <View className="gap-3">
                {budgetData.map(({ category, spent }) => (
                  <BudgetProgress
                    key={category.id}
                    category={category}
                    spent={spent}
                  />
                ))}            </View>
            </View>
          )}

          {/* Insights */}
          <View>
            <Text className="text-lg font-semibold mb-3">Insights</Text>
            <View className="bg-card p-4 rounded-xl border border-border">
              {financialData.savingsRate >= 20 ? (
                <View className="flex-row items-start">
                  <View className="w-2 h-2 rounded-full bg-success mt-2 mr-3" />
                  <View className="flex-1">
                    <Text className="font-medium mb-1" style={{ color: successColor }}>
                      Great savings rate!
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      You're saving {financialData.savingsRate.toFixed(1)}% of your income, which exceeds the recommended 20% target.
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-start">
                  <View className="w-2 h-2 rounded-full bg-warning mt-2 mr-3" />
                  <View className="flex-1">
                    <Text className="font-medium mb-1" style={{ color: warningColor }}>
                      Consider increasing savings
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Your savings rate is {financialData.savingsRate.toFixed(1)}%. Consider aiming for 20% to build a stronger financial foundation.
                    </Text>
                  </View>
                </View>
              )}
              
              {categoryBreakdown.length > 0 && (
                <View className="mt-4 pt-4 border-t border-border/30">
                  <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full bg-primary mt-2 mr-3" />
                    <View className="flex-1">
                      <Text className="font-medium mb-1">
                        Top expense category
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {categoryBreakdown[0]?.label} accounts for {formatCurrency(categoryBreakdown[0]?.value || 0)} 
                        ({((categoryBreakdown[0]?.value || 0) / financialData.expenses * 100).toFixed(1)}%) of your expenses.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
