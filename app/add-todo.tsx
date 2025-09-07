import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Plus, X, Flag, AlertCircle, Zap } from 'lucide-react-native';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { 
  Header, 
  FormField, 
  CustomDateTimePicker,
  LoadingOverlay 
} from '~/src/shared/ui';
import { PriorityBadge } from '~/src/shared/components';
import { useTodos } from '~/src/hooks';

import { Priority, TodoFormData, Todo } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';
import { useAuth } from '~/features/auth/AuthProvider';

export default function AddTodoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');
  const destructiveColor = useThemeColor({}, 'destructive');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted-foreground');
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
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority: 'medium',
    due: undefined,
    tags: [],
  });

  const [errors, setErrors] = useState<Partial<TodoFormData>>({});
  const [newTag, setNewTag] = useState('');

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
      }
    }
  }, [isEditing, todoId, todos]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TodoFormData> = {};

    if (!formData.title.trim()) newErrors.title = 'Judul tugas tidak boleh kosong' as any;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Form Tidak Valid', 'Mohon lengkapi semua field yang diperlukan.');
      return;
    }

    // Prevent double submission
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

      console.log('💾 Saving todo:', { isEditing, todoData });

      if (isEditing) {
        await updateTodo(todoId, todoData);
        Alert.alert('Berhasil!', 'Tugas berhasil diperbarui.');
      } else {
        await addTodo(todoData);
        Alert.alert('Berhasil!', 'Tugas berhasil disimpan.');
      }

      // Navigate back after successful save
      // Use replace to ensure the todos screen refreshes
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(app)/(tabs)/todos');
      }
    } catch (error: any) {
      console.error('❌ Error saving todo:', error);
      Alert.alert('Error', `Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} tugas: ${error.message || 'Silakan coba lagi.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Hapus Tugas',
      'Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            // Prevent double deletion
            if (loading) return;
            
            setLoading(true);
            try {
              console.log('🗑️ Deleting todo:', todoId);
              await deleteTodo(todoId);
              Alert.alert('Berhasil!', 'Tugas berhasil dihapus.');
              router.back();
            } catch (error: any) {
              console.error('❌ Error deleting todo:', error);
              Alert.alert('Error', `Gagal menghapus tugas: ${error.message || 'Silakan coba lagi.'}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePriorityChange = (priority: Priority) => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const priorityOptions: { priority: Priority; icon: any; color: string; label: string }[] = [
    { priority: 'low', icon: Flag, color: '#6B7280', label: 'Rendah' },
    { priority: 'medium', icon: AlertCircle, color: '#F59E0B', label: 'Sedang' },
    { priority: 'high', icon: Zap, color: '#EF4444', label: 'Tinggi' },
  ];

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      style={{ backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title={isEditing ? 'Edit Tugas' : 'Tambah Tugas'}
        showBackButton
        onBackPress={() => router.back()}
        rightActions={
          isEditing ? (
            <Button
              variant="ghost"
              onPress={handleDelete}
              className="p-2"
              accessibilityLabel="Delete task"
            >
              <Trash2 size={20} color={destructiveColor} />
            </Button>
          ) : undefined
        }
      />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4 gap-6">
          {/* Title */}
          <FormField 
            label="Judul Tugas" 
            required
            error={errors.title}
          >
            <Input
              value={formData.title}
              onChangeText={(title) => {
                setFormData(prev => ({ ...prev, title }));
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Masukkan judul tugas"
              returnKeyType="next"
            />
          </FormField>

          {/* Description */}
          <FormField label="Deskripsi">
            <Textarea
              value={formData.description}
              onChangeText={(description) => setFormData(prev => ({ ...prev, description }))}
              placeholder="Tambahkan detail lebih lanjut tentang tugas ini..."
              numberOfLines={3}
              className="min-h-20"
            />
          </FormField>

          {/* Priority */}
          <FormField label="Prioritas">
            <View className="flex-row gap-3">
              {priorityOptions.map(({ priority, icon: Icon, color, label }) => {
                const isSelected = formData.priority === priority;
                return (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => handlePriorityChange(priority)}
                    className={`flex-1 p-3 rounded-lg border ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                    style={{
                      borderColor: isSelected ? color : borderColor,
                    }}
                  >
                    <View className="items-center">
                      <Icon size={20} color={color} />
                      <Text className="text-sm mt-1" style={{ color: isSelected ? color : mutedColor }}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          {/* Due Date */}
          <FormField label="Tanggal Deadline">
            <CustomDateTimePicker
              value={formData.due || new Date()}
              onChange={(date) => setFormData(prev => ({ ...prev, due: date || undefined }))}
              placeholder="Pilih tanggal deadline"
              mode="datetime"
              minimumDate={new Date()}
            />
          </FormField>

          {/* Tags */}
          <FormField label="Tag">
            <View className="gap-3">
              {/* Add new tag */}
              <View className="flex-row gap-2">
                <Input
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Tambahkan tag"
                  className="flex-1"
                  returnKeyType="done"
                  onSubmitEditing={handleAddTag}
                />
                <Button
                  onPress={handleAddTag}
                  variant="outline"
                  className="h-12 px-3"
                  disabled={!newTag.trim()}
                >
                  <Plus size={16} />
                </Button>
              </View>

              {/* Display existing tags */}
              {formData.tags && formData.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <View
                      key={index}
                      className="flex-row items-center bg-secondary rounded-full px-3 py-1"
                    >
                      <Text className="text-sm mr-1">#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveTag(tag)}
                        className="p-1"
                      >
                        <X size={12} color={mutedColor} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </FormField>
        </View>
      </ScrollView>

      {/* Footer with Save Button */}
      <View 
        className="p-4 border-t border-border bg-card"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          onPress={handleSave}
          disabled={loading || isLoading || !formData.title.trim()}
          className="h-12"
        >
          <View className="flex-row items-center">
            <Save size={20} color="white" />
            <Text className="text-white font-medium ml-2">
              {loading 
                ? 'Menyimpan...' 
                : isEditing 
                  ? 'Perbarui Tugas' 
                  : 'Simpan Tugas'
              }
            </Text>
          </View>
        </Button>
      </View>

      {loading && <LoadingOverlay visible={loading} />}
    </KeyboardAvoidingView>
  );
}