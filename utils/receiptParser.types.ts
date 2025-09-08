// ================================================================
// RECEIPT PARSING TYPES
// ================================================================
// TypeScript definitions for OCR and receipt parsing
// ================================================================

export interface OCRResult {
  text: string;
  confidence?: number;
  blocks?: OCRTextBlock[];
}

export interface OCRTextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedReceipt {
  merchant: string | null;
  totalAmount: number | null;
  purchaseDate: string | null; // ISO date string
  currency: string;
  confidence: {
    merchant: number;
    total: number;
    date: number;
    overall: number;
  };
  rawText: string;
}

export interface ReceiptParsingResult {
  success: boolean;
  data: ParsedReceipt | null;
  errors: string[];
  processingTimeMs: number;
}

// Configuration for parsing behavior
export interface ParsingConfig {
  minConfidence: number;
  maxMerchantLength: number;
  dateFormats: string[];
  currencySymbols: string[];
  totalKeywords: string[];
}

// Real-time OCR state
export interface RealtimeOCRState {
  isActive: boolean;
  isStable: boolean;
  lastStableResult: ParsedReceipt | null;
  frameCount: number;
  errorMessage: string | null;
  status: 'detecting' | 'stable' | 'dark' | 'blurry' | 'tilted' | 'error';
}

// Camera permissions state
export interface CameraPermissionState {
  hasPermission: boolean | null;
  isRequesting: boolean;
  error: string | null;
}

// OCR performance metrics
export interface OCRMetrics {
  avgProcessingTime: number;
  frameProcessingRate: number;
  successRate: number;
  lastProcessedAt: number;
  totalFramesProcessed: number;
}
