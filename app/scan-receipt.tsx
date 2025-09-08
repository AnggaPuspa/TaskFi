// ================================================================
// REALTIME OCR SCANNER SCREEN
// ================================================================
// Main route screen for OCR scanning functionality
// ================================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RealtimeReceiptScanner } from '../components/RealtimeReceiptScanner';
import type { ParsedReceipt } from '../utils/receiptParser.types';

export default function ScanReceiptScreen() {
  /**
   * Handle successful scan completion
   */
  const handleScanComplete = (result: ParsedReceipt) => {
    console.log('Scan completed successfully:', {
      merchant: result.merchant,
      amount: result.totalAmount,
      date: result.purchaseDate,
      confidence: result.confidence.overall
    });
  };

  /**
   * Handle scan cancellation
   */
  const handleCancel = () => {
    console.log('Scan cancelled by user');
  };

  return (
    <View style={styles.container}>
      <RealtimeReceiptScanner
        onScanComplete={handleScanComplete}
        onCancel={handleCancel}
        debugMode={__DEV__} // Show debug metrics in development
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
