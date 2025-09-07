import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { Text } from '~/components/ui/text';
import { Header, FAB, EmptyState } from '~/src/shared/ui';
import { TransactionCard, FilterBar } from '~/src/shared/components';
import { useTransactions } from '~/features/transactions/hooks';

import { TransactionFilters } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';
import { withAuth } from '~/features/auth/guard';

function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const { transactions, isLoading: loading, error, refetch, deleteTransaction } = useTransactions();

  // Filter transactions based on current filters and search
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Apply search query - this is already handled by the hook via searchQuery
    // No need to filter again here

    // Apply date filters if any
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
    }

    // Sort by date (newest first) - this is already handled by the hook
    return filtered;
  }, [transactions, filters]);

  // Group transactions by month for section headers
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: typeof transactions } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(transaction);
    });
    
    return Object.entries(groups).map(([month, transactions]) => ({
      month,
      transactions,
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

  const handleEditTransaction = (transaction: typeof transactions[0]) => {
    router.push(`/add-transaction?id=${transaction.id}`);
  };

  const handleDeleteTransaction = async (transaction: typeof transactions[0]) => {
    try {
      await deleteTransaction(transaction.id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // Could show an alert here
    }
  };

  const handleTransactionPress = (transaction: typeof transactions[0]) => {
    // Navigate to transaction details or show modal
    console.log('View transaction:', transaction.id);
  };

  // Load transactions automatically handled by the useTransactions hook
  // No need for manual useEffect with loadTransactions

  const renderTransaction = ({ item }: { item: typeof transactions[0] }) => (
    <TransactionCard
      transaction={item}
      onPress={() => handleTransactionPress(item)}
      onEdit={() => handleEditTransaction(item)}
      onDelete={() => handleDeleteTransaction(item)}
    />
  );

  const renderSectionHeader = (month: string, index: number) => (
    <View 
      key={`header-${month}`}
      className="bg-background px-4 py-2 border-b border-border/30"
    >
      <Text className="text-sm font-semibold text-muted-foreground">
        {month}
      </Text>
    </View>
  );

  const renderFlatListData = () => {
    const data: (typeof transactions[0] | { type: 'header'; month: string })[] = [];
    
    groupedTransactions.forEach(({ month, transactions }) => {
      data.push({ type: 'header', month });
      data.push(...transactions);
    });
    
    return data;
  };

  const renderItem = ({ item }: { item: typeof transactions[0] | { type: 'header'; month: string } }) => {
    if ('type' in item && item.type === 'header') {
      return renderSectionHeader(item.month, 0);
    }
    return renderTransaction({ item: item as typeof transactions[0] });
  };

  // Show loading state
  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Transactions" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading transactions...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Transactions" />
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onSearchChange={setSearchQuery}
        />
        <EmptyState
          title="Error loading transactions"
          description={(error as Error)?.message || 'An error occurred while loading transactions'}
          actionLabel="Try Again"
          onAction={() => refetch()}
        />
        <View className="absolute bottom-6 right-4">
          <FAB
            onPress={handleAddTransaction}
            accessibilityLabel="Add new transaction"
          />
        </View>
      </View>
    );
  }

  if (filteredTransactions.length === 0 && (searchQuery || Object.keys(filters).length > 0)) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Transactions" />
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onSearchChange={setSearchQuery}
        />
        <EmptyState
          title="No transactions found"
          description="Try adjusting your filters or search criteria"
          actionLabel="Clear Filters"
          onAction={() => {
            setFilters({});
            setSearchQuery('');
          }}
        />
        <View className="absolute bottom-6 right-4">
          <FAB
            onPress={handleAddTransaction}
            accessibilityLabel="Add new transaction"
          />
        </View>
      </View>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Transactions" />
        <EmptyState
          title="No transactions yet"
          description="Start tracking your income and expenses by adding your first transaction"
          actionLabel="Add Transaction"
          onAction={handleAddTransaction}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header title="Transactions" />
      
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onSearchChange={setSearchQuery}
      />
      
      <FlatList
        data={renderFlatListData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          if ('type' in item && item.type === 'header') {
            return `header-${item.month}`;
          }
          return (item as typeof transactions[0]).id;
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        getItemLayout={undefined} // Remove getItemLayout for dynamic item heights
      />

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-4">
        <FAB
          onPress={handleAddTransaction}
          icon={Plus}
          accessibilityLabel="Add new transaction"
        />
      </View>
    </View>
  );
}

export default withAuth(TransactionsScreen);