/**
 * Indonesian Receipt OCR Parser Utility
 * Specialized for parsing Indonesian receipt text with high accuracy
 */

export interface ParsedReceiptData {
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

interface MerchantPattern {
  name: string;
  patterns: RegExp[];
  category?: string;
}

// Indonesian merchant patterns
const INDONESIAN_MERCHANTS: MerchantPattern[] = [
  {
    name: 'Alfamart',
    patterns: [/alfamart/i, /alfa\s*mart/i],
    category: 'shopping'
  },
  {
    name: 'Indomaret', 
    patterns: [/indomaret/i, /indo\s*maret/i],
    category: 'shopping'
  },
  {
    name: 'Hypermart',
    patterns: [/hypermart/i, /hyper\s*mart/i],
    category: 'shopping'
  },
  {
    name: 'Giant',
    patterns: [/giant/i],
    category: 'shopping'
  },
  {
    name: 'Carrefour',
    patterns: [/carrefour/i],
    category: 'shopping'
  },
  {
    name: 'Superindo',
    patterns: [/superindo/i, /super\s*indo/i],
    category: 'shopping'
  },
  {
    name: 'Ranch Market',
    patterns: [/ranch\s*market/i],
    category: 'shopping'
  },
  {
    name: 'Lotte Mart',
    patterns: [/lotte\s*mart/i],
    category: 'shopping'
  },
  {
    name: 'Transmart',
    patterns: [/transmart/i, /trans\s*mart/i],
    category: 'shopping'
  },
  {
    name: 'Lottemart',
    patterns: [/lottemart/i],
    category: 'shopping'
  }
];

// Indonesian month names
const INDONESIAN_MONTHS = {
  'januari': 0, 'jan': 0,
  'februari': 1, 'feb': 1,
  'maret': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'mei': 4,
  'juni': 5, 'jun': 5,
  'juli': 6, 'jul': 6,
  'agustus': 7, 'agu': 7, 'ags': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'oktober': 9, 'okt': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'desember': 11, 'des': 11, 'dec': 11
};

// Common receipt terms to ignore when finding merchant name
const RECEIPT_TERMS = [
  'struk', 'belanja', 'nota', 'receipt', 'bon', 'faktur',
  'tanggal', 'tgl', 'date', 'waktu', 'time', 'jam',
  'kasir', 'cashier', 'operator', 'server',
  'total', 'subtotal', 'sub total', 'jumlah', 'amount',
  'pajak', 'tax', 'ppn', 'service', 'layanan',
  'tunai', 'cash', 'debit', 'credit', 'kartu',
  'kembalian', 'change', 'kembali',
  'terima kasih', 'thank you', 'thanks', 'selamat',
  'datang kembali', 'visit again', 'sampai jumpa',
  'customer', 'pelanggan', 'member',
  'nomor', 'no', 'number', 'ref', 'referensi',
  'barcode', 'qr', 'code'
];

/**
 * Main function to parse Indonesian receipt text
 */
export function parseIndonesianReceipt(text: string): ParsedReceiptData {
  if (!text?.trim()) {
    return { type: 'expense', confidence: { amount: 0, title: 0, date: 0, overall: 0 } };
  }

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  // Parse each component
  const amount = parseAmount(text, lines);
  const merchant = parseMerchant(text, lines);
  const dateTime = parseDateTime(text, lines);
  const transactionType = parseTransactionType(text);
  const category = parseCategory(text, merchant.title);

  // Calculate confidence scores
  const confidence = calculateConfidence(text, {
    amount: amount.value,
    title: merchant.title,
    date: dateTime.date
  });

  return {
    amount: amount.value,
    title: merchant.title,
    date: dateTime.date,
    time: dateTime.time,
    type: transactionType,
    category: category || merchant.category,
    confidence
  };
}

/**
 * Parse amount with better accuracy for Indonesian format
 */
function parseAmount(text: string, lines: string[]): { value?: number; confidence: number } {
  const amountPatterns = [
    // Total patterns (highest priority)
    /(?:total|grand\s*total|jumlah\s*total|total\s*belanja|total\s*bayar)[\s:]*(?:rp\.?\s*)?([\d.,]+)/gi,
    /(?:total)[\s:]*(?:rp\.?\s*)?([\d.,]+)/gi,
    
    // Common amount patterns
    /(?:rp\.?\s*)([\d.,]+)/gi,
    /(?:bayar|dibayar|cash|tunai)[\s:]*(?:rp\.?\s*)?([\d.,]+)/gi,
    
    // Standalone numbers (lowest priority)
    /([\d]+[.,][\d]{3}(?:[.,][\d]{3})*(?:[.,][\d]{2})?)/g
  ];

  const amounts: { value: number; confidence: number; source: string }[] = [];

  for (let i = 0; i < amountPatterns.length; i++) {
    const pattern = amountPatterns[i];
    const matches = [...text.matchAll(pattern)];
    
    for (const match of matches) {
      const amountStr = match[1] || match[0];
      const cleanAmount = cleanAmountString(amountStr);
      const amount = parseFloat(cleanAmount);
      
      if (!isNaN(amount) && amount > 0) {
        // Higher confidence for total patterns, lower for standalone numbers
        const confidence = i === 0 ? 0.9 : i === 1 ? 0.8 : i === 2 ? 0.7 : 0.5;
        amounts.push({ 
          value: amount, 
          confidence,
          source: match[0]
        });
      }
    }
  }

  if (amounts.length === 0) {
    return { confidence: 0 };
  }

  // Sort by confidence and value (prefer larger amounts for totals)
  amounts.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence;
    }
    return b.value - a.value;
  });

  return {
    value: amounts[0].value,
    confidence: amounts[0].confidence
  };
}

/**
 * Clean amount string to parseable number
 */
function cleanAmountString(amountStr: string): string {
  return amountStr
    .replace(/rp\.?/gi, '')
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(/,/g, '.'); // Convert decimal separator
}

/**
 * Parse merchant name with Indonesian-specific logic
 */
function parseMerchant(text: string, lines: string[]): { title?: string; category?: string; confidence: number } {
  // First, try to find known Indonesian merchants
  for (const merchant of INDONESIAN_MERCHANTS) {
    for (const pattern of merchant.patterns) {
      if (pattern.test(text)) {
        return {
          title: merchant.name,
          category: merchant.category,
          confidence: 0.9
        };
      }
    }
  }

  // If no known merchant found, try to extract from text
  const skipTermsPattern = new RegExp(
    `\\b(${RECEIPT_TERMS.join('|')})\\b`,
    'gi'
  );

  // Look for merchant in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines with numbers, dates, or common receipt terms
    if (skipTermsPattern.test(line) ||
        /\d+[\/\-]\d+[\/\-]\d+/.test(line) || // dates
        /\d+:\d+/.test(line) || // times
        /rp\.?\s*\d+/i.test(line) || // amounts
        /^\d+[.,]\d+/.test(line) || // prices
        line.length < 3) {
      continue;
    }

    // Prefer uppercase lines (often store names)
    if (line === line.toUpperCase() && line.length > 3) {
      return {
        title: line,
        confidence: 0.7
      };
    }

    // Store the first valid line as backup
    if (!skipTermsPattern.test(line)) {
      return {
        title: line,
        confidence: 0.5
      };
    }
  }

  return { confidence: 0 };
}

/**
 * Parse date and time with Indonesian formats
 */
function parseDateTime(text: string, lines: string[]): { date?: Date; time?: Date } {
  const result: { date?: Date; time?: Date } = {};

  // Date patterns for Indonesian format
  const datePatterns = [
    // DD/MM/YYYY, DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // DD Month YYYY (Indonesian)
    /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|ags|sep|sept|okt|oct|nov|des|dec)\s+(\d{4})/gi,
    // YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
  ];

  // Try to find date
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === datePatterns[0]) { // DD/MM/YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        if (isValidDate(day, month, year)) {
          result.date = new Date(year, month, day);
          break;
        }
      } else if (pattern === datePatterns[1]) { // DD Month YYYY
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = INDONESIAN_MONTHS[monthName as keyof typeof INDONESIAN_MONTHS];
        if (month !== undefined && isValidDate(day, month, year)) {
          result.date = new Date(year, month, day);
          break;
        }
      } else if (pattern === datePatterns[2]) { // YYYY-MM-DD
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        if (isValidDate(day, month, year)) {
          result.date = new Date(year, month, day);
          break;
        }
      }
    }
  }

  // Try to find time
  const timePattern = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const time = new Date();
      time.setHours(hours, minutes, seconds, 0);
      result.time = time;
    }
  }

  return result;
}

/**
 * Validate date components
 */
function isValidDate(day: number, month: number, year: number): boolean {
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
    return false;
  }
  const date = new Date(year, month, day);
  return date.getFullYear() === year && 
         date.getMonth() === month && 
         date.getDate() === day;
}

/**
 * Parse transaction type
 */
function parseTransactionType(text: string): 'income' | 'expense' {
  const incomeKeywords = /(?:top\s*up|refund|deposit|saldo\s*masuk|transfer\s*masuk|pendapatan|gaji|bonus|cashback|poin|reward)/i;
  return incomeKeywords.test(text) ? 'income' : 'expense';
}

/**
 * Parse category based on merchant and content
 */
function parseCategory(text: string, merchantName?: string): string | undefined {
  const categoryPatterns = {
    'food': /(?:warung|cafe|restaurant|restoran|makan|makanan|minuman|bakery|roti|kue|snack|kedai|warung|kantin|food|beverage)/i,
    'shopping': /(?:mart|supermarket|minimarket|alfamart|indomaret|toko|belanja|shopping|store|mall|plaza|dept)/i,
    'transport': /(?:taxi|ojek|grab|gojek|uber|bensin|spbu|parkir|tol|transport|bus|kereta|pesawat|tiket)/i,
    'health': /(?:apotek|pharmacy|rumah\s*sakit|rs|klinik|dokter|obat|medical|kesehatan|health)/i,
    'entertainment': /(?:bioskop|cinema|xxi|cgv|game|internet|wifi|hiburan|entertainment|billiard|karaoke)/i,
    'bills': /(?:listrik|pln|air|pdam|telepon|telkom|internet|tv|cable|tagihan|pembayaran|bayar)/i,
    'education': /(?:sekolah|universitas|kampus|kursus|les|buku|alat\s*tulis|pendidikan|education)/i
  };

  const searchText = `${text} ${merchantName || ''}`.toLowerCase();
  
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(searchText)) {
      return category;
    }
  }
  
  return undefined;
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(text: string, data: any): {
  amount: number;
  title: number;
  date: number;
  overall: number;
} {
  const amountConfidence = data.amount ? 0.8 : 0;
  const titleConfidence = data.title ? 0.7 : 0;
  const dateConfidence = data.date ? 0.6 : 0;
  
  // Text quality factors
  const textLength = text.length;
  const linesCount = text.split('\n').filter(Boolean).length;
  const hasStructure = /(?:total|kasir|tanggal)/i.test(text);
  
  let qualityBonus = 0;
  if (textLength > 100 && linesCount > 5) qualityBonus += 0.1;
  if (hasStructure) qualityBonus += 0.1;
  
  const overall = Math.min(
    (amountConfidence + titleConfidence + dateConfidence) / 3 + qualityBonus,
    1
  );

  return {
    amount: amountConfidence,
    title: titleConfidence,
    date: dateConfidence,
    overall
  };
}
