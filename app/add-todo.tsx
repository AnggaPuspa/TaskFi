import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  Flag, 
  AlertTriangle, 
  Zap,
  Calendar
} from 'lucide-react-native';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useTodos } from '~/src/hooks';
import { Priority, TodoFormData } from '~/src/types';
import { useAuth } from '~/features/auth/AuthProvider';

export default function AddTodoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const { 
    rows: todos, 
    loading: isLoading, 
    add: addTodo, 
    update: updateTodo, 
    remove: deleteTodo 
  } = useTodos({ enabled: !!session?.user?.id, userId: session?.user?.id });

  const todoId = params.id as string;
  const isEditing = !!todoId;

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority: 'medium',
    due: undefined,
    tags: [],
  });

  // Load todo data for editing
  useEffect(() => {
    if (isEditing && todoId) {
      const todo = todos.find((t: any) => t.id === todoId);
      if (todo) {
        setFormData({
          title: todo.title,
          description: todo.description || '',
          priority: todo.priority,
          due: todo.due ? new Date(todo.due) : undefined,
          tags: todo.tags || [],
        });
        // Show advanced if editing and has optional fields
        if (todo.due || todo.description || (todo.tags && todo.tags.length > 0)) {
          setShowAdvanced(true);
        }
      }
    }
  }, [isEditing, todoId, todos]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Judul tugas tidak boleh kosong');
      return;
    }

    if (loading) return;

    setLoading(true);
    
    try {
      const todoData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        priority: formData.priority,
        due: formData.due?.toISOString() || null,
        tags: formData.tags || [],
        done: false,
      };

      if (isEditing) {
        await updateTodo(todoId, todoData);
        Alert.alert('Berhasil!', 'Tugas berhasil diperbarui.');
      } else {
        await addTodo(todoData);
        Alert.alert('Berhasil!', 'Tugas berhasil disimpan.');
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', `Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} tugas`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Hapus Tugas',
      'Apakah Anda yakin ingin menghapus tugas ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            if (loading) return;
            
            setLoading(true);
            try {
              await deleteTodo(todoId);
              Alert.alert('Berhasil!', 'Tugas berhasil dihapus.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', 'Gagal menghapus tugas');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari Ini';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Besok';
    } else {
      return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
    }
  };

  const priorityOptions = [
    { priority: 'low' as Priority, label: 'Rendah', icon: Flag, color: '#10B981' },
    { priority: 'medium' as Priority, label: 'Sedang', icon: Zap, color: '#F59E0B' },
    { priority: 'high' as Priority, label: 'Tinggi', icon: AlertTriangle, color: '#EF4444' },
  ];

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
            {isEditing ? 'Edit Tugas' : 'Tambah Tugas'}
          </Text>
          
          {isEditing && (
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center"
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
          
          {!isEditing && <View className="w-10" />}
        </View>
      </View>

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="p-6 gap-6">
            {/* Main Input */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Apa yang ingin Anda kerjakan?
              </Text>
              
              <Input
                value={formData.title}
                onChangeText={(title) => setFormData(prev => ({ ...prev, title }))}
                placeholder="Misalnya: Belajar React Native"
                className="text-lg border-0 bg-gray-50 dark:bg-gray-700 rounded-xl"
                multiline
                style={{ minHeight: 60 }}
              />
            </View>

            {/* Priority Selection */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Seberapa penting?
              </Text>
              
              <View className="flex-row gap-3">
                {priorityOptions.map(({ priority, label, icon: Icon, color }) => {
                  const isSelected = formData.priority === priority;
                  return (
                    <TouchableOpacity
                      key={priority}
                      onPress={() => setFormData(prev => ({ ...prev, priority }))}
                      className={`flex-1 p-4 rounded-xl border-2 ${
                        isSelected ? 'border-opacity-100' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      style={{
                        borderColor: isSelected ? color : undefined,
                        backgroundColor: isSelected ? color + '10' : undefined,
                      }}
                    >
                      <View className="items-center">
                        <Icon size={24} color={color} />
                        <Text 
                          className={`text-sm mt-2 font-medium ${
                            isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Optional Fields Toggle */}
            <TouchableOpacity
              onPress={() => setShowAdvanced(!showAdvanced)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  Pengaturan Tambahan
                </Text>
                <Text className="text-sm text-blue-600">
                  {showAdvanced ? 'Sembunyikan' : 'Tampilkan'}
                </Text>
              </View>
              
              {formData.due && (
                <View className="flex-row items-center mt-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    Deadline: {formatDate(formData.due)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Advanced Fields */}
            {showAdvanced && (
              <View className="gap-4">
                {/* Due Date */}
                <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Kapan deadline?
                  </Text>
                  
                  <View className="flex-row gap-3">
                    {[
                      { label: 'Hari Ini', date: new Date() },
                      { label: 'Besok', date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })() },
                      { label: 'Minggu Depan', date: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })() },
                    ].map(({ label, date }) => (
                      <TouchableOpacity
                        key={label}
                        onPress={() => setFormData(prev => ({ ...prev, due: date }))}
                        className={`flex-1 p-3 rounded-xl border ${
                          formData.due?.toDateString() === date.toDateString()
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <Text className={`text-sm text-center font-medium ${
                          formData.due?.toDateString() === date.toDateString()
                            ? 'text-blue-600'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {formData.due && (
                    <TouchableOpacity
                      onPress={() => setFormData(prev => ({ ...prev, due: undefined }))}
                      className="mt-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                    >
                      <Text className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Hapus Deadline
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Description */}
                <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Catatan tambahan
                  </Text>
                  
                  <Textarea
                    value={formData.description}
                    onChangeText={(description) => setFormData(prev => ({ ...prev, description }))}
                    placeholder="Tambahkan detail, catatan, atau hal-hal yang perlu diingat..."
                    numberOfLines={3}
                    className="border-0 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View 
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-100 dark:border-gray-700"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Button
            onPress={handleSave}
            disabled={loading || !formData.title.trim()}
            className="h-14 bg-blue-600 rounded-2xl flex-row items-center justify-center"
          >
            <Save size={20} color="white" />
            <Text className="text-white font-semibold ml-2 text-base">
              {loading 
                ? 'Menyimpan...' 
                : isEditing 
                  ? 'Perbarui Tugas' 
                  : 'Simpan Tugas'
              }
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
