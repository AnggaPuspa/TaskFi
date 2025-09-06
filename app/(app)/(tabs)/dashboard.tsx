import React from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ArrowRight, TrendingUp, CheckCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

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

import { mockTransactions, mockTodos, getTodaysTodos } from '~/src/mocks';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const [refreshing, setRefreshing] = React.useState(false);

  // Calculate dashboard stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = mockTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = monthlyIncome - monthlyExpenses;
  
  const todaysTodos = getTodaysTodos();
  const completedTodos = mockTodos.filter(t => t.done).length;
  const pendingTodos = mockTodos.filter(t => !t.done).length;

  // Recent transactions for chart
  const recentTransactions = mockTransactions.slice(0, 7);
  const chartData = recentTransactions.map((t, index) => ({
    label: new Date(t.date).getDate().toString(),
    value: t.amount,
    color: t.type === 'income' ? '#10B981' : '#EF4444',
  }));

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleAddTodo = () => {
    router.push('/add-todo');
  };

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header 
        title="Dashboard" 
        subtitle={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!`}
        rightActions={
          <TouchableOpacity
            onPress={handleAddTransaction}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
          >
            <Plus size={24} color={useThemeColor({}, 'foreground')} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 gap-6">
          {/* Balance Overview */}
          <BalanceHeader
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
          />

          {/* Quick Stats */}
          <View>
            <Text className="text-lg font-semibold mb-3">Overview</Text>
            <StatsGrid columns={2}>
              <StatsCard
                title="Total Income"
                value={`$${monthlyIncome.toLocaleString()}`}
                subtitle="This month"
                change={{
                  value: "+12.5%",
                  type: "increase",
                  period: "vs last month"
                }}
                icon={TrendingUp}
                color={useThemeColor({}, 'success')}
              />
              <StatsCard
                title="Completed Tasks"
                value={completedTodos.toString()}
                subtitle={`${pendingTodos} pending`}
                change={{
                  value: "+3",
                  type: "increase",
                  period: "today"
                }}
                icon={CheckCircle}
                color={useThemeColor({}, 'primary')}
              />
            </StatsGrid>
          </View>

          {/* Spending Chart */}
          <ChartCard
            title="Recent Activity"
            subtitle="Last 7 days"
            chartType="bar"
            onPress={() => router.push('/reports')}
          >
            <SimpleBarChart data={chartData} />
          </ChartCard>

          {/* Today's Tasks */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold">Today's Tasks</Text>
              <TouchableOpacity
                onPress={() => router.push('/todos')}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="View all todos"
              >
                <Text className="text-sm text-primary mr-1">View all</Text>
                <ArrowRight size={16} color={useThemeColor({}, 'primary')} />
              </TouchableOpacity>
            </View>

            {todaysTodos.length > 0 ? (
              <View className="bg-card rounded-xl border border-border overflow-hidden">
                {todaysTodos.slice(0, 3).map((todo, index) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={() => {
                      // Handle toggle in actual implementation
                      console.log('Toggle todo:', todo.id);
                    }}
                    onPress={() => {
                      // Handle press in actual implementation
                      console.log('Press todo:', todo.id);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className="bg-card p-6 rounded-xl border border-border items-center">
                <Clock size={32} color={useThemeColor({}, 'muted-foreground')} />
                <Text className="text-muted-foreground text-center mt-2">
                  No tasks for today
                </Text>
                <Text className="text-sm text-muted-foreground text-center mt-1">
                  Tap the + button to add a new task
                </Text>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold">Recent Transactions</Text>
              <TouchableOpacity
                onPress={() => router.push('/transactions')}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="View all transactions"
              >
                <Text className="text-sm text-primary mr-1">View all</Text>
                <ArrowRight size={16} color={useThemeColor({}, 'primary')} />
              </TouchableOpacity>
            </View>

            <View className="bg-card rounded-xl border border-border overflow-hidden">
              {recentTransactions.slice(0, 3).map((transaction) => (
                <View key={transaction.id}>
                  {/* Simplified transaction item for dashboard */}
                  <View className="p-4 border-b border-border/50 last:border-b-0">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium mb-1" numberOfLines={1}>
                          {transaction.title}
                        </Text>
                        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text 
                        className="text-lg font-semibold"
                        style={{ 
                          color: transaction.type === 'income' 
                            ? useThemeColor({}, 'success')
                            : useThemeColor({}, 'destructive')
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </Text>
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
          accessibilityLabel="Add new task"
        />
      </View>
    </View>
  );
}