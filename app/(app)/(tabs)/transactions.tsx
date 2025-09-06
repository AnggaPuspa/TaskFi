import React, { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { Text } from '~/components/ui/text';
import { Header, FAB, EmptyState } from '~/src/shared/ui';
import { TransactionCard, FilterBar } from '~/src/shared/components';

import { mockTransactions } from '~/src/mocks';
import { Transaction, TransactionFilters } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions based on current filters and search
  const filteredTransactions = useMemo(() => {
    let filtered = [...mockTransactions];

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        (t.note && t.note.toLowerCase().includes(query))
      );
    }

    // Apply date filters if any
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filters, searchQuery]);

  // Group transactions by month for section headers
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    router.push(`/add-transaction?id=${transaction.id}`);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    // In a real app, this would call an API or update state
    console.log('Delete transaction:', transaction.id);
    // You could show a confirmation dialog here
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // Navigate to transaction details or show modal
    console.log('View transaction:', transaction.id);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
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
    const data: (Transaction | { type: 'header'; month: string })[] = [];
    
    groupedTransactions.forEach(({ month, transactions }) => {
      data.push({ type: 'header', month });
      data.push(...transactions);
    });
    
    return data;
  };

  const renderItem = ({ item }: { item: Transaction | { type: 'header'; month: string } }) => {
    if ('type' in item && item.type === 'header') {
      return renderSectionHeader(item.month, 0);
    }
    return renderTransaction({ item: item as Transaction });
  };

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
          title="No transactions found\"
          description="Try adjusting your filters or search criteria\"
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

  if (mockTransactions.length === 0) {
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
          return (item as Transaction).id;
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
        getItemLayout={(data, index) => ({
          length: 80, // Approximate item height
          offset: 80 * index,
          index,
        })}
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