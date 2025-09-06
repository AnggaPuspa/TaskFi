import React, { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { Text } from '~/components/ui/text';
import { Header, FAB, EmptyState } from '~/src/shared/ui';
import { TodoItem, TodoFilter } from '~/src/shared/components';

import { 
  mockTodos, 
  getTodaysTodos, 
  getOverdueTodos, 
  getCompletedTodos, 
  getPendingTodos 
} from '~/src/mocks';
import { Todo, TodoFilter as TodoFilterType } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TodoFilterType>('all');

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      all: mockTodos.filter(t => !t.done).length,
      today: getTodaysTodos().length,
      week: mockTodos.filter(t => {
        if (!t.due || t.done) return false;
        const dueDate = new Date(t.due);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      }).length,
      completed: getCompletedTodos().length,
    };
  }, []);

  // Filter todos based on active filter
  const filteredTodos = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    switch (activeFilter) {
      case 'today':
        return getTodaysTodos();
      case 'week':
        return mockTodos.filter(t => {
          if (!t.due || t.done) return false;
          const dueDate = new Date(t.due);
          return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
      case 'completed':
        return getCompletedTodos();
      default:
        return getPendingTodos();
    }
  }, [activeFilter]);

  // Group todos by priority and due date
  const groupedTodos = useMemo(() => {
    const overdue = getOverdueTodos();
    const high = filteredTodos.filter(t => t.priority === 'high' && !overdue.includes(t));
    const medium = filteredTodos.filter(t => t.priority === 'medium' && !overdue.includes(t));
    const low = filteredTodos.filter(t => t.priority === 'low' && !overdue.includes(t));
    
    const groups: { title: string; data: Todo[] }[] = [];
    
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleAddTodo = () => {
    router.push('/add-todo');
  };

  const handleToggleTodo = (todo: Todo) => {
    // In a real app, this would update the todo's done status
    console.log('Toggle todo:', todo.id, !todo.done);
  };

  const handleEditTodo = (todo: Todo) => {
    router.push(`/add-todo?id=${todo.id}`);
  };

  const handleDeleteTodo = (todo: Todo) => {
    // In a real app, this would call an API or update state
    console.log('Delete todo:', todo.id);
  };

  const handleTodoPress = (todo: Todo) => {
    // Navigate to todo details or show modal
    console.log('View todo:', todo.id);
  };

  const renderSectionHeader = ({ title }: { title: string }) => (
    <View className="bg-background px-4 py-3 border-b border-border/30">
      <Text className="text-sm font-semibold text-muted-foreground">
        {title}
      </Text>
    </View>
  );

  const renderTodo = ({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onToggle={() => handleToggleTodo(item)}
      onPress={() => handleTodoPress(item)}
      onEdit={() => handleEditTodo(item)}
      onDelete={() => handleDeleteTodo(item)}
    />
  );

  const renderFlatListData = () => {
    const data: (Todo | { type: 'header'; title: string })[] = [];
    
    groupedTodos.forEach(({ title, data: todos }) => {
      if (todos.length > 0) {
        data.push({ type: 'header', title });
        data.push(...todos);
      }
    });
    
    return data;
  };

  const renderItem = ({ item }: { item: Todo | { type: 'header'; title: string } }) => {
    if ('type' in item && item.type === 'header') {
      return renderSectionHeader({ title: item.title });
    }
    return renderTodo({ item: item as Todo });
  };

  if (filteredTodos.length === 0 && activeFilter !== 'all') {
    const emptyMessages = {
      today: {
        title: 'No tasks for today',
        description: 'Great! You have no tasks due today. Take a moment to plan ahead or enjoy your free time.',
      },
      week: {
        title: 'No tasks this week',
        description: 'You re all caught up for this week. Consider adding some goals for the upcoming days.',
      },
      completed: {
        title: 'No completed tasks',
        description: 'Complete some tasks to see them here. Every small step counts!',
      },
    };

    const message = emptyMessages[activeFilter as keyof typeof emptyMessages] || {
      title: 'No tasks found',
      description: 'Create your first task to get started.',
    };

    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Tasks" />
        <TodoFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
        <EmptyState
          title={message.title}
          description={message.description}
          actionLabel="Add Task"
          onAction={handleAddTodo}
        />
      </View>
    );
  }

  if (mockTodos.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor }}>
        <Header title="Tasks" />
        <EmptyState
          title="Welcome to your task manager"
          description="Stay organized by creating your first task. Set priorities, due dates, and track your progress."
          actionLabel="Create First Task"
          onAction={handleAddTodo}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Header title="Tasks" />
      
      <TodoFilter
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />
      
      <FlatList
        data={renderFlatListData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          if ('type' in item && item.type === 'header') {
            return `header-${item.title}`;
          }
          return (item as Todo).id;
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
      />

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-4">
        <FAB
          onPress={handleAddTodo}
          icon={Plus}
          accessibilityLabel="Add new task"
        />
      </View>
    </View>
  );
}