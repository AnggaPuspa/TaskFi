import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUpCircle, ArrowDownCircle, Save, Trash2 } from 'lucide-react-native';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { 
  Header, 
  FormField, 
  AmountInput, 
  SelectSheet, 
  CustomDateTimePicker,
  LoadingOverlay 
} from '~/src/shared/ui';

import { mockCategories, getCategoriesByType, getTransactionById } from '~/src/mocks';
import { TransactionType, TransactionFormData } from '~/src/types';
import { useThemeColor } from '~/hooks/useThemeColor';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');
  const successColor = useThemeColor({}, 'success');
  const destructiveColor = useThemeColor({}, 'destructive');

  const transactionId = params.id as string;
  const isEditing = !!transactionId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    category: '',
    title: '',
    note: '',
    amount: '',
    date: new Date(),
  });

  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  // Load transaction data for editing
  useEffect(() => {
    if (isEditing && transactionId) {
      const transaction = getTransactionById(transactionId);
      if (transaction) {
        setFormData({
          type: transaction.type,
          category: transaction.category,
          title: transaction.title,
          note: transaction.note || '',
          amount: transaction.amount.toString(),
          date: new Date(transaction.date),
        });
      }
    }
  }, [isEditing, transactionId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TransactionFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
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
      console.log('Save transaction:', {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.toISOString(),
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
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
              console.log('Delete transaction:', transactionId);
              
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '', // Reset category when type changes
    }));
    setErrors(prev => ({ ...prev, category: undefined }));
  };

  const categoriesForType = getCategoriesByType(formData.type);
  const categoryOptions = categoriesForType.map(cat => ({
    label: cat.name,
    value: cat.id,
    icon: () => <Text style={{ color: cat.color }}>💰</Text>,
    color: cat.color,
  }));

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      style={{ backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
        showBackButton
        onBackPress={() => router.back()}
        rightActions={
          isEditing ? (
            <Button
              variant="ghost"
              onPress={handleDelete}
              className="p-2"
              accessibilityLabel="Delete transaction"
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
          {/* Transaction Type */}
          <FormField label="Type" required>
            <View className="flex-row gap-3">
              <Button
                variant={formData.type === 'income' ? 'default' : 'outline'}
                onPress={() => handleTypeChange('income')}
                className="flex-1 h-12"
                style={{
                  backgroundColor: formData.type === 'income' ? successColor : 'transparent',
                }}
              >
                <View className="flex-row items-center">
                  <ArrowUpCircle 
                    size={20} 
                    color={formData.type === 'income' ? 'white' : successColor} 
                  />
                  <Text 
                    className="ml-2 font-medium"
                    style={{ 
                      color: formData.type === 'income' ? 'white' : successColor 
                    }}
                  >
                    Income
                  </Text>
                </View>
              </Button>
              
              <Button
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                onPress={() => handleTypeChange('expense')}
                className="flex-1 h-12"
                style={{
                  backgroundColor: formData.type === 'expense' ? destructiveColor : 'transparent',
                }}
              >
                <View className="flex-row items-center">
                  <ArrowDownCircle 
                    size={20} 
                    color={formData.type === 'expense' ? 'white' : destructiveColor} 
                  />
                  <Text 
                    className="ml-2 font-medium"
                    style={{ 
                      color: formData.type === 'expense' ? 'white' : destructiveColor 
                    }}
                  >
                    Expense
                  </Text>
                </View>
              </Button>
            </View>
          </FormField>

          {/* Amount */}
          <FormField 
            label="Amount" 
            required
            error={errors.amount}
          >
            <AmountInput
              value={formData.amount}
              onChangeText={(amount) => {
                setFormData(prev => ({ ...prev, amount }));
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: undefined }));
                }
              }}
              placeholder="0.00"
              error={errors.amount}
            />
          </FormField>

          {/* Category */}
          <FormField 
            label="Category" 
            required
            error={errors.category}
          >
            <SelectSheet
              options={categoryOptions}
              selectedValue={formData.category}
              onSelect={(category) => {
                setFormData(prev => ({ ...prev, category }));
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: undefined }));
                }
              }}
              placeholder="Select a category"
              title={`Select ${formData.type === 'income' ? 'Income' : 'Expense'} Category`}
            />
          </FormField>

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
              placeholder="e.g., Grocery shopping, Salary, etc."
              error={!!errors.title}
            />
          </FormField>

          {/* Date */}
          <FormField label="Date" required>
            <CustomDateTimePicker
              value={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              mode="date"
              maximumDate={new Date()}
            />
          </FormField>

          {/* Note (Optional) */}
          <FormField 
            label="Note" 
            description="Add any additional details (optional)"
          >
            <Textarea
              value={formData.note || ''}
              onChangeText={(note) => setFormData(prev => ({ ...prev, note }))}
              placeholder="Add a note..."
              numberOfLines={3}
            />
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
              {loading ? 'Saving...' : isEditing ? 'Update Transaction' : 'Save Transaction'}
            </Text>
          </View>
        </Button>
      </View>

      <LoadingOverlay visible={loading} message={loading ? 'Saving transaction...' : ''} />
    </KeyboardAvoidingView>
  );
}