import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
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
  TimePickerField,
  LoadingOverlay 
} from '~/src/shared/ui';
import { useThemeColor } from '~/hooks/useThemeColor';
import { useTransactions } from '~/features/transactions/hooks';
import { Transaction } from '~/src/types';
import { parseIDR, formatInputIDR } from '~/utils/currency';

interface FormData {
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: string;
  date: Date;
  time?: Date;
  note?: string;
  wallet?: string;
}

interface FormErrors {
  type?: string;
  category?: string;
  title?: string;
  amount?: string;
  date?: string;
  wallet?: string;
  note?: string;
}

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  // ✅ Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const destructiveColor = useThemeColor({}, 'destructive');
  const primaryColor = useThemeColor({}, 'primary');

  // ✅ Hooks
  const { 
    transactions,
    addTransaction, 
    updateTransaction, 
    deleteTransaction
  } = useTransactions();

  // ✅ State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    category: '',
    title: '',
    amount: '',
    date: new Date(),
    time: new Date(),
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // ✅ Load transaction data if editing
  useEffect(() => {
    if (isEditing && id) {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        setFormData({
          type: transaction.type,
          category: transaction.category,
          title: transaction.title,
          amount: formatInputIDR(transaction.amount),
          date: new Date(transaction.date),
          time: new Date(),
          note: transaction.note || undefined,
          wallet: transaction.wallet || undefined,
        });
      }
    }
  }, [isEditing, id, transactions]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.type) newErrors.type = 'Tipe transaksi harus dipilih';
    if (!formData.category) newErrors.category = 'Kategori harus dipilih';
    if (!formData.title.trim()) newErrors.title = 'Judul tidak boleh kosong';
    if (!formData.amount.trim()) {
      newErrors.amount = 'Nominal tidak boleh kosong';
    } else {
      const parsedAmount = parseIDR(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Nominal harus berupa angka positif';
      }
    }
    if (!formData.date) newErrors.date = 'Tanggal harus dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Form Tidak Valid', 'Mohon periksa dan lengkapi semua field yang diperlukan.');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        type: formData.type,
        category: formData.category,
        title: formData.title,
        note: formData.note || null,
        amount: parseIDR(formData.amount),
        date: formData.date.toISOString().split('T')[0], // YYYY-MM-DD format
        wallet: formData.wallet || null,
      };

      if (isEditing && id) {
        await updateTransaction(id, transactionData);
        Alert.alert('Berhasil!', 'Transaksi berhasil diperbarui.');
      } else {
        await addTransaction(transactionData);
        Alert.alert('Berhasil!', 'Transaksi berhasil disimpan.');
      }

      router.back();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', `Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} transaksi. Silakan coba lagi.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) return;

    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTransaction(id);
              Alert.alert('Berhasil!', 'Transaksi berhasil dihapus.');
              router.back();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Gagal menghapus transaksi. Silakan coba lagi.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const incomeCategories = [
    { id: 'salary', name: 'Gaji', color: '#10B981' },
    { id: 'freelance', name: 'Freelance', color: '#3B82F6' },
    { id: 'investment', name: 'Investasi', color: '#8B5CF6' },
    { id: 'bonus', name: 'Bonus', color: '#F59E0B' },
    { id: 'gift', name: 'Hadiah', color: '#EF4444' },
    { id: 'other-income', name: 'Lainnya', color: '#6B7280' },
  ];

  const expenseCategories = [
    { id: 'food', name: 'Makanan', color: '#EF4444' },
    { id: 'transport', name: 'Transportasi', color: '#3B82F6' },
    { id: 'shopping', name: 'Belanja', color: '#F59E0B' },
    { id: 'entertainment', name: 'Hiburan', color: '#8B5CF6' },
    { id: 'health', name: 'Kesehatan', color: '#10B981' },
    { id: 'bills', name: 'Tagihan', color: '#6B7280' },
    { id: 'education', name: 'Pendidikan', color: '#14B8A6' },
    { id: 'other-expense', name: 'Lainnya', color: '#9CA3AF' },
  ];

  const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor }}
    >
      <Header 
        title={isEditing ? 'Edit Transaksi' : 'Tambah Transaksi'}
        showBackButton
        rightActions={
          isEditing ? (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={loading}
              className="mr-2"
            >
              <Trash2 size={20} color={destructiveColor} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView className="flex-1 p-4">
        <View className="gap-6">
          {/* Transaction Type */}
          <FormField 
            label="Tipe Transaksi" 
            required
            error={errors.type}
          >
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setFormData(prev => ({ ...prev, type: 'income', category: '' }));
                  if (errors.type) {
                    setErrors(prev => ({ ...prev, type: undefined }));
                  }
                }}
                className={`flex-1 p-4 rounded-lg border ${
                  formData.type === 'income' 
                    ? 'border-success bg-success/10' 
                    : 'border-border bg-card'
                }`}
              >
                <View className="items-center">
                  <ArrowUpCircle
                    size={32}
                    color={formData.type === 'income' ? '#10B981' : '#6B7280'}
                  />
                  <Text className={`text-sm mt-2 ${
                    formData.type === 'income' ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    Pemasukan
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setFormData(prev => ({ ...prev, type: 'expense', category: '' }));
                  if (errors.type) {
                    setErrors(prev => ({ ...prev, type: undefined }));
                  }
                }}
                className={`flex-1 p-4 rounded-lg border ${
                  formData.type === 'expense' 
                    ? 'border-destructive bg-destructive/10' 
                    : 'border-border bg-card'
                }`}
              >
                <View className="items-center">
                  <ArrowDownCircle
                    size={32}
                    color={formData.type === 'expense' ? '#EF4444' : '#6B7280'}
                  />
                  <Text className={`text-sm mt-2 ${
                    formData.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    Pengeluaran
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </FormField>

          {/* Amount */}
          <FormField 
            label="Nominal" 
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
              placeholder="0"
            />
          </FormField>

          {/* Title */}
          <FormField 
            label="Judul" 
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
              placeholder="Masukkan judul transaksi"
              returnKeyType="next"
            />
          </FormField>

          {/* Category */}
          <FormField 
            label="Kategori" 
            required
            error={errors.category}
          >
            <SelectSheet
              selectedValue={formData.category}
              onSelect={(category: string) => {
                setFormData(prev => ({ ...prev, category }));
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: undefined }));
                }
              }}
              options={availableCategories.map(cat => ({
                label: cat.name,
                value: cat.id,
                color: cat.color,
              }))}
              placeholder="Pilih kategori..."
            />
          </FormField>

          {/* Date */}
          <FormField 
            label="Tanggal Transaksi" 
            required
            error={errors.date}
          >
            <CustomDateTimePicker
              value={formData.date}
              onChange={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, date }));
                  if (errors.date) {
                    setErrors(prev => ({ ...prev, date: undefined }));
                  }
                }
              }}
              placeholder="Pilih tanggal transaksi"
              mode="date"
              maximumDate={new Date()}
            />
          </FormField>

          {/* Time (Optional) */}
          <FormField label="Waktu Transaksi (Opsional)">
            <TimePickerField
              value={formData.time || new Date()}
              onChange={(time) => setFormData(prev => ({ ...prev, time }))}
              placeholder="Pilih waktu transaksi"
            />
          </FormField>

          {/* Wallet (Optional) */}
          <FormField label="Dompet/Akun">
            <Input
              value={formData.wallet || ''}
              onChangeText={(wallet) => setFormData(prev => ({ ...prev, wallet: wallet || undefined }))}
              placeholder="Pilih dompet atau akun..."
            />
          </FormField>

          {/* Note */}
          <FormField label="Catatan">
            <Textarea
              value={formData.note || ''}
              onChangeText={(note) => setFormData(prev => ({ ...prev, note }))}
              placeholder="Tambahkan catatan tambahan..."
              numberOfLines={3}
              className="min-h-20"
            />
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
          disabled={loading}
          className="h-12"
        >
          <View className="flex-row items-center">
            <Save size={20} color="white" />
            <Text className="text-white font-medium ml-2">
              {isEditing ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
            </Text>
          </View>
        </Button>
      </View>

      {loading && <LoadingOverlay visible={true} />}
    </KeyboardAvoidingView>
  );
}