// ================================================================
// RECEIPT BOTTOM SHEET COMPONENT
// ================================================================
// Live preview of OCR results during scanning
// ================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import type { ParsedReceipt, RealtimeOCRState } from '../../utils/receiptParser.types';
import { LinearGradient } from 'expo-linear-gradient';

interface ReceiptBottomSheetProps {
  ocrState: RealtimeOCRState;
  onConfirm?: () => void;
  onRetake?: () => void;
  isVisible: boolean;
}

const { height: screenHeight } = Dimensions.get('window');
const SHEET_HEIGHT = screenHeight * 0.3;

export function ReceiptBottomSheet({ 
  ocrState, 
  onConfirm, 
  onRetake,
  isVisible 
}: ReceiptBottomSheetProps) {
  if (!isVisible || !ocrState.lastStableResult) {
    return null;
  }

  const result = ocrState.lastStableResult;

  return (
    <View style={[styles.container, { height: SHEET_HEIGHT }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
        style={styles.background}
      >
        {/* Handle bar */}
        <View style={styles.handle} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hasil Deteksi</Text>
          <ConfidenceBadge confidence={result.confidence.overall} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ResultField
            label="Merchant"
            value={result.merchant}
            confidence={result.confidence.merchant}
            placeholder="Tidak terdeteksi"
          />
          
          <ResultField
            label="Total"
            value={formatCurrency(result.totalAmount, result.currency)}
            confidence={result.confidence.total}
            placeholder="Rp 0"
          />
          
          <ResultField
            label="Tanggal"
            value={formatDate(result.purchaseDate)}
            confidence={result.confidence.date}
            placeholder="Tidak terdeteksi"
          />
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={onRetake}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              📷 Ambil Ulang
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={onConfirm}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              ✓ Konfirmasi
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Individual result field component
 */
function ResultField({ 
  label, 
  value, 
  confidence, 
  placeholder 
}: { 
  label: string; 
  value: string | null; 
  confidence: number; 
  placeholder: string;
}) {
  const displayValue = value || placeholder;
  const isDetected = !!value;
  
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isDetected && (
          <ConfidenceBadge confidence={confidence} size="small" />
        )}
      </View>
      
      <Text style={[
        styles.fieldValue,
        !isDetected && styles.fieldValuePlaceholder
      ]}>
        {displayValue}
      </Text>
    </View>
  );
}

/**
 * Confidence badge component
 */
function ConfidenceBadge({ 
  confidence, 
  size = 'normal' 
}: { 
  confidence: number; 
  size?: 'small' | 'normal';
}) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return '#10B981'; // Green
    if (conf >= 0.6) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'Tinggi';
    if (conf >= 0.6) return 'Sedang';
    return 'Rendah';
  };

  const color = getConfidenceColor(confidence);
  const text = getConfidenceText(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <View style={[
      styles.confidenceBadge,
      { backgroundColor: color + '20', borderColor: color },
      size === 'small' && styles.confidenceBadgeSmall
    ]}>
      <Text style={[
        styles.confidenceText,
        { color },
        size === 'small' && styles.confidenceTextSmall
      ]}>
        {text} ({percentage}%)
      </Text>
    </View>
  );
}

/**
 * Format currency value
 */
function formatCurrency(amount: number | null, currency: string): string | null {
  if (!amount) return null;
  
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

/**
 * Format date value
 */
function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr; // Return original if parsing fails
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  background: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldValuePlaceholder: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  confidenceBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceTextSmall: {
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6B7280',
  },
});
