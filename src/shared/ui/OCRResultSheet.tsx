import React, { useMemo } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, FileText, Check, AlertCircle, Zap } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useThemeColor } from '~/hooks/useThemeColor';
import { parseReceipt } from '~/utils/parseReceipt';
import type { ParsedReceipt } from '~/utils/receiptParser.types';

interface ParsedData {
  amount?: number;
  title?: string;
  date?: Date;
  time?: Date;
  type?: 'income' | 'expense';
  category?: string;
  confidence?: {
    amount: number;
    title: number;
    date: number;
    overall: number;
  };
}

interface OCRResultSheetProps {
  visible: boolean;
  onClose: () => void;
  onUseData: (data: ParsedData) => void;
  rawText: string;
}

const { height } = Dimensions.get('window');

export function OCRResultSheet({ visible, onClose, onUseData, rawText }: OCRResultSheetProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const mutedForegroundColor = useThemeColor({}, 'muted-foreground');

  const parsedData = useMemo((): ParsedData => {
    if (!rawText) {
      return { type: 'expense' };
    }
    
    // Parse using our existing receipt parser
    const ocrResult = { text: rawText, confidence: 0.8 };
    const parseResult = parseReceipt(ocrResult);
    
    if (!parseResult.success || !parseResult.data) {
      return { type: 'expense' };
    }
    
    const receipt = parseResult.data;
    
    // Convert to our format
    return {
      amount: receipt.totalAmount || undefined,
      title: receipt.merchant || undefined,
      date: receipt.purchaseDate ? new Date(receipt.purchaseDate) : undefined,
      time: receipt.purchaseDate ? new Date(receipt.purchaseDate) : undefined,
      type: 'expense', // Default to expense for now
      category: inferCategory(receipt.merchant || ''),
      confidence: {
        amount: receipt.confidence.total,
        title: receipt.confidence.merchant,
        date: receipt.confidence.date,
        overall: receipt.confidence.overall
      }
    };
  }, [rawText]);

  const handleUseData = () => {
    onUseData(parsedData);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor }}>
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ 
            borderBottomColor: borderColor,
            paddingTop: insets.top + 12,
          }}
        >
          <View className="flex-row items-center">
            <FileText size={20} color={primaryColor} />
            <Text className="text-lg font-semibold ml-2">Hasil Scan Struk</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Confidence Score */}
          {parsedData.confidence && (
            <View 
              className="rounded-lg p-3 mb-4 border"
              style={{ 
                backgroundColor: parsedData.confidence.overall > 0.7 ? '#10B981' : 
                                parsedData.confidence.overall > 0.4 ? '#F59E0B' : '#EF4444',
                borderColor: borderColor,
                opacity: 0.1
              }}
            >
              <View className="flex-row items-center mb-2">
                {parsedData.confidence.overall > 0.7 ? (
                  <Zap size={16} color="#10B981" />
                ) : (
                  <AlertCircle size={16} color="#EF4444" />
                )}
                <Text className="text-sm font-medium ml-2">
                  Tingkat Akurasi: {Math.round(parsedData.confidence.overall * 100)}%
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {parsedData.confidence.overall > 0.7 
                  ? 'Data terdeteksi dengan akurasi tinggi'
                  : parsedData.confidence.overall > 0.4
                  ? 'Data terdeteksi dengan akurasi sedang, periksa kembali'
                  : 'Data terdeteksi dengan akurasi rendah, harap periksa manual'
                }
              </Text>
            </View>
          )}

          {/* Parsed Data Preview */}
          <View 
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: cardColor }}
          >
            <Text className="text-sm font-medium text-primary mb-3">
              Data yang Terdeteksi:
            </Text>
            
            <View className="gap-3">
              {parsedData.amount && (
                <DataRow 
                  label="Nominal" 
                  value={`Rp ${parsedData.amount.toLocaleString('id-ID')}`}
                  highlighted 
                  confidence={parsedData.confidence?.amount}
                />
              )}
              
              {parsedData.title && (
                <DataRow 
                  label="Merchant/Toko" 
                  value={parsedData.title} 
                  highlighted
                  confidence={parsedData.confidence?.title}
                />
              )}
              
              {parsedData.date && (
                <DataRow 
                  label="Tanggal" 
                  value={parsedData.date.toLocaleDateString('id-ID')}
                  highlighted
                  confidence={parsedData.confidence?.date}
                />
              )}
              
              {parsedData.time && (
                <DataRow 
                  label="Waktu" 
                  value={parsedData.time.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
              )}
              
              <DataRow 
                label="Tipe" 
                value={parsedData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              />

              {parsedData.category && (
                <DataRow 
                  label="Kategori (Saran)" 
                  value={getCategoryDisplayName(parsedData.category)}
                />
              )}
            </View>
          </View>

          {/* Raw Text */}
          <View 
            className="rounded-lg p-4"
            style={{ backgroundColor: cardColor }}
          >
            <Text className="text-sm font-medium mb-2">
              Teks Asli (Raw Text):
            </Text>
            <ScrollView 
              className="max-h-32 border rounded p-2"
              style={{ borderColor }}
              showsVerticalScrollIndicator={true}
            >
              <Text 
                className="text-xs font-mono leading-4"
                style={{ color: mutedForegroundColor }}
              >
                {rawText || 'Tidak ada teks yang terdeteksi'}
              </Text>
            </ScrollView>
          </View>

          {/* Info */}
          <View className="mt-4">
            <Text className="text-xs text-muted-foreground text-center">
              Data di atas akan mengisi form secara otomatis. Anda masih bisa mengubah atau melengkapi informasi yang diperlukan.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View 
          className="p-4 border-t flex-row gap-3"
          style={{ 
            borderTopColor: borderColor,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Button 
            variant="outline" 
            onPress={onClose}
            className="flex-1"
          >
            <Text>Batal</Text>
          </Button>
          
          <Button 
            onPress={handleUseData}
            className="flex-1"
            disabled={!parsedData.amount && !parsedData.title}
          >
            <View className="flex-row items-center">
              <Check size={16} color="white" />
              <Text className="text-white font-medium ml-2">
                Gunakan Data
              </Text>
            </View>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  highlighted?: boolean;
  confidence?: number;
}

function DataRow({ label, value, highlighted, confidence }: DataRowProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedForegroundColor = useThemeColor({}, 'muted-foreground');
  
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center">
        <Text className="text-sm text-muted-foreground">{label}:</Text>
        {confidence !== undefined && (
          <View className={`ml-2 px-1 rounded ${
            confidence > 0.7 ? 'bg-green-100' : 
            confidence > 0.4 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs ${
              confidence > 0.7 ? 'text-green-600' : 
              confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(confidence * 100)}%
            </Text>
          </View>
        )}
      </View>
      <Text 
        className={`text-sm font-medium ${highlighted ? 'text-primary' : ''}`}
        style={highlighted ? { color: primaryColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    'food': 'Makanan & Minuman',
    'shopping': 'Belanja',
    'transport': 'Transportasi',
    'health': 'Kesehatan',
    'entertainment': 'Hiburan',
    'bills': 'Tagihan',
    'education': 'Pendidikan'
  };
  
  return categoryNames[category] || category;
}

/**
 * Infer category based on merchant name
 */
function inferCategory(merchant: string): string | undefined {
  const merchantLower = merchant.toLowerCase();
  
  // Food & Beverages
  if (merchantLower.includes('alfamart') || 
      merchantLower.includes('indomaret') ||
      merchantLower.includes('warung') ||
      merchantLower.includes('resto') ||
      merchantLower.includes('cafe') ||
      merchantLower.includes('kopi') ||
      merchantLower.includes('makan')) {
    return 'food';
  }
  
  // Transportation
  if (merchantLower.includes('spbu') ||
      merchantLower.includes('pertamina') ||
      merchantLower.includes('shell') ||
      merchantLower.includes('gojek') ||
      merchantLower.includes('grab') ||
      merchantLower.includes('taxi')) {
    return 'transport';
  }
  
  // Health
  if (merchantLower.includes('apotek') ||
      merchantLower.includes('rumah sakit') ||
      merchantLower.includes('klinik') ||
      merchantLower.includes('dokter')) {
    return 'health';
  }
  
  // Default to food for convenience stores
  if (merchantLower.includes('mart') || 
      merchantLower.includes('toko')) {
    return 'shopping';
  }
  
  return undefined;
}
