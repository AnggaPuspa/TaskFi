// ================================================================
// RECEIPT REVIEW SCREEN COMPONENT
// ================================================================
// Edit and confirm OCR results before saving to Supabase
// ================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import type { ParsedReceipt } from '../utils/receiptParser.types';
import { validateParsedReceipt } from '../utils/parseReceipt';
import { saveReceiptToSupabase } from '../utils/receiptHelpers';
import { useSession } from '../utils/ctx';

export default function ReceiptReviewScreen() {
  const { ocrData } = useLocalSearchParams<{ ocrData: string }>();
  const { session } = useSession();
  
  // Parse OCR data from params
  const initialData: ParsedReceipt | null = ocrData ? JSON.parse(ocrData) : null;
  
  // Form state
  const [formData, setFormData] = useState({
    merchant: initialData?.merchant || '',
    totalAmount: initialData?.totalAmount?.toString() || '',
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
    currency: initialData?.currency || 'IDR',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Validate form data
   */
  useEffect(() => {
    const mockReceipt: ParsedReceipt = {
      merchant: formData.merchant || null,
      totalAmount: parseFloat(formData.totalAmount) || null,
      purchaseDate: formData.purchaseDate || null,
      currency: formData.currency,
      confidence: { merchant: 1, total: 1, date: 1, overall: 1 },
      rawText: initialData?.rawText || ''
    };
    
    const errors = validateParsedReceipt(mockReceipt);
    setValidationErrors(errors);
  }, [formData, initialData]);

  /**
   * Handle form field changes
   */
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle date change
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      updateField('purchaseDate', dateString);
    }
  };

  /**
   * Format currency input
   */
  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Parse and format
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      return parsed.toLocaleString('id-ID');
    }
    return numericValue;
  };

  /**
   * Parse currency input back to number
   */
  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  /**
   * Save receipt to database
   */
  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'Anda harus login untuk menyimpan struk');
      return;
    }

    if (validationErrors.length > 0) {
      Alert.alert(
        'Data Tidak Valid',
        validationErrors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);

      const receiptData = {
        user_id: session.user.id,
        ocr_text: initialData?.rawText || '',
        merchant: formData.merchant || null,
        total_amount: parseCurrencyInput(formData.totalAmount),
        currency: formData.currency,
        purchase_date: formData.purchaseDate || null,
        status: 'confirmed' as const,
        confidence_score: initialData?.confidence.overall || 0,
        device_info: {
          platform: Platform.OS,
          timestamp: new Date().toISOString()
        },
        processing_time_ms: null,
      };

      const result = await saveReceiptToSupabase(receiptData);

      if (result.success) {
        Alert.alert(
          'Berhasil!',
          'Struk telah disimpan ke database',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to transactions or main screen
                router.replace('/(app)/(tabs)');
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Gagal menyimpan struk'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    Alert.alert(
      'Batalkan?',
      'Data OCR akan hilang jika dibatalkan',
      [
        { text: 'Lanjutkan Edit', style: 'cancel' },
        { 
          text: 'Batalkan', 
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  if (!initialData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Data OCR tidak tersedia</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Batal</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Review Struk</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Confidence indicator */}
          {initialData.confidence.overall < 0.8 && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ Tingkat kepercayaan OCR rendah. Mohon periksa data dengan teliti.
              </Text>
            </View>
          )}

          {/* Form fields */}
          <View style={styles.form}>
            {/* Merchant */}
            <View style={styles.field}>
              <Text style={styles.label}>Merchant / Toko</Text>
              <TextInput
                style={styles.input}
                value={formData.merchant}
                onChangeText={(value) => updateField('merchant', value)}
                placeholder="Nama toko atau merchant"
                maxLength={80}
              />
              <FieldConfidence confidence={initialData.confidence.merchant} />
            </View>

            {/* Total Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Total Pembayaran</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>Rp</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  value={formData.totalAmount}
                  onChangeText={(value) => updateField('totalAmount', value)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <FieldConfidence confidence={initialData.confidence.total} />
            </View>

            {/* Purchase Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Tanggal Pembelian</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.purchaseDate ? 
                    new Date(formData.purchaseDate).toLocaleDateString('id-ID') : 
                    'Pilih tanggal'
                  }
                </Text>
              </TouchableOpacity>
              <FieldConfidence confidence={initialData.confidence.date} />
            </View>

            {/* Raw OCR Text */}
            <View style={styles.field}>
              <Text style={styles.label}>Teks OCR Asli</Text>
              <View style={styles.rawTextContainer}>
                <ScrollView style={styles.rawTextScroll} nestedScrollEnabled>
                  <Text style={styles.rawText}>{initialData.rawText}</Text>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>Masalah yang ditemukan:</Text>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorItem}>• {error}</Text>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, (validationErrors.length > 0 || isLoading) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={validationErrors.length > 0 || isLoading}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>
              {isLoading ? 'Menyimpan...' : '💾 Simpan Struk'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date picker modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.purchaseDate ? new Date(formData.purchaseDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Field confidence indicator
 */
function FieldConfidence({ confidence }: { confidence: number }) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return '#10B981';
    if (conf >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'Tinggi';
    if (conf >= 0.6) return 'Sedang';
    return 'Rendah';
  };

  const color = getConfidenceColor(confidence);
  const text = getConfidenceText(confidence);

  return (
    <View style={[styles.confidenceBadge, { borderColor: color }]}>
      <Text style={[styles.confidenceText, { color }]}>
        {text} ({Math.round(confidence * 100)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    paddingVertical: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  rawTextContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    maxHeight: 120,
  },
  rawTextScroll: {
    maxHeight: 120,
  },
  rawText: {
    padding: 12,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  confidenceBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorsContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#6B7280',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
});
