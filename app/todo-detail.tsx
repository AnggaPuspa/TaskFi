import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Flag,
  Zap,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Circle,
  Target
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useTodos } from '~/src/hooks';
import { useAuth } from '~/features/auth/AuthProvider';

export default function TodoDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  
  const { 
    rows: todos, 
    toggle: toggleTodo, 
    remove: deleteTodo 
  } = useTodos({ enabled: !!session?.user?.id, userId: session?.user?.id });
  
  const todo = useMemo(() => 
    todos.find(t => t.id === id), [todos, id]
  );

  if (!todo) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <View className="items-center px-6">
          <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl items-center justify-center mb-4">
            <FileText size={24} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tugas Tidak Ditemukan
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Tugas yang Anda cari mungkin telah dihapus atau tidak tersedia
          </Text>
          <Button
            onPress={() => router.back()}
            className="bg-blue-600 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Kembali</Text>
          </Button>
        </View>
      </View>
    );
  }

  const isCompleted = todo.done;
  const isOverdue = todo.due && !todo.done && new Date(todo.due) < new Date();
  const isDueToday = todo.due && !todo.done && 
    new Date(todo.due).toDateString() === new Date().toDateString();
  
  const handleEdit = () => {
    router.push(`/add-todo?id=${todo.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Tugas',
      'Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTodo(todo.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus tugas');
            }
          }
        }
      ]
    );
  };

  const handleToggle = async () => {
    try {
      await toggleTodo(todo.id);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengubah status tugas');
    }
  };

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

  const getPriorityLabel = () => {
    switch (todo.priority) {
      case 'high': return 'Prioritas Tinggi';
      case 'medium': return 'Prioritas Sedang';
      case 'low': return 'Prioritas Rendah';
      default: return 'Tidak Ada Prioritas';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const PriorityIcon = getPriorityIcon();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-gray-800 px-6 pb-4 border-b border-gray-100 dark:border-gray-700"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Detail Tugas
          </Text>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleEdit}
              className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center"
            >
              <Edit3 size={18} color="#3B82F6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center"
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Status Hero Section */}
        <View className="px-6 py-8">
          <LinearGradient
            colors={isCompleted ? ['#10B981', '#059669'] : isOverdue ? ['#EF4444', '#DC2626'] : ['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8"
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
                {isCompleted ? (
                  <CheckCircle2 size={36} color="white" />
                ) : (
                  <Target size={36} color="white" />
                )}
              </View>
              
              <Text className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">
                {isCompleted ? 'Tugas Selesai' : isOverdue ? 'Tugas Terlambat' : 'Tugas Aktif'}
              </Text>
              
              <Text className="text-white text-2xl font-bold mb-3 text-center">
                {todo.title}
              </Text>
              
              {!isCompleted && (
                <TouchableOpacity
                  onPress={handleToggle}
                  className="bg-white/20 px-6 py-3 rounded-full flex-row items-center"
                >
                  <CheckCircle2 size={20} color="white" />
                  <Text className="text-white font-medium ml-2">
                    Tandai Selesai
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Task Details */}
        <View className="px-6">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informasi Tugas
            </Text>
            
            {/* Priority */}
            <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-700">
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: getPriorityColor() + '20' }}
              >
                <PriorityIcon size={20} color={getPriorityColor()} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Prioritas
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {getPriorityLabel()}
                </Text>
              </View>
            </View>

            {/* Due Date */}
            {todo.due && (
              <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-700">
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                  isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <Calendar size={20} color={isOverdue ? '#EF4444' : '#10B981'} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Tanggal Deadline
                  </Text>
                  <Text className={`text-base font-medium ${
                    isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(todo.due)}
                    {isOverdue && ' (Terlambat)'}
                    {isDueToday && ' (Hari Ini)'}
                  </Text>
                </View>
              </View>
            )}

            {/* Created Date */}
            <View className="flex-row items-center py-4">
              <View className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl items-center justify-center mr-4">
                <Clock size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Dibuat Pada
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {formatCreatedDate(todo.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        {todo.description && (
          <View className="px-6 mt-6">
            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl items-center justify-center mr-4">
                  <FileText size={20} color="#6B7280" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Deskripsi
                </Text>
              </View>
              <Text className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {todo.description}
              </Text>
            </View>
          </View>
        )}

        {/* Tags Section */}
        {todo.tags && todo.tags.length > 0 && (
          <View className="px-6 mt-6">
            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tag
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {todo.tags.map((tag, index) => (
                  <View 
                    key={index}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                  >
                    <Text className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-6 mt-8">
          <View className="flex-row gap-4">
            {!isCompleted && (
              <Button
                onPress={handleToggle}
                className="flex-1 bg-green-600 h-14 rounded-2xl flex-row items-center justify-center"
              >
                <CheckCircle2 size={20} color="white" />
                <Text className="text-white font-medium ml-2">Tandai Selesai</Text>
              </Button>
            )}
            
            <Button
              onPress={handleEdit}
              className={`${isCompleted ? 'flex-1' : 'flex-1'} bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center`}
            >
              <Edit3 size={20} color="white" />
              <Text className="text-white font-medium ml-2">Edit Tugas</Text>
            </Button>
            
            <TouchableOpacity
              onPress={handleDelete}
              className="h-14 px-6 bg-red-50 dark:bg-red-900/20 rounded-2xl items-center justify-center border border-red-200 dark:border-red-800"
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
