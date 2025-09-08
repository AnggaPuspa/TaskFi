import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Download,
  CreditCard,
  BarChart3,
  User
} from 'lucide-react-native';
import { router } from 'expo-router';

import { formatIDR } from '~/utils/currency';

import { Text } from '~/components/ui/text';
import { 
  SimpleBarChart 
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
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          Loading dashboard...
        </Text>
      </View>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.id) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          Please sign in to view your dashboard
        </Text>
      </View>
    );
  }

  const loading = todosLoading || transactionsLoading;
  const error = todosError || transactionsError;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Custom Header */}
      <View 
        className="px-5 pt-4 pb-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white">
              Halo, {session?.user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().getHours() < 12 ? 'Selamat pagi' : new Date().getHours() < 18 ? 'Selamat siang' : 'Selamat malam'}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm active:scale-95"
              onPress={() => {/* Handle notifications */}}
            >
              <Bell size={20} color={foregroundColor} />
            </Pressable>
            <Pressable
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm active:scale-95"
              onPress={() => router.push('/profile')}
            >
              <User size={20} color={foregroundColor} />
            </Pressable>
          </View>
        </View>
      </View>

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
        <View className="px-5 gap-6">
          {/* Balance Card - Main Feature */}
          <View className="rounded-3xl overflow-hidden shadow-xl">
            {/* Gradien background menggunakan View terpisah */}
            <View className="bg-blue-600 dark:bg-blue-700 p-6 relative">
              {/* Background pattern/overlay */}
              <View className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20" />
              
              <View className="relative z-10">
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <Text className="text-white/70 text-sm font-medium">Saldo Bulan Ini</Text>
                    <Text className="text-white text-4xl font-bold mt-2 tracking-wide">
                      {formatIDR(dashboardStats.totalBalance)}
                    </Text>
                    <Text className="text-white/60 text-xs mt-1">
                      {dashboardStats.totalBalance >= 0 ? 'Surplus' : 'Defisit'} • {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className="bg-white/15 backdrop-blur rounded-2xl p-3">
                    <CreditCard size={28} color="white" />
                  </View>
                </View>
                
                <View className="flex-row justify-between mb-6">
                  <View className="bg-white/10 backdrop-blur rounded-xl p-4 flex-1 mr-2">
                    <View className="flex-row items-center mb-2">
                      <ArrowDownLeft size={16} color="#22C55E" />
                      <Text className="text-white/70 text-xs font-medium ml-1">Pemasukan</Text>
                    </View>
                    <Text className="text-green-300 text-lg font-bold">
                      {formatIDR(dashboardStats.monthlyIncome)}
                    </Text>
                  </View>
                  <View className="bg-white/10 backdrop-blur rounded-xl p-4 flex-1 ml-2">
                    <View className="flex-row items-center mb-2">
                      <ArrowUpRight size={16} color="#EF4444" />
                      <Text className="text-white/70 text-xs font-medium ml-1">Pengeluaran</Text>
                    </View>
                    <Text className="text-red-300 text-lg font-bold">
                      {formatIDR(dashboardStats.monthlyExpenses)}
                    </Text>
                  </View>
                </View>

                {/* Quick Actions for Finance Tracking */}
                <View className="flex-row justify-between gap-3">
                  <Pressable 
                    className="items-center justify-center rounded-2xl p-4 bg-green-500/20 backdrop-blur flex-1 active:scale-95 active:bg-green-500/30"
                    onPress={() => router.push('/add-transaction?type=income')}
                  >
                    <Plus size={22} color="#22C55E" />
                    <Text className="text-green-300 text-sm font-semibold mt-2">Pemasukan</Text>
                  </Pressable>
                  <Pressable 
                    className="items-center justify-center rounded-2xl p-4 bg-red-500/20 backdrop-blur flex-1 active:scale-95 active:bg-red-500/30"
                    onPress={() => router.push('/add-transaction?type=expense')}
                  >
                    <ArrowUpRight size={22} color="#EF4444" />
                    <Text className="text-red-300 text-sm font-semibold mt-2">Pengeluaran</Text>
                  </Pressable>
                  <Pressable 
                    className="items-center justify-center rounded-2xl p-4 bg-white/15 backdrop-blur flex-1 active:scale-95 active:bg-white/20"
                    onPress={() => router.push('/transactions')}
                  >
                    <BarChart3 size={22} color="white" />
                    <Text className="text-white text-sm font-semibold mt-2">Laporan</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-5">Ringkasan</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 rounded-3xl p-5 bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 items-center justify-center">
                    <TrendingUp size={20} color="white" />
                  </View>
                  <View className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-bold">+12.5%</Text>
                  </View>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Pemasukan Bulan Ini</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {formatIDR(dashboardStats.monthlyIncome)}
                </Text>
              </View>
              
              <View className="flex-1 rounded-3xl p-5 bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center">
                    <CheckCircle size={20} color="white" />
                  </View>
                  <View className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">+3</Text>
                  </View>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Tugas Selesai</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {dashboardStats.completedTodos}
                </Text>
              </View>
            </View>
          </View>

          {/* Chart Section */}
          <View className="rounded-3xl p-6 bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 items-center justify-center mr-4">
                  <BarChart3 size={20} color="white" />
                </View>
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold">Aktivitas Terbaru</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">7 hari terakhir</Text>
                </View>
              </View>
              <Pressable 
                className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 active:scale-95"
                onPress={() => router.push('/reports')}
              >
                <ArrowRight size={20} color="#3B82F6" />
              </Pressable>
            </View>
            {chartData.length > 0 ? (
              <SimpleBarChart data={chartData} />
            ) : (
              <View className="h-40 items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <View className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mb-3">
                  <BarChart3 size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold mb-1">
                  Belum ada data transaksi
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  Tambah transaksi pertama Anda untuk melihat grafik
                </Text>
              </View>
            )}
          </View>

          {/* Today's Tasks */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Tugas Hari Ini</Text>
              <Pressable
                onPress={() => router.push('/todos')}
                className="flex-row items-center active:scale-95"
              >
                <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium mr-1">Lihat semua</Text>
                <ArrowRight size={16} color="#3B82F6" />
              </Pressable>
            </View>

            {dashboardStats.todaysTodos.length > 0 ? (
              <View className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                {dashboardStats.todaysTodos.slice(0, 3).map((todo, index) => (
                  <View key={todo.id}>
                    <Pressable
                      className="p-5 flex-row items-center active:bg-gray-50 dark:active:bg-gray-800"
                      onPress={() => router.push(`/add-todo?id=${todo.id}`)}
                    >
                      <Pressable
                        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-4 items-center justify-center active:scale-95"
                        onPress={() => toggleTodo(todo.id)}
                      >
                        {todo.done && <View className="w-3 h-3 rounded-full bg-green-500" />}
                      </Pressable>
                      
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-2" numberOfLines={1}>
                          {todo.title}
                        </Text>
                        <View className="flex-row items-center">
                          <View className="rounded-full px-3 py-1 bg-red-100 dark:bg-red-900/30 mr-3">
                            <Text className="text-red-600 dark:text-red-400 text-xs font-bold">PRIORITAS</Text>
                          </View>
                          <Clock size={14} color="#9CA3AF" />
                          <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                            {todo.due ? new Date(todo.due).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : 'Tanpa deadline'}
                          </Text>
                        </View>
                      </View>
                      
                      <Pressable
                        onPress={() => deleteTodo(todo.id)}
                        className="ml-3 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 active:scale-95"
                      >
                        <Text className="text-red-500 text-sm font-medium">Hapus</Text>
                      </Pressable>
                    </Pressable>
                    {index < dashboardStats.todaysTodos.slice(0, 3).length - 1 && (
                      <View className="border-b border-gray-100 dark:border-gray-800 ml-5" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="rounded-3xl p-8 bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 items-center">
                <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-4">
                  <Clock size={28} color="#3B82F6" />
                </View>
                <Text className="text-gray-900 dark:text-white font-bold text-lg text-center mb-2">
                  Tidak ada tugas hari ini
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                  Hari ini bisa jadi hari santai atau tambah tugas baru
                </Text>
                <Pressable
                  className="bg-blue-600 px-4 py-2 rounded-xl active:scale-95"
                  onPress={handleAddTodo}
                >
                  <Text className="text-white font-semibold text-sm">Tambah Tugas</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Transaksi Terbaru</Text>
              <Pressable
                onPress={() => router.push('/transactions')}
                className="flex-row items-center active:scale-95"
              >
                <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium mr-1">Lihat semua</Text>
                <ArrowRight size={16} color="#3B82F6" />
              </Pressable>
            </View>

            {dashboardStats.recentTransactions.length > 0 ? (
              <View className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                {dashboardStats.recentTransactions.slice(0, 4).map((transaction, index) => (
                  <View key={transaction.id}>
                    <View className="p-5 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft size={24} color="#22C55E" />
                          ) : (
                            <ArrowUpRight size={24} color="#EF4444" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1" numberOfLines={1}>
                            {transaction.title}
                          </Text>
                          <Text className="text-gray-500 dark:text-gray-400 text-sm">
                            {new Date(transaction.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center">
                        <Text 
                          className="text-xl font-bold mr-4"
                          style={{ 
                            color: transaction.type === 'income' ? '#22C55E' : '#EF4444'
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatIDR(transaction.amount)}
                        </Text>
                        <Pressable
                          onPress={() => deleteTransaction(transaction.id)}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 active:scale-95"
                        >
                          <Text className="text-red-500 text-sm font-medium">Hapus</Text>
                        </Pressable>
                      </View>
                    </View>
                    {index < dashboardStats.recentTransactions.slice(0, 4).length - 1 && (
                      <View className="border-b border-gray-100 dark:border-gray-800 ml-5" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="rounded-3xl p-8 bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 items-center">
                <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
                  <CreditCard size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 dark:text-white font-bold text-lg text-center mb-2">
                  Belum ada transaksi
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                  Mulai catat pemasukan dan pengeluaran Anda
                </Text>
                <Pressable
                  className="bg-blue-600 px-4 py-2 rounded-xl active:scale-95"
                  onPress={handleAddTransaction}
                >
                  <Text className="text-white font-semibold text-sm">Tambah Transaksi</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-5">
        <Pressable
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 items-center justify-center shadow-2xl active:scale-95"
          onPress={handleAddTransaction}
        >
          <Plus size={32} color="white" />
        </Pressable>
      </View>
    </View>
  );
}