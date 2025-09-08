import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Flag,
  Zap,
  AlertTriangle,
  ChevronRight,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useTodos } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';
import { useThemeColor } from '~/hooks/useThemeColor';
import { withAuth } from '~/features/auth/guard';
import { TodoFilter as TodoFilterType } from '~/src/types';

const { width } = Dimensions.get('window');

interface ModernTodoCardProps {
  todo: any;
  onPress: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ModernTodoCard: React.FC<ModernTodoCardProps> = ({ 
  todo, 
  onPress, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  const isCompleted = todo.done;
  const isOverdue = todo.due && !todo.done && new Date(todo.due) < new Date();
  const isDueToday = todo.due && !todo.done && 
    new Date(todo.due).toDateString() === new Date().toDateString();

  const getPriorityColor = () => {
    switch (todo.priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = () => {
    switch (todo.priority) {
      case 'high': return AlertTriangle;
      case 'medium': return Zap;
      case 'low': return Flag;
      default: return Flag;
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari Ini';
    }
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short'
    });
  };

  const PriorityIcon = getPriorityIcon();

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="mx-6 mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      activeOpacity={0.8}
      style={{ opacity: isCompleted ? 0.7 : 1 }}
    >
      <View className="p-5">
        <View className="flex-row items-start">
          {/* Checkbox */}
          <TouchableOpacity
            onPress={onToggle}
            className="mr-4 mt-1"
          >
            {isCompleted ? (
              <CheckCircle2 size={24} color="#10B981" />
            ) : (
              <Circle size={24} color="#6B7280" />
            )}
          </TouchableOpacity>

          {/* Content */}
          <View className="flex-1">
            {/* Title and Priority */}
            <View className="flex-row items-center justify-between mb-2">
              <Text 
                className={`text-lg font-semibold flex-1 mr-2 ${
                  isCompleted ? 'line-through' : ''
                }`}
                style={{ 
                  color: isCompleted ? '#9CA3AF' : undefined 
                }}
                numberOfLines={2}
              >
                {todo.title}
              </Text>
              
              <View className="flex-row items-center">
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: getPriorityColor() + '20' }}
                >
                  <PriorityIcon size={16} color={getPriorityColor()} />
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>

            {/* Description */}
            {todo.description && (
              <Text 
                className="text-sm text-gray-600 dark:text-gray-400 mb-3"
                numberOfLines={2}
              >
                {todo.description}
              </Text>
            )}

            {/* Meta Info */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {todo.due && (
                  <View className="flex-row items-center mr-4">
                    <Calendar size={14} color={isOverdue ? '#EF4444' : '#6B7280'} />
                    <Text 
                      className="text-xs ml-1"
                      style={{ 
                        color: isOverdue ? '#EF4444' : '#6B7280' 
                      }}
                    >
                      {formatDueDate(todo.due)}
                      {isOverdue && ' (Terlambat)'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={onEdit}
                  className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center"
                >
                  <Edit3 size={14} color="#3B82F6" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={onDelete}
                  className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center"
                >
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Priority accent */}
      <View 
        className="h-1"
        style={{ backgroundColor: getPriorityColor() + '30' }}
      />
    </TouchableOpacity>
  );
};

function TodosScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const [activeFilter, setActiveFilter] = useState<TodoFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const { session } = useAuth();
  const { 
    rows: todos, 
    loading, 
    error, 
    refetch, 
    toggle: toggleTodo, 
    remove: deleteTodo 
  } = useTodos({ enabled: !!session?.user?.id, userId: session?.user?.id });

  // Refresh data ketika screen difokuskan
  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        refetch();
      }
    }, [session?.user?.id, refetch])
  );
  
  const [refreshing, setRefreshing] = useState(false);

  // Calculate statistics
  const todoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    const pending = total - completed;
    const overdue = todos.filter(t => 
      t.due && !t.done && new Date(t.due) < new Date()
    ).length;
    const dueToday = todos.filter(t => 
      t.due && !t.done && new Date(t.due).toDateString() === new Date().toDateString()
    ).length;

    return { total, completed, pending, overdue, dueToday };
  }, [todos]);

  // Filter and search todos
  const filteredTodos = useMemo(() => {
    let filtered = todos;

    // Apply filter
    switch (activeFilter) {
      case 'today':
        filtered = todos.filter(t => {
          if (!t.due || t.done) return false;
          return new Date(t.due).toDateString() === new Date().toDateString();
        });
        break;
      case 'week':
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        filtered = todos.filter(t => {
          if (!t.due || t.done) return false;
          const dueDate = new Date(t.due);
          return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
        break;
      case 'completed':
        filtered = todos.filter(t => t.done);
        break;
      default:
        filtered = todos.filter(t => !t.done);
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [todos, activeFilter, searchQuery]);

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

  const handleToggleTodo = async (todo: any) => {
    try {
      await toggleTodo(todo.id);
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleEditTodo = (todo: any) => {
    router.push(`/add-todo?id=${todo.id}`);
  };

  const handleDeleteTodo = async (todo: any) => {
    try {
      await deleteTodo(todo.id);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleTodoPress = (todo: any) => {
    router.push(`/todo-detail?id=${todo.id}` as any);
  };

  const renderHeader = () => (
    <View className="px-6 pb-6">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between pt-4 pb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Tugas Saya
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {todoStats.pending} tugas tersisa
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
            placeholder="Cari tugas..."
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </View>
      )}

      {/* Stats Cards */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total
          </Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {todoStats.total}
          </Text>
        </View>
        
        <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Selesai
          </Text>
          <Text className="text-2xl font-bold text-green-600">
            {todoStats.completed}
          </Text>
        </View>
        
        <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Tertunda
          </Text>
          <Text className="text-2xl font-bold text-red-600">
            {todoStats.overdue}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          onPress={handleAddTodo}
          className="flex-1 bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Tambah Tugas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 items-center justify-center"
        >
          <Eye size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-6">
        {[
          { key: 'all', label: 'Semua', count: todoStats.pending },
          { key: 'today', label: 'Hari Ini', count: todoStats.dueToday },
          { key: 'week', label: 'Minggu Ini', count: 0 },
          { key: 'completed', label: 'Selesai', count: todoStats.completed }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key as TodoFilterType)}
            className={`px-4 py-2 rounded-full border ${
              activeFilter === filter.key
                ? 'bg-blue-600 border-blue-600'
                : 'bg-transparent border-gray-300 dark:border-gray-600'
            }`}
          >
            <Text className={`text-sm font-medium ${
              activeFilter === filter.key
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              {filter.label} {filter.count > 0 && `(${filter.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {activeFilter === 'completed' ? 'Tugas Selesai' : 'Daftar Tugas'}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTodos.length} tugas
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
        <CheckCircle2 size={32} color="#6B7280" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {searchQuery 
          ? 'Tidak Ada Tugas Ditemukan' 
          : activeFilter === 'completed'
            ? 'Belum Ada Tugas Selesai'
            : 'Belum Ada Tugas'
        }
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
        {searchQuery
          ? 'Coba ubah kata kunci pencarian Anda'
          : activeFilter === 'completed'
            ? 'Selesaikan beberapa tugas untuk melihatnya di sini'
            : 'Mulai produktivitas Anda dengan menambah tugas pertama'
        }
      </Text>
      <Button
        onPress={() => {
          if (searchQuery) {
            setSearchQuery('');
          } else {
            handleAddTodo();
          }
        }}
        className="bg-blue-600 px-6 py-3 rounded-2xl"
      >
        <Text className="text-white font-semibold">
          {searchQuery ? 'Hapus Pencarian' : 'Tambah Tugas Pertama'}
        </Text>
      </Button>
    </View>
  );

  const renderTodoItem = ({ item }: { item: any }) => (
    <ModernTodoCard
      todo={item}
      onPress={() => handleTodoPress(item)}
      onToggle={() => handleToggleTodo(item)}
      onEdit={() => handleEditTodo(item)}
      onDelete={() => handleDeleteTodo(item)}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Memuat tugas...</Text>
      </View>
    );
  }

  if (filteredTodos.length === 0) {
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
        data={filteredTodos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id}
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

export default withAuth(TodosScreen);