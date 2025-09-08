import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUpCircle, ArrowDownCircle, Save, Trash2, Camera, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react-native';

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
  LoadingOverlay,
  OCRScanner,
  OCRResultSheet
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
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [showOCRResult, setShowOCRResult] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
    if (!formData.amount.trim()) {
      newErrors.amount = 'Nominal tidak boleh kosong';
    } else {
      const parsedAmount = parseIDR(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Nominal harus berupa angka positif';
      }
    }
    if (!formData.category) newErrors.category = 'Kategori harus dipilih';
    if (!formData.title.trim()) newErrors.title = 'Keterangan tidak boleh kosong';
    if (!formData.date) newErrors.date = 'Tanggal harus dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1 || isEditing) {
      if (!formData.amount.trim()) {
        newErrors.amount = 'Nominal tidak boleh kosong';
      } else {
        const parsedAmount = parseIDR(formData.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          newErrors.amount = 'Nominal harus berupa angka positif';
        }
      }
    }

    if (currentStep === 2 || isEditing) {
      if (!formData.category) newErrors.category = 'Kategori harus dipilih';
      if (!formData.title.trim()) newErrors.title = 'Keterangan tidak boleh kosong';
    }

    if (currentStep === 3 || isEditing) {
      if (!formData.date) newErrors.date = 'Tanggal harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pure check for current step validity that does NOT call setErrors.
  // Use this for render-time checks (e.g. disabled props) to avoid state
  // updates during render which cause infinite re-renders.
  const isCurrentStepValid = (): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1 || isEditing) {
      if (!formData.amount.trim()) {
        newErrors.amount = 'Nominal tidak boleh kosong';
      } else {
        const parsedAmount = parseIDR(formData.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          newErrors.amount = 'Nominal harus berupa angka positif';
        }
      }
    }

    if (currentStep === 2 || isEditing) {
      if (!formData.category) newErrors.category = 'Kategori harus dipilih';
      if (!formData.title.trim()) newErrors.title = 'Keterangan tidak boleh kosong';
    }

    if (currentStep === 3 || isEditing) {
      if (!formData.date) newErrors.date = 'Tanggal harus dipilih';
    }

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

  const handleOCRTextRecognized = (text: string) => {
    setOcrText(text);
    setShowOCRResult(true);
  };

  const handleUseOCRData = (data: any) => {
    // Update form with OCR data while preserving existing values
    if (data.amount) {
      setFormData(prev => ({ ...prev, amount: formatInputIDR(data.amount) }));
    }
    if (data.title) {
      setFormData(prev => ({ ...prev, title: data.title }));
    }
    if (data.date) {
      setFormData(prev => ({ ...prev, date: data.date }));
    }
    if (data.time) {
      setFormData(prev => ({ ...prev, time: data.time }));
    }
    if (data.type) {
      setFormData(prev => ({ ...prev, type: data.type, category: '' })); // Reset category when type changes
    }
    if (data.category) {
      setFormData(prev => ({ ...prev, category: data.category }));
    }

    // Clear any existing errors for fields that were updated
    const fieldsToUpdate = Object.keys(data);
    setErrors(prev => {
      const newErrors = { ...prev };
      fieldsToUpdate.forEach(field => {
        if (field in newErrors) {
          delete newErrors[field as keyof FormErrors];
        }
      });
      return newErrors;
    });
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

  // Helper untuk menentukan apakah bisa lanjut ke step berikutnya
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return formData.amount && parseIDR(formData.amount) > 0;
    }
    if (currentStep === 2) {
      return formData.category && formData.title.trim();
    }
    if (currentStep === 3) {
      return formData.date;
    }
    return true;
  };

  // Quick amount buttons
  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

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

      {/* Progress Indicator */}
      {!isEditing && (
        <View className="px-4 py-3 bg-card border-b border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted-foreground">
              Langkah {currentStep} dari 3
            </Text>
            <Text className="text-sm text-primary font-medium">
              {currentStep === 1 ? 'Jumlah' : currentStep === 2 ? 'Detail' : 'Selesai'}
            </Text>
          </View>
          <View className="flex-row gap-1">
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                className={`flex-1 h-1 rounded ${
                  step <= currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Step 1: Amount & Type */}
        {(currentStep === 1 || isEditing) && (
          <View className="gap-6">
            {/* Transaction Type - Simplified */}
            <View>
              <Text className="text-lg font-semibold mb-3">
                {isEditing ? 'Tipe & Jumlah' : 'Apa jenis transaksi ini?'}
              </Text>
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setFormData(prev => ({ ...prev, type: 'expense', category: '' }));
                    if (errors.type) {
                      setErrors(prev => ({ ...prev, type: undefined }));
                    }
                  }}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    formData.type === 'expense' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                      : 'border-border bg-card'
                  }`}
                >
                  <View className="items-center">
                    <Minus
                      size={28}
                      color={formData.type === 'expense' ? '#EF4444' : '#6B7280'}
                    />
                    <Text className={`text-sm mt-2 font-medium ${
                      formData.type === 'expense' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      Pengeluaran
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setFormData(prev => ({ ...prev, type: 'income', category: '' }));
                    if (errors.type) {
                      setErrors(prev => ({ ...prev, type: undefined }));
                    }
                  }}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    formData.type === 'income' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-border bg-card'
                  }`}
                >
                  <View className="items-center">
                    <Plus
                      size={28}
                      color={formData.type === 'income' ? '#10B981' : '#6B7280'}
                    />
                    <Text className={`text-sm mt-2 font-medium ${
                      formData.type === 'income' ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      Pemasukan
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input - Enhanced */}
            <View>
              <Text className="text-lg font-semibold mb-3">
                Berapa jumlahnya?
              </Text>
              
              <AmountInput
                value={formData.amount}
                onChangeText={(amount) => {
                  setFormData(prev => ({ ...prev, amount }));
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: undefined }));
                  }
                }}
                placeholder="0"
                className="text-center text-2xl font-bold mb-4"
              />

              {errors.amount && (
                <Text className="text-red-500 text-sm mb-4">{errors.amount}</Text>
              )}

              {/* Quick Amount Buttons */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2">Jumlah cepat:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, amount: formatInputIDR(amount) }));
                        if (errors.amount) {
                          setErrors(prev => ({ ...prev, amount: undefined }));
                        }
                      }}
                      className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg"
                    >
                      <Text className="text-sm text-primary font-medium">
                        {formatInputIDR(amount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* OCR Button */}
              <TouchableOpacity
                onPress={() => setShowOCRScanner(true)}
                className="flex-row items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl"
              >
                <Camera size={20} color="#3B82F6" />
                <Text className="text-blue-600 font-medium">
                  Scan Struk Otomatis
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Category & Title */}
        {(currentStep === 2 || isEditing) && (
          <View className="gap-6">
            {!isEditing && (
              <Text className="text-lg font-semibold">
                Untuk apa transaksi ini?
              </Text>
            )}

            {/* Category Selection - Visual Grid */}
            <View>
              <Text className="text-base font-medium mb-3">Kategori</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {availableCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, category: cat.id }));
                      if (errors.category) {
                        setErrors(prev => ({ ...prev, category: undefined }));
                      }
                    }}
                    className={`px-4 py-3 rounded-xl border ${
                      formData.category === cat.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text 
                      className={`text-sm font-medium ${
                        formData.category === cat.id ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && (
                <Text className="text-red-500 text-sm">{errors.category}</Text>
              )}
            </View>

            {/* Title Input */}
            <View>
              <Text className="text-base font-medium mb-3">Keterangan</Text>
              <Input
                value={formData.title}
                onChangeText={(title) => {
                  setFormData(prev => ({ ...prev, title }));
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="Contoh: Makan siang di warung padang"
                className="text-base"
              />
              {errors.title && (
                <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
              )}
            </View>
          </View>
        )}

        {/* Step 3: Final Details */}
        {(currentStep === 3 || isEditing) && (
          <View className="gap-6">
            {!isEditing && (
              <Text className="text-lg font-semibold">
                Detail tambahan (opsional)
              </Text>
            )}

            {/* Date */}
            <View>
              <Text className="text-base font-medium mb-3">Tanggal</Text>
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
                placeholder="Pilih tanggal"
                mode="date"
                maximumDate={new Date()}
              />
              {errors.date && (
                <Text className="text-red-500 text-sm mt-1">{errors.date}</Text>
              )}
            </View>

            {/* Collapsible Advanced Options */}
            <View>
              <TouchableOpacity
                onPress={() => setShowAdvanced(!showAdvanced)}
                className="flex-row items-center justify-between p-3 bg-muted/30 rounded-lg mb-3"
              >
                <Text className="text-base font-medium">Opsi Lanjutan</Text>
                {showAdvanced ? (
                  <ChevronUp size={20} color={primaryColor} />
                ) : (
                  <ChevronDown size={20} color={primaryColor} />
                )}
              </TouchableOpacity>

              {showAdvanced && (
                <View className="gap-4 border-l-2 border-primary/20 pl-4">
                  {/* Time */}
                  <View>
                    <Text className="text-sm font-medium mb-2">Waktu</Text>
                    <TimePickerField
                      value={formData.time || new Date()}
                      onChange={(time) => setFormData(prev => ({ ...prev, time }))}
                      placeholder="Pilih waktu"
                    />
                  </View>

                  {/* Wallet */}
                  <View>
                    <Text className="text-sm font-medium mb-2">Dompet/Akun</Text>
                    <Input
                      value={formData.wallet || ''}
                      onChangeText={(wallet) => setFormData(prev => ({ ...prev, wallet: wallet || undefined }))}
                      placeholder="Contoh: Dompet utama, Bank BCA"
                    />
                  </View>

                  {/* Note */}
                  <View>
                    <Text className="text-sm font-medium mb-2">Catatan</Text>
                    <Textarea
                      value={formData.note || ''}
                      onChangeText={(note) => setFormData(prev => ({ ...prev, note }))}
                      placeholder="Catatan tambahan..."
                      numberOfLines={3}
                      className="min-h-20"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Summary (Step 3 only) */}
        {currentStep === 3 && !isEditing && (
          <View className="mt-6 p-4 bg-muted/30 rounded-xl">
            <Text className="text-sm font-medium mb-3 text-muted-foreground">Ringkasan:</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm">Tipe:</Text>
                <Text className={`text-sm font-medium ${
                  formData.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm">Jumlah:</Text>
                <Text className="text-sm font-bold">
                  Rp {formData.amount ? parseIDR(formData.amount).toLocaleString('id-ID') : '0'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm">Kategori:</Text>
                <Text className="text-sm font-medium">
                  {availableCategories.find(c => c.id === formData.category)?.name || '-'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm">Keterangan:</Text>
                <Text className="text-sm font-medium">{formData.title || '-'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with Navigation */}
      <View 
        className="p-4 border-t border-border bg-card"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {!isEditing ? (
          <View className="flex-row gap-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                variant="outline"
                onPress={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                <Text>Kembali</Text>
              </Button>
            )}

            {/* Next/Save Button */}
            {currentStep < 3 ? (
              <Button
                onPress={() => {
                  if (validateCurrentStep()) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={!canProceedToNextStep()}
                className={`${currentStep === 1 ? 'flex-1' : 'flex-1'}`}
              >
                <Text className="text-white font-medium">
                  Lanjut
                </Text>
              </Button>
            ) : (
              <Button
                onPress={handleSave}
                disabled={loading || !isCurrentStepValid()}
                className="flex-1"
              >
                <View className="flex-row items-center">
                  <Save size={20} color="white" />
                  <Text className="text-white font-medium ml-2">
                    Simpan Transaksi
                  </Text>
                </View>
              </Button>
            )}
          </View>
        ) : (
          <Button
            onPress={handleSave}
            disabled={loading}
            className="h-12"
          >
            <View className="flex-row items-center">
              <Save size={20} color="white" />
              <Text className="text-white font-medium ml-2">
                Perbarui Transaksi
              </Text>
            </View>
          </Button>
        )}
      </View>

      {loading && <LoadingOverlay visible={true} />}

      {/* OCR Scanner Modal */}
      <OCRScanner
        visible={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        onTextRecognized={handleOCRTextRecognized}
      />

      {/* OCR Result Sheet */}
      <OCRResultSheet
        visible={showOCRResult}
        onClose={() => setShowOCRResult(false)}
        onUseData={handleUseOCRData}
        rawText={ocrText}
      />
    </KeyboardAvoidingView>
  );
}