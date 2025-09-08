// ================================================================
// RECEIPT PARSER UNIT TESTS
// ================================================================
// Tests for Indonesian receipt parsing logic
// ================================================================

import { parseReceipt, validateParsedReceipt } from '../../utils/parseReceipt';
import type { OCRResult } from '../../utils/receiptParser.types';

describe('parseReceipt', () => {
  describe('Total Amount Extraction', () => {
    it('should extract Indonesian format amounts correctly', () => {
      const ocrResult: OCRResult = {
        text: 'INDOMARET\nTOTAL Rp 12.345,67\nTerima kasih',
        confidence: 0.9
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(12345.67);
      expect(result.data?.confidence.total).toBeGreaterThan(0.8);
    });

    it('should handle amounts without decimals', () => {
      const ocrResult: OCRResult = {
        text: 'ALFAMART\nGrand Total: Rp 25.500\nSelamat berbelanja',
        confidence: 0.85
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(25500);
    });

    it('should handle US format in Indonesian context', () => {
      const ocrResult: OCRResult = {
        text: 'SHOPEE MART\nJUMLAH: 12,345\nThank you',
        confidence: 0.8
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(12345);
    });

    it('should prioritize keyword-based amounts', () => {
      const ocrResult: OCRResult = {
        text: 'TOKO ABC\nSubtotal: Rp 5.000\nPajak: Rp 500\nTOTAL: Rp 5.500\nKembalian: Rp 4.500',
        confidence: 0.9
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(5500); // Should pick TOTAL, not the largest amount
    });
  });

  describe('Date Extraction', () => {
    it('should extract DD/MM/YYYY format', () => {
      const ocrResult: OCRResult = {
        text: 'MINIMARKET\nTanggal: 15/08/2025\nTotal: Rp 10.000',
        confidence: 0.8
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.purchaseDate).toBe('2025-08-15');
    });

    it('should extract Indonesian month names', () => {
      const ocrResult: OCRResult = {
        text: 'WARUNG MAKAN\n12 Agustus 2025\nTotal: Rp 35.000',
        confidence: 0.85
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.purchaseDate).toBe('2025-08-12');
    });

    it('should handle abbreviated month names', () => {
      const ocrResult: OCRResult = {
        text: 'CAFE LOUNGE\n25 Sep 2025\nTotal Bayar: Rp 125.000',
        confidence: 0.9
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.purchaseDate).toBe('2025-09-25');
    });

    it('should extract YYYY-MM-DD format', () => {
      const ocrResult: OCRResult = {
        text: 'SUPERMARKET\n2025-12-01\nGrand Total: Rp 87.650',
        confidence: 0.8
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.purchaseDate).toBe('2025-12-01');
    });
  });

  describe('Merchant Extraction', () => {
    it('should extract merchant from first line', () => {
      const ocrResult: OCRResult = {
        text: 'INDOMARET PEMUDA\nJl. Pemuda No. 123\nTanggal: 15/08/2025\nTotal: Rp 45.500',
        confidence: 0.9
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.merchant).toBe('INDOMARET PEMUDA');
    });

    it('should skip lines with numbers and prices', () => {
      const ocrResult: OCRResult = {
        text: '081234567890\nALFAMART\nJl. Raya No. 456\nTotal: Rp 23.000',
        confidence: 0.8
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.merchant).toBe('ALFAMART');
    });

    it('should clean up merchant name', () => {
      const ocrResult: OCRResult = {
        text: '***TOKO-SERBA-ADA***\n###CABANG JAKARTA###\nTotal: Rp 15.750',
        confidence: 0.7
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.merchant).toContain('TOKO SERBA ADA');
    });
  });

  describe('Confidence Calculation', () => {
    it('should have high confidence for complete data', () => {
      const ocrResult: OCRResult = {
        text: 'STARBUCKS COFFEE\nGRAND INDONESIA\nTanggal: 15/08/2025\nTOTAL: Rp 85.000\nTerima kasih',
        confidence: 0.95
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.confidence.overall).toBeGreaterThan(0.8);
      expect(result.data?.confidence.merchant).toBeGreaterThan(0.7);
      expect(result.data?.confidence.total).toBeGreaterThan(0.8);
      expect(result.data?.confidence.date).toBeGreaterThan(0.8);
    });

    it('should have lower confidence for incomplete data', () => {
      const ocrResult: OCRResult = {
        text: 'WARUNG\n15000',
        confidence: 0.6
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.confidence.overall).toBeLessThan(0.7);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty OCR text', () => {
      const ocrResult: OCRResult = {
        text: '',
        confidence: 0.5
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No text detected in OCR result');
    });

    it('should handle very short text', () => {
      const ocrResult: OCRResult = {
        text: 'ABC',
        confidence: 0.3
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.merchant).toBeNull();
      expect(result.data?.totalAmount).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle receipts with multiple totals', () => {
      const ocrResult: OCRResult = {
        text: 'HYPERMART\nSubtotal: Rp 50.000\nDiskon: Rp 5.000\nTOTAL BAYAR: Rp 45.000\nCash: Rp 50.000\nKembalian: Rp 5.000',
        confidence: 0.9
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(45000); // Should pick TOTAL BAYAR
    });

    it('should handle noisy OCR text', () => {
      const ocrResult: OCRResult = {
        text: 'TOKO@#$%\n123ABC789\nTanggal*: 15/08/2025\nTotal&: Rp 12.500\n@#$%^&*()',
        confidence: 0.7
      };

      const result = parseReceipt(ocrResult);

      expect(result.success).toBe(true);
      expect(result.data?.totalAmount).toBe(12500);
      expect(result.data?.purchaseDate).toBe('2025-08-15');
    });
  });
});

describe('validateParsedReceipt', () => {
  it('should pass validation for complete receipt', () => {
    const receipt = {
      merchant: 'STARBUCKS COFFEE',
      totalAmount: 85000,
      purchaseDate: '2025-08-15',
      currency: 'IDR',
      confidence: { merchant: 0.9, total: 0.95, date: 0.9, overall: 0.9 },
      rawText: 'STARBUCKS...'
    };

    const errors = validateParsedReceipt(receipt);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for missing merchant', () => {
    const receipt = {
      merchant: null,
      totalAmount: 85000,
      purchaseDate: '2025-08-15',
      currency: 'IDR',
      confidence: { merchant: 0, total: 0.95, date: 0.9, overall: 0.7 },
      rawText: 'Unknown receipt'
    };

    const errors = validateParsedReceipt(receipt);
    expect(errors).toContain('Merchant name too short or missing');
  });

  it('should fail validation for small amount', () => {
    const receipt = {
      merchant: 'MINI MART',
      totalAmount: 50, // Too small
      purchaseDate: '2025-08-15',
      currency: 'IDR',
      confidence: { merchant: 0.8, total: 0.6, date: 0.9, overall: 0.7 },
      rawText: 'MINI MART...'
    };

    const errors = validateParsedReceipt(receipt);
    expect(errors).toContain('Total amount missing or too small');
  });

  it('should fail validation for low confidence', () => {
    const receipt = {
      merchant: 'TOKO ABC',
      totalAmount: 25000,
      purchaseDate: '2025-08-15',
      currency: 'IDR',
      confidence: { merchant: 0.3, total: 0.4, date: 0.3, overall: 0.3 },
      rawText: 'Blurry text...'
    };

    const errors = validateParsedReceipt(receipt);
    expect(errors).toContain('Overall confidence too low');
  });
});
