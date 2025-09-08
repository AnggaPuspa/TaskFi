import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  StatusBar,
  Dimensions 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  Eye,
  EyeOff,
  PieChart,
  Calendar
} from 'lucide-react-native';

import { formatIDR } from '~/utils/currency';
import { Text } from '~/components/ui/text';
import { useTransactions } from '~/src/hooks';
import { useTodos } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  
  const { rows: transactions, loading: isLoadingTransactions, refetch: refetchTransactions } = useTransactions({ 
    enabled: !!userId, 
    userId: userId || undefined 
  });
  
  const { rows: todos, loading: isLoadingTodos, refetch: refetchTodos } = useTodos({ 
    enabled: !!userId, 
    userId: userId || undefined 
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [showAmount, setShowAmount] = useState(true);

  // Calculate user statistics
  const userStats = useMemo(() => {
    // Transaction stats
    const totalTransactions = transactions.length;
    const thisMonthTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

    // Todo stats
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: any) => t.done).length;
    const pendingTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // This week todos
    const thisWeekTodos = todos.filter((t: any) => {
      const todoDate = new Date(t.created_at);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return todoDate >= weekAgo;
    });

    return {
      transactions: {
        total: totalTransactions,
        thisMonth: thisMonthTransactions.length,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      },
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
        completionRate,
        thisWeek: thisWeekTodos.length
      }
    };
  }, [transactions, todos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTransactions(), refetchTodos()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTransactions, refetchTodos]);

  const formatAmount = (amount: number) => {
    if (!showAmount) return '••••••••';
    return formatIDR(amount);
  };

  // Simple Progress Bar Component
  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <View className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <View 
        className="h-full rounded-full" 
        style={{ 
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: color 
        }} 
      />
    </View>
  );

  // Simple Chart Bar Component
  const ChartBar = ({ 
    label, 
    value, 
    maxValue, 
    color 
  }: { 
    label: string; 
    value: number; 
    maxValue: number; 
    color: string; 
  }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    return (
      <View className="items-center flex-1">
        <View className="w-8 bg-gray-200 dark:bg-gray-700 rounded-t-lg mb-2" style={{ height: 100 }}>
          <View 
            className="w-full rounded-t-lg" 
            style={{ 
              height: `${percentage}%`,
              backgroundColor: color,
              marginTop: 'auto'
            }} 
          />
        </View>
        <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 dark:text-white text-center">
          {value}
        </Text>
      </View>
    );
  };

  // Donut Chart Component
  const DonutChart = ({ 
    completed, 
    total, 
    size = 120 
  }: { 
    completed: number; 
    total: number; 
    size?: number; 
  }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <View className="absolute">
          <View 
            className="rounded-full border-8 border-gray-200 dark:border-gray-700"
            style={{ width: size - 20, height: size - 20 }}
          />
          <View 
            className="absolute rounded-full border-8 border-green-500"
            style={{ 
              width: size - 20, 
              height: size - 20,
              transform: [{ rotate: '-90deg' }]
            }}
          />
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {percentage.toFixed(0)}%
          </Text>
          <Text className="text-xs text-gray-600 dark:text-gray-400">
            Selesai
          </Text>
        </View>
      </View>
    );
  };

  const isLoading = isLoadingTransactions || isLoadingTodos;

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View className="flex-1 justify-center items-center">
          <Activity size={32} color="#6B7280" />
          <Text className="text-gray-600 dark:text-gray-400 mt-2">Memuat statistik...</Text>
        </View>
      </View>
    );
  }

  if (!userId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View className="flex-1 justify-center items-center p-6">
          <BarChart3 size={64} color="#9CA3AF" />
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
            Silakan Masuk
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            Masuk untuk melihat statistik aktivitas Anda
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-gray-800 px-6 pb-6 border-b border-gray-100 dark:border-gray-700"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Statistik
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mt-1">
              Ringkasan aktivitas Anda
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowAmount(!showAmount)}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center"
          >
            {showAmount ? (
              <Eye size={20} color="#6B7280" />
            ) : (
              <EyeOff size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 gap-6">
          {/* Overview Summary - One Card Only */}
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6 rounded-3xl shadow-lg"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white/80 text-sm font-medium">
                  Total Aktivitas
                </Text>
                <Text className="text-white text-2xl font-bold">
                  {userStats.transactions.total + userStats.todos.total}
                </Text>
                <Text className="text-white/70 text-xs">
                  Transaksi & Tugas
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-2xl">
                <Activity size={32} color="white" />
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-white text-lg font-bold">
                  {formatAmount(userStats.transactions.balance)}
                </Text>
                <Text className="text-white/70 text-xs">Saldo</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-lg font-bold">
                  {userStats.todos.completionRate.toFixed(0)}%
                </Text>
                <Text className="text-white/70 text-xs">Produktivitas</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Transaction Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Transaksi
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  Aktivitas keuangan
                </Text>
              </View>
              <BarChart3 size={24} color="#3B82F6" />
            </View>

            <View className="flex-row justify-around mb-4">
              <ChartBar
                label="Total"
                value={userStats.transactions.total}
                maxValue={Math.max(userStats.transactions.total, userStats.transactions.thisMonth, 10)}
                color="#3B82F6"
              />
              <ChartBar
                label="Bulan Ini"
                value={userStats.transactions.thisMonth}
                maxValue={Math.max(userStats.transactions.total, userStats.transactions.thisMonth, 10)}
                color="#10B981"
              />
              <ChartBar
                label="Pemasukan"
                value={Math.round(userStats.transactions.totalIncome / 100000)}
                maxValue={Math.max(
                  Math.round(userStats.transactions.totalIncome / 100000),
                  Math.round(userStats.transactions.totalExpenses / 100000),
                  1
                )}
                color="#10B981"
              />
              <ChartBar
                label="Pengeluaran"
                value={Math.round(userStats.transactions.totalExpenses / 100000)}
                maxValue={Math.max(
                  Math.round(userStats.transactions.totalIncome / 100000),
                  Math.round(userStats.transactions.totalExpenses / 100000),
                  1
                )}
                color="#EF4444"
              />
            </View>

            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
              *Pemasukan & Pengeluaran dalam ratusan ribu
            </Text>
          </View>

          {/* Todo Progress Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Progress Tugas
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  Tingkat penyelesaian
                </Text>
              </View>
              <CheckCircle size={24} color="#10B981" />
            </View>

            <View className="flex-row items-center justify-between">
              <DonutChart 
                completed={userStats.todos.completed}
                total={userStats.todos.total}
                size={120}
              />

              <View className="flex-1 ml-6 space-y-4">
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      Selesai
                    </Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {userStats.todos.completed}
                    </Text>
                  </View>
                  <ProgressBar 
                    percentage={(userStats.todos.completed / Math.max(userStats.todos.total, 1)) * 100}
                    color="#10B981"
                  />
                </View>

                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      Pending
                    </Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {userStats.todos.pending}
                    </Text>
                  </View>
                  <ProgressBar 
                    percentage={(userStats.todos.pending / Math.max(userStats.todos.total, 1)) * 100}
                    color="#F59E0B"
                  />
                </View>

                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      Total Tugas
                    </Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {userStats.todos.total}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Weekly Activity Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Aktivitas Minggu Ini
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  Transaksi & tugas baru
                </Text>
              </View>
              <Calendar size={24} color="#8B5CF6" />
            </View>

            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-3">
                  <Text className="text-2xl font-bold text-blue-600">
                    {userStats.transactions.thisMonth}
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  Transaksi
                </Text>
              </View>

              <View className="items-center">
                <View className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl items-center justify-center mb-3">
                  <Text className="text-2xl font-bold text-purple-600">
                    {userStats.todos.thisWeek}
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  Tugas Baru
                </Text>
              </View>

              <View className="items-center">
                <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-3 ${
                  userStats.todos.completionRate >= 70 ? 'bg-green-100 dark:bg-green-900/30' :
                  userStats.todos.completionRate >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Text className={`text-2xl font-bold ${
                    userStats.todos.completionRate >= 70 ? 'text-green-600' :
                    userStats.todos.completionRate >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {userStats.todos.completionRate >= 70 ? '😊' :
                     userStats.todos.completionRate >= 50 ? '😐' : '😔'}
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  Mood
                </Text>
              </View>
            </View>
          </View>

          {/* Simple Tips - Only when needed */}
          {userStats.todos.completionRate < 50 && userStats.todos.total > 0 && (
            <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl">
              <Text className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                💡 Tips Produktivitas
              </Text>
              <Text className="text-amber-700 dark:text-amber-300 text-sm">
                Tingkat penyelesaian tugas masih rendah. Coba buat tugas yang lebih kecil dan spesifik.
              </Text>
            </View>
          )}

          {userStats.transactions.total === 0 && (
            <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
              <Text className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                🚀 Mulai Tracking
              </Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm">
                Belum ada transaksi. Mulai catat transaksi untuk melihat statistik keuangan.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
