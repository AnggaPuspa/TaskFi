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

import { getTodoById } from '~/src/mocks';
import { Priority, TodoFormData } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function AddTodoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');
  const destructiveColor = useThemeColor({}, 'destructive');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted-foreground');

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
      const todo = getTodoById(todoId);
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
  }, [isEditing, todoId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TodoFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would save to API/database
      console.log('Save todo:', {
        ...formData,
        due: formData.due?.toISOString(),
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // In a real app, this would delete from API/database
              console.log('Delete todo:', todoId);
              
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task. Please try again.');
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
    { priority: 'low', icon: Flag, color: '#6B7280', label: 'Low' },
    { priority: 'medium', icon: AlertCircle, color: '#F59E0B', label: 'Medium' },
    { priority: 'high', icon: Zap, color: '#EF4444', label: 'High' },
  ];

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      style={{ backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title={isEditing ? 'Edit Task' : 'Add Task'}
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
            label="Title" 
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
              placeholder="e.g., Buy groceries, Call insurance agent"
              error={!!errors.title}
            />
          </FormField>

          {/* Description */}
          <FormField 
            label="Description" 
            description="Add any additional details (optional)"
          >
            <Textarea
              value={formData.description || ''}
              onChangeText={(description) => setFormData(prev => ({ ...prev, description }))}
              placeholder="Add more details about this task..."
              numberOfLines={3}
            />
          </FormField>

          {/* Priority */}
          <FormField label="Priority" required>
            <View className="flex-row gap-3">
              {priorityOptions.map(({ priority, icon: Icon, color, label }) => {
                const isSelected = formData.priority === priority;
                return (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => handlePriorityChange(priority)}
                    className="flex-1 p-3 rounded-lg border items-center"
                    style={{
                      borderColor: isSelected ? color : borderColor,
                      backgroundColor: isSelected ? color + '20' : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Set priority to ${label}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Icon size={20} color={isSelected ? color : mutedColor} />
                    <Text 
                      className="text-xs font-medium mt-1"
                      style={{ color: isSelected ? color : mutedColor }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="mt-2">
              <PriorityBadge priority={formData.priority} size="medium" />
            </View>
          </FormField>

          {/* Due Date */}
          <FormField 
            label="Due Date" 
            description="When should this task be completed? (optional)"
          >
            <View className="flex-row gap-3">
              <View className="flex-1">
                <CustomDateTimePicker
                  value={formData.due || new Date()}
                  onChange={(date) => setFormData(prev => ({ ...prev, due: date }))}
                  mode="date"
                  minimumDate={new Date()}
                  placeholder="Select due date"
                />
              </View>
              {formData.due && (
                <Button
                  variant="outline"
                  onPress={() => setFormData(prev => ({ ...prev, due: undefined }))}
                  className="px-3"
                  accessibilityLabel="Clear due date"
                >
                  <X size={16} color={mutedColor} />
                </Button>
              )}
            </View>
          </FormField>

          {/* Tags */}
          <FormField 
            label="Tags" 
            description="Add tags to organize your tasks (optional)"
          >
            {/* Existing Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRemoveTag(tag)}
                    className="flex-row items-center px-3 py-1 rounded-full bg-primary/20"
                    accessibilityRole="button"
                    accessibilityLabel={`Remove tag ${tag}`}
                  >
                    <Text className="text-sm text-primary mr-1">#{tag}</Text>
                    <X size={12} color={useThemeColor({}, 'primary')} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add New Tag */}
            <View className="flex-row gap-2">
              <Input
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a tag"
                className="flex-1"
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <Button
                onPress={handleAddTag}
                disabled={!newTag.trim()}
                className="px-4"
                accessibilityLabel="Add tag"
              >
                <Plus size={16} color="white" />
              </Button>
            </View>

            {/* Common Tags */}
            <View className="mt-3">
              <Text className="text-sm text-muted-foreground mb-2">Suggested tags:</Text>
              <View className="flex-row flex-wrap gap-2">
                {['work', 'personal', 'urgent', 'finance', 'health', 'shopping'].map((suggestedTag) => (
                  <TouchableOpacity
                    key={suggestedTag}
                    onPress={() => {
                      if (!formData.tags?.includes(suggestedTag)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), suggestedTag],
                        }));
                      }
                    }}
                    className="px-3 py-1 rounded-full border border-border"
                    disabled={formData.tags?.includes(suggestedTag)}
                    style={{
                      opacity: formData.tags?.includes(suggestedTag) ? 0.5 : 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${suggestedTag} tag`}
                  >
                    <Text className="text-xs text-muted-foreground">#{suggestedTag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FormField>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="p-4 border-t border-border bg-background">
        <Button
          onPress={handleSave}
          disabled={loading}
          className="h-12"
        >
          <View className="flex-row items-center">
            <Save size={20} color="white" />
            <Text className="ml-2 text-white font-semibold">
              {loading ? 'Saving...' : isEditing ? 'Update Task' : 'Save Task'}
            </Text>
          </View>
        </Button>
      </View>

      <LoadingOverlay visible={loading} message={loading ? 'Saving task...' : ''} />
    </KeyboardAvoidingView>
  );
}