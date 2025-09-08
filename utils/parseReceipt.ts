// ================================================================
// INDONESIAN RECEIPT PARSER
// ================================================================
// Domain-specific parsing logic for Indonesian receipts
// Handles Total, Date, and Merchant extraction
// ================================================================

import type { 
  OCRResult, 
  ParsedReceipt, 
  ReceiptParsingResult, 
  ParsingConfig 
} from './receiptParser.types';

// Default configuration for Indonesian receipts
const DEFAULT_CONFIG: ParsingConfig = {
  minConfidence: 0.6,
  maxMerchantLength: 80,
  dateFormats: [
    'DD/MM/YYYY',
    'DD-MM-YYYY', 
    'YYYY-MM-DD',
    'DD MMM YYYY'
  ],
  currencySymbols: ['Rp', 'IDR', 'RUPIAH'],
  totalKeywords: [
    'TOTAL',
    'Grand Total',
    'GRAND TOTAL', 
    'JUMLAH',
    'TAGIHAN',
    'SUBTOTAL',
    'PEMBAYARAN'
  ]
};

// Indonesian month names mapping
const INDONESIAN_MONTHS: Record<string, number> = {
  'JANUARI': 1, 'JAN': 1,
  'FEBRUARI': 2, 'FEB': 2,
  'MARET': 3, 'MAR': 3,
  'APRIL': 4, 'APR': 4,
  'MEI': 5,
  'JUNI': 6, 'JUN': 6,
  'JULI': 7, 'JUL': 7,
  'AGUSTUS': 8, 'AGU': 8,
  'SEPTEMBER': 9, 'SEP': 9,
  'OKTOBER': 10, 'OKT': 10,
  'NOVEMBER': 11, 'NOV': 11,
  'DESEMBER': 12, 'DES': 12
};

/**
 * Main parsing function for Indonesian receipts
 */
export function parseReceipt(
  ocrResult: OCRResult, 
  config: Partial<ParsingConfig> = {}
): ReceiptParsingResult {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];

  try {
    const lines = ocrResult.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      errors.push('No text detected in OCR result');
      return {
        success: false,
        data: null,
        errors,
        processingTimeMs: Date.now() - startTime
      };
    }

    // Extract components
    const merchant = extractMerchant(lines, finalConfig);
    const totalAmount = extractTotalAmount(lines, finalConfig);
    const purchaseDate = extractPurchaseDate(lines);

    // Calculate confidence scores
    const confidence = calculateConfidence(
      { 
        merchant: merchant.value, 
        totalAmount: totalAmount.value, 
        purchaseDate: purchaseDate.value 
      },
      ocrResult.confidence || 0.8
    );

    const parsedReceipt: ParsedReceipt = {
      merchant: merchant.value,
      totalAmount: totalAmount.value,
      purchaseDate: purchaseDate.value,
      currency: 'IDR',
      confidence,
      rawText: ocrResult.text
    };

    return {
      success: true,
      data: parsedReceipt,
      errors,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      data: null,
      errors,
      processingTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Extract merchant name from receipt text
 */
function extractMerchant(
  lines: string[], 
  config: ParsingConfig
): { value: string | null; confidence: number } {
  // Look for merchant in first 2-3 lines (skip obvious non-merchant text)
  const candidateLines = lines
    .slice(0, 3)
    .filter(line => {
      const upper = line.toUpperCase();
      // Skip lines with numbers, prices, or common receipt words
      return !(/\d{2,}/.test(line) || 
               /RP|IDR|TOTAL|TANGGAL|JAM|KASIR/.test(upper) ||
               line.length < 3);
    });

  if (candidateLines.length === 0) {
    return { value: null, confidence: 0 };
  }

  // Take the first valid candidate as merchant
  let merchant = candidateLines[0];
  
  // Clean up merchant name
  merchant = merchant
    .replace(/[^\w\s]/g, ' ') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .substring(0, config.maxMerchantLength);

  const confidence = merchant.length > 3 ? 0.8 : 0.4;
  
  return { 
    value: merchant || null, 
    confidence 
  };
}

/**
 * Extract total amount from receipt text
 */
function extractTotalAmount(
  lines: string[], 
  config: ParsingConfig
): { value: number | null; confidence: number } {
  let bestAmount: number | null = null;
  let bestConfidence = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Check if line contains total keywords
    const hasKeyword = config.totalKeywords.some(keyword => 
      upperLine.includes(keyword)
    );

    if (hasKeyword) {
      // Look for amount in this line and next line
      const searchLines = [line, lines[i + 1]].filter(Boolean);
      
      for (const searchLine of searchLines) {
        const amount = extractAmountFromLine(searchLine);
        if (amount !== null) {
          const confidence = hasKeyword ? 0.9 : 0.6;
          if (confidence > bestConfidence) {
            bestAmount = amount;
            bestConfidence = confidence;
          }
        }
      }
    }
  }

  // If no keyword found, look for largest amount in receipt
  if (bestAmount === null) {
    let largestAmount = 0;
    
    for (const line of lines) {
      const amount = extractAmountFromLine(line);
      if (amount !== null && amount > largestAmount) {
        largestAmount = amount;
        bestConfidence = 0.5; // Lower confidence without keyword
      }
    }
    
    if (largestAmount > 0) {
      bestAmount = largestAmount;
    }
  }

  return { value: bestAmount, confidence: bestConfidence };
}

/**
 * Extract numeric amount from a line of text
 */
function extractAmountFromLine(line: string): number | null {
  // Remove currency symbols and clean text
  let cleanLine = line
    .replace(/RP|IDR|RUPIAH/gi, '')
    .replace(/[^\d.,\s]/g, ' ')
    .trim();

  // Indonesian format: Rp 12.345,67 (dots for thousands, comma for decimal)
  // Also handle: 12,345 (US style in some Indonesian receipts)
  
  const patterns = [
    // Indonesian: 12.345,67 or 12.345
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/,
    // US style: 12,345.67 or 12345
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    // Simple numbers: 12345
    /(\d{3,})/
  ];

  for (const pattern of patterns) {
    const match = cleanLine.match(pattern);
    if (match) {
      const amountStr = match[1];
      
      // Parse Indonesian format (dots = thousands, comma = decimal)
      if (amountStr.includes('.') && amountStr.includes(',')) {
        const parts = amountStr.split(',');
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1];
        return parseFloat(`${integerPart}.${decimalPart}`);
      }
      
      // Parse format with only dots (thousands separator)
      if (amountStr.includes('.') && !amountStr.includes(',')) {
        const number = parseFloat(amountStr.replace(/\./g, ''));
        return number;
      }
      
      // Parse US format (commas = thousands, dot = decimal)
      if (amountStr.includes(',') && amountStr.includes('.')) {
        const number = parseFloat(amountStr.replace(/,/g, ''));
        return number;
      }
      
      // Simple number
      const number = parseFloat(amountStr);
      if (!isNaN(number) && number >= 100) { // Minimum reasonable amount
        return number;
      }
    }
  }

  return null;
}

/**
 * Extract purchase date from receipt text
 */
function extractPurchaseDate(lines: string[]): { value: string | null; confidence: number } {
  const today = new Date();
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // Skip if line doesn't seem date-related
    if (!(/TANGGAL|TGL|DATE|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(upperLine))) {
      continue;
    }

    // Extract date patterns
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // DD/MM/YY or DD-MM-YY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      // DD MMM YYYY (e.g., 12 AGU 2025)
      /(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})/,
      // YYYY-MM-DD
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
    ];

    for (let i = 0; i < datePatterns.length; i++) {
      const pattern = datePatterns[i];
      const match = line.match(pattern);
      
      if (match) {
        let day: number, month: number, year: number;
        
        if (i === 0 || i === 1) { // DD/MM/YYYY or DD/MM/YY
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
          if (year < 100) year += 2000; // Convert YY to YYYY
        } else if (i === 2) { // DD MMM YYYY
          day = parseInt(match[1]);
          const monthName = match[2].toUpperCase();
          month = INDONESIAN_MONTHS[monthName] || 0;
          year = parseInt(match[3]);
        } else { // YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        }

        // Validate date
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= today.getFullYear() + 1) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          return { value: dateStr, confidence: 0.85 };
        }
      }
    }
  }

  return { value: null, confidence: 0 };
}

/**
 * Calculate overall confidence scores
 */
function calculateConfidence(
  parsed: { merchant: string | null; totalAmount: number | null; purchaseDate: string | null },
  ocrConfidence: number
): ParsedReceipt['confidence'] {
  const merchantConf = parsed.merchant ? 0.8 : 0;
  const totalConf = parsed.totalAmount ? 0.9 : 0;
  const dateConf = parsed.purchaseDate ? 0.85 : 0;
  
  const overall = (merchantConf + totalConf + dateConf + ocrConfidence) / 4;

  return {
    merchant: merchantConf,
    total: totalConf,
    date: dateConf,
    overall: Math.min(overall, 1.0)
  };
}

/**
 * Validate parsed receipt data
 */
export function validateParsedReceipt(receipt: ParsedReceipt): string[] {
  const errors: string[] = [];

  if (!receipt.merchant || receipt.merchant.length < 3) {
    errors.push('Merchant name too short or missing');
  }

  if (!receipt.totalAmount || receipt.totalAmount < 100) {
    errors.push('Total amount missing or too small');
  }

  if (!receipt.purchaseDate) {
    errors.push('Purchase date missing');
  }

  if (receipt.confidence.overall < 0.5) {
    errors.push('Overall confidence too low');
  }

  return errors;
}
