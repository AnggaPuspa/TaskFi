import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

import { Text } from '~/components/ui/text';
import { Header, FAB, EmptyState } from '~/src/shared/ui';
import { TodoItem, TodoFilter } from '~/src/shared/components';
import { useTodos } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';

import { TodoFilter as TodoFilterType } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';
import { withAuth } from '~/features/auth/guard';

function TodosScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const [activeFilter, setActiveFilter] = useState<TodoFilterType>('all');
  
  const { session } = useAuth();
  const { 
    rows: todos, 
    loading, 
    error, 
    refetch, 
    toggle: toggleTodo, 
    remove: deleteTodo 
  } = useTodos({ enabled: !!session?.user?.id, userId: session?.user?.id });
  
  // Debug log untuk memonitor state todos
  React.useEffect(() => {
    console.log('TodosScreen: todos state changed:', {
      todosLength: todos.length,
      loading,
      error,
      userId: session?.user?.id,
    });
  }, [todos, loading, error, session?.user?.id]);

  // Refresh data ketika screen difokuskan (user kembali dari add-todo)
  useFocusEffect(
    useCallback(() => {
      console.log('TodosScreen: Screen focused, refreshing data...');
      if (session?.user?.id) {
        refetch();
      }
    }, [session?.user?.id, refetch])
  );
  
  const [refreshing, setRefreshing] = useState(false);

  // Convert UI filter to hook filters
  const hookFilters = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return { completed: false, dueDateFilter: 'today' };
      case 'week':
        return { completed: false, dueDateFilter: 'week' };
      case 'completed':
        return { completed: true };
      default:
        return { completed: false };
    }
  }, [activeFilter]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const today = new Date();
    // Set waktu ke awal hari untuk perbandingan yang akurat
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      all: todos.filter(t => !t.done).length,
      today: todos.filter(t => {
        if (!t.due || t.done) return false;
        const dueDate = new Date(t.due);
        return dueDate >= todayStart && dueDate <= todayEnd;
      }).length,
      week: todos.filter(t => {
        if (!t.due || t.done) return false;
        const dueDate = new Date(t.due);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      }).length,
      completed: todos.filter(t => t.done).length,
    };
  }, [todos]);

  // Filter todos based on active filter (client-side filtering for date-based filters)
  const filteredTodos = useMemo(() => {
    const today = new Date();
    // Set waktu ke awal hari untuk perbandingan yang akurat
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    switch (activeFilter) {
      case 'today':
        return todos.filter(t => {
          if (!t.due || t.done) return false;
          const dueDate = new Date(t.due);
          return dueDate >= todayStart && dueDate <= todayEnd;
        });
      case 'week':
        return todos.filter(t => {
          if (!t.due || t.done) return false;
          const dueDate = new Date(t.due);
          return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
      case 'completed':
        return todos.filter(t => t.done);
      default:
        return todos.filter(t => !t.done);
    }
  }, [todos, activeFilter]);

  // Group todos by priority and due date
  const groupedTodos = useMemo(() => {
    const today = new Date();
    const overdue = filteredTodos.filter(t => {
      if (!t.due || t.done) return false;
      return new Date(t.due) < today;
    });
    
    const high = filteredTodos.filter(t => t.priority === 'high' && !overdue.includes(t));
    const medium = filteredTodos.filter(t => t.priority === 'medium' && !overdue.includes(t));
    const low = filteredTodos.filter(t => t.priority === 'low' && !overdue.includes(t));
    
    const groups: { title: string; data: typeof todos }[] = [];
    
    if (overdue.length > 0 && activeFilter !== 'completed') {
      groups.push({ title: 'Overdue', data: overdue });
    }
    
    if (high.length > 0) {
      groups.push({ title: 'High Priority', data: high });
    }
    
    if (medium.length > 0) {
      groups.push({ title: 'Medium Priority', data: medium });
    }
    
    if (low.length > 0) {
      groups.push({ title: 'Low Priority', data: low });
    }
    
    return groups;
  }, [filteredTodos, activeFilter]);

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

  const handleAddTodo = () => {
    router.push('/add-todo');
  };

  const handleToggleTodo = async (todo: typeof todos[0]) => {
    try {
      await toggleTodo(todo.id);
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleEditTodo = (todo: typeof todos[0]) => {
    router.push(`/add-todo?id=${todo.id}`);
  };

  const handleDeleteTodo = async (todo: typeof todos[0]) => {
    try {
      await deleteTodo(todo.id);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleTodoPress = (todo: typeof todos[0]) => {
    console.log('View todo:', todo.id);
  };

  const renderSectionHeader = ({ title }: { title: string }) => (
    <View className="bg-background px-4 py-3 border-b border-border/30">
      <Text className="text-sm font-semibold text-muted-foreground">
        {title}
      </Text>
    </View>
  );

  const renderTodo = ({ item }: { item: typeof todos[0] }) => (
    <TodoItem
      todo={item}
      onToggle={() => handleToggleTodo(item)}
      onPress={() => handleTodoPress(item)}
      onEdit={() => handleEditTodo(item)}
      onDelete={() => handleDeleteTodo(item)}
    />
  );

  const renderFlatListData = () => {
    const data: (typeof todos[0] | { type: 'header'; title: string })[] = [];
    
    groupedTodos.forEach(({ title, data: todos }) => {
      if (todos.length > 0) {
        data.push({ type: 'header', title });
        data.push(...todos);
      }
    });
    
    return data;
  };

  const renderItem = ({ item }: { item: typeof todos[0] | { type: 'header'; title: string } }) => {
    if ('type' in item && item.type === 'header') {
      return renderSectionHeader({ title: item.title });
    }
    return renderTodo({ item: item as typeof todos[0] });
  };

  // Show loading state
  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Tugas" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Memuat tugas...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Tugas" />
        <TodoFilter
          activeFilter={activeFilter}
          counts={filterCounts}
          onFilterChange={setActiveFilter}
        />
        <EmptyState
          title="Error memuat tugas"
          description={error || 'Terjadi kesalahan saat memuat tugas'}
          actionLabel="Coba Lagi"
          onAction={() => refetch()}
        />
        <View className="absolute bottom-6 right-4">
          <FAB
            onPress={handleAddTodo}
            accessibilityLabel="Tambah tugas baru"
          />
        </View>
      </View>
    );
  }

  if (filteredTodos.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Tugas" />
        <TodoFilter
          activeFilter={activeFilter}
          counts={filterCounts}
          onFilterChange={setActiveFilter}
        />
        <EmptyState
          title={activeFilter === 'all' ? 'Belum ada tugas' : `Tidak ada tugas ${activeFilter}`}
          description={
            activeFilter === 'all'
              ? 'Buat tugas pertama Anda untuk memulai'
              : `Anda tidak memiliki tugas ${activeFilter}`
          }
          actionLabel="Tambah Tugas"
          onAction={handleAddTodo}
        />
        <View className="absolute bottom-6 right-4">
          <FAB
            onPress={handleAddTodo}
            accessibilityLabel="Tambah tugas baru"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header title="Tugas" />
      
      <TodoFilter
        activeFilter={activeFilter}
        counts={filterCounts}
        onFilterChange={setActiveFilter}
      />

      <FlatList
        data={renderFlatListData()}
        renderItem={renderItem}
        keyExtractor={(item) => 
          'type' in item ? `header-${item.title}` : item.id
        }
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading} 
            onRefresh={onRefresh} 
          />
        }
        showsVerticalScrollIndicator={false}
        getItemLayout={undefined} // Required for SectionList-like behavior
      />

      <View className="absolute bottom-6 right-4">
        <FAB
          onPress={handleAddTodo}
          accessibilityLabel="Tambah tugas baru"
        />
      </View>
    </View>
  );
}

export default withAuth(TodosScreen);