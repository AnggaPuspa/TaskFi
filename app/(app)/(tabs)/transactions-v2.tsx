import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  RefreshControl,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Calendar,
  Eye,
  EyeOff,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Receipt
} from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useTransactions } from '~/features/transactions/hooks';
import { useThemeColor } from '~/hooks/useThemeColor';
import { withAuth } from '~/features/auth/guard';
import { formatIDR } from '~/utils/currency';

const { width } = Dimensions.get('window');

interface TransactionCardProps {
  transaction: any;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ModernTransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  const isIncome = transaction.type === 'income';
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="mx-4 mb-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Category Icon */}
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
            isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isIncome ? (
              <ArrowUpRight size={20} color={isIncome ? '#10B981' : '#EF4444'} />
            ) : (
              <ArrowDownLeft size={20} color={isIncome ? '#10B981' : '#EF4444'} />
            )}
          </View>

          {/* Transaction Info */}
          <View className="flex-1">
            <Text className="font-semibold text-base text-gray-900 dark:text-white">
              {transaction.title}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {transaction.category} • {new Date(transaction.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text className={`font-bold text-lg ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIncome ? '+' : '-'}{formatIDR(transaction.amount)}
          </Text>
          {transaction.wallet && (
            <Text className="text-xs text-gray-400 mt-1">
              {transaction.wallet}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

function TransactionsScreenV2() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Bulan Ini');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  const { transactions, isLoading, error, refetch, deleteTransaction } = useTransactions();

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    
    // Filter berdasarkan periode yang dipilih
    switch (selectedPeriod) {
      case 'Minggu Ini':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'Bulan Ini':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'Tahun Ini':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        // Default ke bulan ini
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }
    
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      balance: income - expense,
      income,
      expense,
      transactionCount: periodTransactions.length,
      periodTransactions
    };
  }, [transactions, selectedPeriod]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = financialSummary.periodTransactions;
    
    // Filter berdasarkan kategori
    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [financialSummary.periodTransactions, searchQuery, selectedCategory]);

  // Get unique categories from current period transactions
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(financialSummary.periodTransactions.map(t => t.category))];
    return ['Semua', ...uniqueCategories];
  }, [financialSummary.periodTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Hari Ini';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Kemarin';
      } else {
        dateKey = date.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups).map(([date, transactions]) => ({
      date,
      transactions,
      totalAmount: transactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      )
    }));
  }, [filteredTransactions]);

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

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleEditTransaction = (transaction: any) => {
    router.push(`/add-transaction?id=${transaction.id}`);
  };

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await deleteTransaction(transaction.id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const renderHeader = () => (
    <View className="px-4 pb-6">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between pt-4 pb-6">
        <View>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Ringkasan Keuangan
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {selectedPeriod}
          </Text>
        </View>
        
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
          >
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
          >
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View className="mb-6">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari transaksi..."
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </View>
      )}

      {/* Balance Card */}
      <View className="relative mb-6">
        <LinearGradient
          colors={financialSummary.balance >= 0 ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6 shadow-lg"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white/80 text-sm font-medium">
              Saldo Saat Ini
            </Text>
            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
              className="w-8 h-8 bg-white/20 rounded-full items-center justify-center"
            >
              {balanceVisible ? (
                <Eye size={16} color="white" />
              ) : (
                <EyeOff size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text className="text-white text-3xl font-bold mb-6">
            {balanceVisible ? formatIDR(financialSummary.balance) : '••••••'}
          </Text>
          
          <View className="flex-row justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <ArrowUpRight size={16} color="white" />
                <Text className="text-white/80 text-sm ml-2">Pemasukan</Text>
              </View>
              <Text className="text-white text-lg font-semibold">
                {balanceVisible ? formatIDR(financialSummary.income) : '••••••'}
              </Text>
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <ArrowDownLeft size={16} color="white" />
                <Text className="text-white/80 text-sm ml-2">Pengeluaran</Text>
              </View>
              <Text className="text-white text-lg font-semibold">
                {balanceVisible ? formatIDR(financialSummary.expense) : '••••••'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          onPress={handleAddTransaction}
          className="flex-1 bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Tambah Transaksi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/financial-analytics')}
          className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 items-center justify-center"
        >
          <PieChart size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 items-center justify-center"
        >
          <Receipt size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View className="flex-row gap-2 mb-6">
        {['Minggu Ini', 'Bulan Ini', 'Tahun Ini'].map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-full border ${
              selectedPeriod === period
                ? 'bg-blue-600 border-blue-600'
                : 'bg-transparent border-gray-300 dark:border-gray-600'
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

      {/* Category Filter */}
      {categories.length > 1 && (
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter Kategori:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-full border ${
                  selectedCategory === category
                    ? 'bg-green-600 border-green-600'
                    : 'bg-transparent border-gray-300 dark:border-gray-600'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Transactions Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Transaksi Terbaru
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTransactions.length} transaksi
        </Text>
      </View>
    </View>
  );

  const renderTransactionGroup = ({ item }: { item: any }) => (
    <View className="mb-6">
      {/* Date Header */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="font-semibold text-gray-900 dark:text-white">
          {item.date}
        </Text>
        <Text className={`text-sm font-medium ${
          item.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {item.totalAmount >= 0 ? '+' : ''}{formatIDR(item.totalAmount)}
        </Text>
      </View>
      
      {/* Transactions */}
      {item.transactions.map((transaction: any, index: number) => (
        <ModernTransactionCard
          key={transaction.id}
          transaction={transaction}
          onPress={() => router.push(`/transaction-detail?id=${transaction.id}`)}
          onEdit={() => handleEditTransaction(transaction)}
          onDelete={() => handleDeleteTransaction(transaction)}
        />
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-4 py-20">
      <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
        <Receipt size={32} color="#6B7280" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {searchQuery || selectedCategory !== 'Semua' 
          ? 'Tidak Ada Transaksi Ditemukan' 
          : financialSummary.transactionCount === 0 
            ? `Tidak Ada Transaksi di ${selectedPeriod}`
            : 'Belum Ada Transaksi'
        }
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
        {searchQuery || selectedCategory !== 'Semua'
          ? 'Coba ubah pencarian atau filter kategori Anda'
          : financialSummary.transactionCount === 0
            ? `Belum ada transaksi untuk periode ${selectedPeriod}. Mulai catat keuangan Anda!`
            : 'Mulai catat keuangan Anda dengan menambah transaksi pertama'
        }
      </Text>
      <Button
        onPress={() => {
          if (searchQuery || selectedCategory !== 'Semua') {
            setSearchQuery('');
            setSelectedCategory('Semua');
          } else {
            handleAddTransaction();
          }
        }}
        className="bg-blue-600 px-6 py-3 rounded-2xl"
      >
        <Text className="text-white font-semibold">
          {searchQuery || selectedCategory !== 'Semua' 
            ? 'Hapus Filter' 
            : 'Tambah Transaksi Pertama'
          }
        </Text>
      </Button>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Memuat transaksi...</Text>
      </View>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900" style={{ paddingTop: insets.top }}>
        {renderHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <FlatList
        data={groupedTransactions}
        renderItem={renderTransactionGroup}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 20,
          flexGrow: 1 
        }}
      />
    </View>
  );
}

export default withAuth(TransactionsScreenV2);
