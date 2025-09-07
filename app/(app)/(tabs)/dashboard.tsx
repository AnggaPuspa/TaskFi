import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ArrowRight, TrendingUp, CheckCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

import { formatIDR } from '~/utils/currency';

import { Text } from '~/components/ui/text';
import { Header, FAB } from '~/src/shared/ui';
import { 
  BalanceHeader, 
  ChartCard, 
  SimpleBarChart, 
  StatsCard, 
  StatsGrid,
  TodoItem 
} from '~/src/shared/components';
import { useTodos } from '~/src/hooks';
import { useTransactions } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';

import { useThemeColor } from '~/hooks/useThemeColor';

export default function DashboardScreen() {
  // ✅ STABLE HOOKS ORDER - All hooks called at top level, unconditionally
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const foregroundColor = useThemeColor({}, 'foreground');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');
  const primaryColor = useThemeColor({}, 'primary');
  const mutedForegroundColor = useThemeColor({}, 'muted-foreground');
  
  // ✅ Session and auth state (always called)
  const { session, status } = useAuth();
  const userId = session?.user?.id ?? null;
  
  // ✅ State hooks (always called)
  const [refreshing, setRefreshing] = useState(false);
  const [spinner, setSpinner] = useState(false); // For loading indicator
  
  // ✅ Custom hooks with enabled flags (always called in stable order)
  const { 
    rows: todosData,
    loading: todosLoading,
    error: todosError,
    refetch: refetchTodos,
    toggle: toggleTodoHook,
    remove: removeTodoHook,
  } = useTodos({ enabled: !!userId, userId: userId || undefined });
  
  const { 
    rows: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    remove: removeTransactionHook,
  } = useTransactions({ enabled: !!userId, userId: userId || undefined });

  // ✅ Toggle todo function - using hook's toggle method
  const toggleTodo = useCallback(async (id: string) => {
    try {
      await toggleTodoHook(id);
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }, [toggleTodoHook]);

  // ✅ Delete transaction function - using hook's remove method
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await removeTransactionHook(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }, [removeTransactionHook]);

  // ✅ Delete todo function - using hook's remove method
  const deleteTodo = useCallback(async (id: string) => {
    try {
      await removeTodoHook(id);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }, [removeTodoHook]);

  // ✅ Update spinner state based on loading states (moved to useEffect)
  useEffect(() => {
    setSpinner(todosLoading || transactionsLoading);
  }, [todosLoading, transactionsLoading]);

  // ✅ Memoized dashboard stats (stable dependencies)
  const dashboardStats = useMemo(() => {
    if (!userId) {
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalBalance: 0,
        todaysTodos: [],
        completedTodos: 0,
        pendingTodos: 0,
        recentTransactions: [],
      };
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const monthlyTransactions = transactionsData.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    console.log('📊 Dashboard Stats Debug:', {
      totalTransactions: transactionsData.length,
      monthlyTransactions: monthlyTransactions.length,
      incomeTransactions: monthlyTransactions.filter(t => t.type === 'income'),
      expenseTransactions: monthlyTransactions.filter(t => t.type === 'expense'),
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        console.log('💰 Adding income:', t.title, t.amount, typeof t.amount);
        return sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0);
      }, 0);
      
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        console.log('💸 Adding expense:', t.title, t.amount, typeof t.amount);
        return sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0);
      }, 0);

    console.log('📈 Final calculations:', { monthlyIncome, monthlyExpenses });

    const totalBalance = monthlyIncome - monthlyExpenses;
    

    // Filter tugas hari ini (gunakan perbandingan Date yang akurat)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const todaysTodos = todosData.filter(t => {
      if (!t.due || t.done) return false;
      const dueDate = new Date(t.due);
      return dueDate >= todayStart && dueDate <= todayEnd;
    });

    // Filter tugas minggu ini
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Minggu
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const thisWeekTodos = todosData.filter(t => {
      if (!t.due || t.done) return false;
      const dueDate = new Date(t.due);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });

    console.log('📋 Today\'s todos result:', {
      totalTodos: todosData.length,
      todaysTodos: todaysTodos.length,
      todaysTodoTitles: todaysTodos.map(t => t.title),
      thisWeekTodos: thisWeekTodos.length,
      thisWeekTodoTitles: thisWeekTodos.map(t => t.title)
    });
    
    const completedTodos = todosData.filter(t => t.done).length;
    const pendingTodos = todosData.filter(t => !t.done).length;

    // Recent transactions for chart
    const recentTransactions = transactionsData.slice(0, 7);

    return {
      monthlyIncome,
      monthlyExpenses,
      totalBalance,
  todaysTodos,
  thisWeekTodos,
      completedTodos,
      pendingTodos,
      recentTransactions,
    };
  }, [transactionsData, todosData, userId]);

  // ✅ Memoized chart data (stable dependencies)
  const chartData = useMemo(() => {
    return dashboardStats.recentTransactions.map((t) => ({
      label: new Date(t.date).getDate().toString(),
      value: t.amount,
      color: t.type === 'income' ? '#10B981' : '#EF4444',
    }));
  }, [dashboardStats.recentTransactions]);

  // ✅ Stable refresh handler (no hooks inside)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Use refetch methods that don't trigger hooks
      await Promise.all([
        refetchTodos(),
        refetchTransactions()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTodos, refetchTransactions]);

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleAddTodo = () => {
    router.push('/add-todo');
  };

  // ✅ Early return after all hooks (if needed)
  if (status === 'loading') {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Dashboard" />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-center text-muted-foreground">
            Loading dashboard...
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.id) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Dashboard" />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-center text-muted-foreground">
            Please sign in to view your dashboard
          </Text>
        </View>
      </View>
    );
  }

  const loading = todosLoading || transactionsLoading;
  const error = todosError || transactionsError;

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header 
        title="Dashboard" 
        subtitle={`Selamat ${new Date().getHours() < 12 ? 'pagi' : new Date().getHours() < 18 ? 'siang' : 'malam'}!`}
        rightActions={
          <TouchableOpacity
            onPress={handleAddTransaction}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Tambah transaksi"
          >
            <Plus size={24} color={foregroundColor} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading} 
            onRefresh={onRefresh} 
          />
        }
      >
        <View className="p-4 gap-6">
          {/* Balance Overview */}
          <BalanceHeader
            totalBalance={dashboardStats.totalBalance}
            monthlyIncome={dashboardStats.monthlyIncome}
            monthlyExpenses={dashboardStats.monthlyExpenses}
          />

          {/* Quick Stats */}
          <View>
            <Text className="text-lg font-semibold mb-3">Ringkasan</Text>
            <StatsGrid columns={2}>
              <StatsCard
                title="Total Pemasukan"
                value={formatIDR(dashboardStats.monthlyIncome)}
                subtitle="Bulan ini"
                change={{
                  value: "+12.5%",
                  type: "increase",
                  period: "vs bulan lalu"
                }}
                icon={TrendingUp}
                color={successColor}
              />
              <StatsCard
                title="Tugas Selesai"
                value={dashboardStats.completedTodos.toString()}
                subtitle={`${dashboardStats.pendingTodos} pending`}
                change={{
                  value: "+3",
                  type: "increase",
                  period: "hari ini"
                }}
                icon={CheckCircle}
                color={primaryColor}
              />
            </StatsGrid>
          </View>

          {/* Spending Chart */}
          <ChartCard
            title="Aktivitas Terbaru"
            subtitle="7 hari terakhir"
            chartType="bar"
            onPress={() => router.push('/reports')}
          >
            <SimpleBarChart data={chartData} />
          </ChartCard>

          {/* Today's Tasks */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold">Tugas Hari Ini</Text>
              <TouchableOpacity
                onPress={() => router.push('/todos')}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Lihat semua tugas"
              >
                <Text className="text-sm text-primary mr-1">Lihat semua</Text>
                <ArrowRight size={16} color={primaryColor} />
              </TouchableOpacity>
            </View>

            {dashboardStats.todaysTodos.length > 0 ? (
              <View className="bg-card rounded-xl border border-border overflow-hidden">
                {dashboardStats.todaysTodos.slice(0, 3).map((todo, index) => (
                  <View key={todo.id} className="border-b border-border/50 last:border-b-0">
                    <TodoItem
                      todo={todo}
                      onToggle={() => toggleTodo(todo.id)}
                      onPress={() => {
                        router.push(`/add-todo?id=${todo.id}`);
                      }}
                      onDelete={() => deleteTodo(todo.id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-card p-6 rounded-xl border border-border items-center">
                <Clock size={32} color={mutedForegroundColor} />
                <Text className="text-muted-foreground text-center mt-2">
                  Tidak ada tugas untuk hari ini
                </Text>
                <Text className="text-sm text-muted-foreground text-center mt-1">
                  Tekan tombol + untuk menambah tugas baru
                </Text>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold">Transaksi Terbaru</Text>
              <TouchableOpacity
                onPress={() => router.push('/transactions')}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Lihat semua transaksi"
              >
                <Text className="text-sm text-primary mr-1">Lihat semua</Text>
                <ArrowRight size={16} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <View className="bg-card rounded-xl border border-border overflow-hidden">
              {dashboardStats.recentTransactions.slice(0, 3).map((transaction) => (
                <View key={transaction.id}>
                  {/* Simplified transaction item for dashboard */}
                  <View className="p-4 border-b border-border/50 last:border-b-0">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium mb-1" numberOfLines={1}>
                          {transaction.title}
                        </Text>
                        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                          {new Date(transaction.date).toLocaleDateString('id-ID')}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text 
                          className="text-lg font-semibold"
                          style={{ 
                            color: transaction.type === 'income' 
                              ? successColor
                              : destructiveColor
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatIDR(transaction.amount)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => deleteTransaction(transaction.id)}
                          className="p-1"
                          accessibilityRole="button"
                          accessibilityLabel="Hapus transaksi"
                        >
                          <Text className="text-destructive text-sm">Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-4">
        <FAB
          onPress={handleAddTodo}
          accessibilityLabel="Tambah tugas baru"
        />
      </View>
    </View>
  );
}