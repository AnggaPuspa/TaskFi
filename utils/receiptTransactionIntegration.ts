// ================================================================
// RECEIPT TRANSACTION INTEGRATION
// ================================================================
// Production utility to convert OCR results to transaction format
// ================================================================

import type { ParsedReceipt } from './receiptParser.types';
import type { Database } from '../supabase/database.types';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type ReceiptInsert = Database['public']['Tables']['receipts']['Insert'];

export interface ReceiptToTransactionResult {
  transaction: TransactionInsert;
  receipt: ReceiptInsert;
  suggestedCategory: string;
  confidence: number;
}

/**
 * Convert parsed receipt to transaction and receipt records
 */
export function convertReceiptToTransaction(
  receipt: ParsedReceipt,
  userId: string,
  options: {
    autoDetectCategory?: boolean;
    defaultCategory?: string;
    defaultWallet?: string;
  } = {}
): ReceiptToTransactionResult {
  const {
    autoDetectCategory = true,
    defaultCategory = 'other-expense',
    defaultWallet = null
  } = options;

  // Determine category from merchant
  const suggestedCategory = autoDetectCategory 
    ? detectCategoryFromMerchant(receipt.merchant || '')
    : defaultCategory;

  // Create transaction record
  const transaction: TransactionInsert = {
    user_id: userId,
    type: 'expense', // Most receipts are expenses
    category: suggestedCategory,
    title: generateTransactionTitle(receipt),
    note: generateTransactionNote(receipt),
    amount: receipt.totalAmount || 0,
    date: receipt.purchaseDate || new Date().toISOString().split('T')[0],
    wallet: defaultWallet,
  };

  // Create receipt record for audit trail
  const receiptRecord: ReceiptInsert = {
    user_id: userId,
    ocr_text: receipt.rawText,
    merchant: receipt.merchant,
    total_amount: receipt.totalAmount,
    currency: receipt.currency,
    purchase_date: receipt.purchaseDate,
    status: 'confirmed',
    confidence_score: receipt.confidence.overall,
    device_info: {
      platform: 'mobile',
      timestamp: new Date().toISOString(),
      category_detected: suggestedCategory,
      auto_converted: true
    },
  };

  return {
    transaction,
    receipt: receiptRecord,
    suggestedCategory,
    confidence: receipt.confidence.overall
  };
}

/**
 * Detect transaction category from merchant name
 */
function detectCategoryFromMerchant(merchant: string): string {
  const merchantLower = merchant.toLowerCase().trim();
  
  // Food & Beverages
  const foodKeywords = [
    'alfamart', 'indomaret', 'alfamidi', 'circle k',
    'warung', 'resto', 'restaurant', 'cafe', 'kopi', 'coffee',
    'mcdonald', 'kfc', 'burger', 'pizza', 'bakso', 'soto',
    'padang', 'gudeg', 'ayam', 'bebek', 'seafood', 'bakery',
    'toko roti', 'martabak', 'gado-gado', 'nasi', 'mie'
  ];
  
  // Transportation
  const transportKeywords = [
    'spbu', 'pertamina', 'shell', 'total', 'bp',
    'gojek', 'grab', 'taxi', 'ojek', 'uber',
    'busway', 'transjakarta', 'kereta', 'commuter',
    'tol', 'parkir', 'parking'
  ];
  
  // Health & Medical
  const healthKeywords = [
    'apotek', 'pharmacy', 'rumah sakit', 'hospital',
    'klinik', 'clinic', 'dokter', 'puskesmas',
    'laboratorium', 'optik', 'dental'
  ];
  
  // Shopping & Retail
  const shoppingKeywords = [
    'mall', 'plaza', 'supermarket', 'hypermart',
    'carrefour', 'giant', 'hero', 'lotte mart',
    'ace hardware', 'depo bangunan', 'electronic city',
    'fashion', 'clothing', 'sepatu', 'tas', 'uniqlo',
    'zara', 'h&m'
  ];
  
  // Entertainment
  const entertainmentKeywords = [
    'cinema', 'bioskop', 'xxi', 'cgv', 'cinepolis',
    'karaoke', 'ktv', 'game', 'timezone', 'bowling',
    'gym', 'fitness', 'spa', 'salon'
  ];
  
  // Bills & Utilities
  const billsKeywords = [
    'pln', 'listrik', 'pdam', 'air', 'telkom',
    'indihome', 'wifi', 'internet', 'pulsa',
    'token', 'pbb', 'pajak', 'asuransi', 'bank'
  ];
  
  // Check each category
  if (foodKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'food';
  }
  
  if (transportKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'transport';
  }
  
  if (healthKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'health';
  }
  
  if (shoppingKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'shopping';
  }
  
  if (entertainmentKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'entertainment';
  }
  
  if (billsKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'bills';
  }
  
  // Default to shopping for convenience stores
  if (merchantLower.includes('mart') || merchantLower.includes('toko')) {
    return 'shopping';
  }
  
  return 'other-expense';
}

/**
 * Generate transaction title from receipt data
 */
function generateTransactionTitle(receipt: ParsedReceipt): string {
  if (receipt.merchant) {
    // Clean up merchant name
    const cleanMerchant = receipt.merchant
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter of each word
    const capitalizedMerchant = cleanMerchant
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return `Belanja di ${capitalizedMerchant}`;
  }
  
  // Fallback based on amount
  if (receipt.totalAmount) {
    if (receipt.totalAmount < 50000) {
      return 'Pembelian kecil';
    } else if (receipt.totalAmount < 200000) {
      return 'Pembelian sedang';
    } else {
      return 'Pembelian besar';
    }
  }
  
  return 'Transaksi dari struk';
}

/**
 * Generate transaction note from receipt data
 */
function generateTransactionNote(receipt: ParsedReceipt): string {
  const notes: string[] = [];
  
  if (receipt.merchant) {
    notes.push(`Merchant: ${receipt.merchant}`);
  }
  
  if (receipt.purchaseDate) {
    const date = new Date(receipt.purchaseDate);
    notes.push(`Tanggal: ${date.toLocaleDateString('id-ID')}`);
  }
  
  if (receipt.confidence.overall < 0.8) {
    notes.push(`Confidence: ${Math.round(receipt.confidence.overall * 100)}%`);
  }
  
  notes.push('Dibuat otomatis dari scan struk');
  
  return notes.join(' | ');
}

/**
 * Validate receipt data before conversion
 */
export function validateReceiptForTransaction(receipt: ParsedReceipt): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!receipt.totalAmount || receipt.totalAmount <= 0) {
    errors.push('Total amount harus lebih dari 0');
  }
  
  if (!receipt.merchant || receipt.merchant.length < 2) {
    warnings.push('Nama merchant tidak terdeteksi atau terlalu pendek');
  }
  
  if (!receipt.purchaseDate) {
    warnings.push('Tanggal pembelian tidak terdeteksi');
  }
  
  // Confidence checks
  if (receipt.confidence.overall < 0.6) {
    warnings.push('Tingkat kepercayaan OCR rendah, periksa data manual');
  }
  
  if (receipt.confidence.total < 0.7) {
    warnings.push('Nominal tidak terbaca dengan jelas');
  }
  
  // Amount validation
  if (receipt.totalAmount && receipt.totalAmount > 10000000) {
    warnings.push('Nominal sangat besar, pastikan benar');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get category display info
 */
export function getCategoryInfo(categoryId: string): {
  name: string;
  icon: string;
  color: string;
  description: string;
} {
  const categories: Record<string, any> = {
    'food': {
      name: 'Makanan & Minuman',
      icon: '🍔',
      color: '#EF4444',
      description: 'Makanan, minuman, groceries'
    },
    'transport': {
      name: 'Transportasi',
      icon: '🚗',
      color: '#3B82F6',
      description: 'BBM, ojol, transportasi umum'
    },
    'shopping': {
      name: 'Belanja',
      icon: '🛒',
      color: '#F59E0B',
      description: 'Retail, fashion, elektronik'
    },
    'health': {
      name: 'Kesehatan',
      icon: '🏥',
      color: '#10B981',
      description: 'Obat, dokter, medical'
    },
    'entertainment': {
      name: 'Hiburan',
      icon: '🎬',
      color: '#8B5CF6',
      description: 'Bioskop, game, rekreasi'
    },
    'bills': {
      name: 'Tagihan',
      icon: '⚡',
      color: '#6B7280',
      description: 'Listrik, air, internet, pulsa'
    },
    'education': {
      name: 'Pendidikan',
      icon: '📚',
      color: '#14B8A6',
      description: 'Sekolah, kursus, buku'
    },
    'other-expense': {
      name: 'Lainnya',
      icon: '📝',
      color: '#9CA3AF',
      description: 'Pengeluaran lain-lain'
    }
  };
  
  return categories[categoryId] || categories['other-expense'];
}
