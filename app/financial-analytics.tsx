import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Target,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '~/components/ui/text';
import { useTransactions } from '~/features/transactions/hooks';
import { useThemeColor } from '~/hooks/useThemeColor';
import { formatIDR, formatCompactIDR } from '~/utils/currency';
import { withAuth } from '~/features/auth/guard';

const { width } = Dimensions.get('window');

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

function FinancialAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const [selectedPeriod, setSelectedPeriod] = useState('Bulan Ini');
  
  const { transactions } = useTransactions();

  // Calculate financial metrics
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Previous month for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // Calculate totals
    const currentIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousExpense = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate changes
    const incomeChange = previousIncome === 0 ? 0 : 
      ((currentIncome - previousIncome) / previousIncome) * 100;
    
    const expenseChange = previousExpense === 0 ? 0 : 
      ((currentExpense - previousExpense) / previousExpense) * 100;

    // Category analysis for expenses
    const expensesByCategory = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryColors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
      '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
    ];

    const categoryData: CategoryData[] = Object.entries(expensesByCategory)
      .map(([category, amount], index) => ({
        name: category,
        amount,
        percentage: currentExpense === 0 ? 0 : (amount / currentExpense) * 100,
        color: categoryColors[index % categoryColors.length],
        count: monthlyTransactions.filter(t => t.category === category && t.type === 'expense').length
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories

    // Monthly trend (last 6 months)
    const monthlyTrend: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === targetDate.getMonth() && 
               date.getFullYear() === targetDate.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyTrend.push({
        month: targetDate.toLocaleDateString('id-ID', { month: 'short' }),
        income,
        expense,
        balance: income - expense
      });
    }

    // Financial health score (simplified)
    const savingsRate = currentIncome === 0 ? 0 : 
      ((currentIncome - currentExpense) / currentIncome) * 100;
    
    let healthScore = 0;
    if (savingsRate >= 20) healthScore = 100;
    else if (savingsRate >= 10) healthScore = 80;
    else if (savingsRate >= 0) healthScore = 60;
    else if (savingsRate >= -10) healthScore = 40;
    else healthScore = 20;

    return {
      currentIncome,
      currentExpense,
      currentBalance: currentIncome - currentExpense,
      incomeChange,
      expenseChange,
      categoryData,
      monthlyTrend,
      transactionCount: monthlyTransactions.length,
      savingsRate,
      healthScore,
      averageTransactionSize: monthlyTransactions.length === 0 ? 0 : 
        monthlyTransactions.reduce((sum, t) => sum + t.amount, 0) / monthlyTransactions.length
    };
  }, [transactions]);

  const renderMetricCard = (
    title: string,
    value: string,
    change: number,
    icon: React.ReactNode,
    color: string
  ) => (
    <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm" style={{ width: width * 0.44 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className={`w-12 h-12 rounded-xl items-center justify-center`} style={{ backgroundColor: color + '20' }}>
          {icon}
        </View>
        <View className={`px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </Text>
        </View>
      </View>
      
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </Text>
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </Text>
    </View>
  );

  const renderCategoryItem = (category: CategoryData, index: number) => (
    <View key={category.name} className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center flex-1">
        <View 
          className="w-4 h-4 rounded-full mr-3"
          style={{ backgroundColor: category.color }}
        />
        <View className="flex-1">
          <Text className="font-medium text-gray-900 dark:text-white">
            {category.name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {category.count} transactions
          </Text>
        </View>
      </View>
      
      <View className="items-end">
        <Text className="font-semibold text-gray-900 dark:text-white">
          {formatCompactIDR(category.amount)}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {category.percentage.toFixed(1)}%
        </Text>
      </View>
    </View>
  );

  const renderTrendChart = () => (
    <View className="flex-row justify-between items-end px-4" style={{ height: 120 }}>
      {analytics.monthlyTrend.map((data, index) => {
        const maxAmount = Math.max(...analytics.monthlyTrend.map(d => Math.max(d.income, d.expense)));
        const incomeHeight = maxAmount === 0 ? 0 : (data.income / maxAmount) * 80;
        const expenseHeight = maxAmount === 0 ? 0 : (data.expense / maxAmount) * 80;
        
        return (
          <View key={index} className="items-center">
            <View className="flex-row items-end mb-2" style={{ height: 80 }}>
              <View 
                className="bg-green-500 rounded-t-sm mr-1"
                style={{ width: 8, height: incomeHeight }}
              />
              <View 
                className="bg-red-500 rounded-t-sm"
                style={{ width: 8, height: expenseHeight }}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {data.month}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analisis Keuangan
        </Text>
        <Text className="text-gray-500 dark:text-gray-400">
          {selectedPeriod} • {analytics.transactionCount} transaksi
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Period Selector */}
        <View className="flex-row px-4 mb-6">
          {['Minggu Ini', 'Bulan Ini', 'Tahun Ini'].map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-full mr-3 ${
                selectedPeriod === period
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedPeriod === period
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Financial Health Score */}
        <View className="mx-4 mb-6">
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/80 text-sm font-medium mb-2">
                  Financial Health Score
                </Text>
                <Text className="text-white text-3xl font-bold mb-2">
                  {analytics.healthScore}/100
                </Text>
                <Text className="text-white/80 text-sm">
                  Savings Rate: {analytics.savingsRate.toFixed(1)}%
                </Text>
              </View>
              
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
                <Award size={32} color="white" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Key Metrics */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Metrics
          </Text>
          
          <View className="flex-row justify-between mb-4">
            {renderMetricCard(
              'Total Income',
              formatCompactIDR(analytics.currentIncome),
              analytics.incomeChange,
              <TrendingUp size={20} color="#10B981" />,
              '#10B981'
            )}
            
            {renderMetricCard(
              'Total Expense',
              formatCompactIDR(analytics.currentExpense),
              analytics.expenseChange,
              <TrendingDown size={20} color="#EF4444" />,
              '#EF4444'
            )}
          </View>
          
          <View className="flex-row justify-between">
            {renderMetricCard(
              'Net Balance',
              formatCompactIDR(analytics.currentBalance),
              0, // You can calculate balance change here
              <Target size={20} color="#3B82F6" />,
              '#3B82F6'
            )}
            
            {renderMetricCard(
              'Avg Transaction',
              formatCompactIDR(analytics.averageTransactionSize),
              0, // You can calculate average change here
              <BarChart3 size={20} color="#8B5CF6" />,
              '#8B5CF6'
            )}
          </View>
        </View>

        {/* Spending by Category */}
        <View className="mx-4 bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Spending Categories
            </Text>
            <PieChart size={20} color="#6B7280" />
          </View>
          
          {analytics.categoryData.length > 0 ? (
            analytics.categoryData.map(renderCategoryItem)
          ) : (
            <Text className="text-center text-gray-500 dark:text-gray-400 py-8">
              No expense data available
            </Text>
          )}
        </View>

        {/* Monthly Trend */}
        <View className="mx-4 bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              6-Month Trend
            </Text>
            <BarChart3 size={20} color="#6B7280" />
          </View>
          
          {renderTrendChart()}
          
          <View className="flex-row justify-center mt-4 gap-6">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">Income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">Expense</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View className="mx-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-3xl p-6">
          <View className="flex-row items-center mb-4">
            <AlertCircle size={20} color="#F59E0B" />
            <Text className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 ml-2">
              Financial Insights
            </Text>
          </View>
          
          <View className="space-y-3">
            {analytics.savingsRate < 10 && (
              <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
                • Consider increasing your savings rate. Financial experts recommend saving at least 20% of income.
              </Text>
            )}
            
            {analytics.categoryData.length > 0 && analytics.categoryData[0].percentage > 40 && (
              <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
                • Your highest spending category ({analytics.categoryData[0].name}) accounts for {analytics.categoryData[0].percentage.toFixed(1)}% of expenses. Consider budget optimization.
              </Text>
            )}
            
            {analytics.currentBalance < 0 && (
              <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
                • You're spending more than you earn this month. Review your expenses and create a budget plan.
              </Text>
            )}
            
            {analytics.transactionCount < 5 && (
              <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
                • Track more transactions to get better insights into your spending patterns.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default withAuth(FinancialAnalyticsScreen);
