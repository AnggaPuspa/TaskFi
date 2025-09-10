// ================================================================
// REALTIME OCR SCANNER SCREEN
// ================================================================
// Main route screen for OCR scanning functionality
// ================================================================

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { RealtimeReceiptScanner } from '../components/RealtimeReceiptScanner';
import { OCRTestComponent } from '../components/OCRTestComponent';
import type { ParsedReceipt } from '../utils/receiptParser.types';

export default function ScanReceiptScreen() {
  const [showTestComponent, setShowTestComponent] = useState(__DEV__);

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

  if (showTestComponent) {
    return (
      <ScrollView style={styles.container}>
        <OCRTestComponent />
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setShowTestComponent(false)}
          >
            <Text style={styles.buttonText}>Go to Camera Scanner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

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
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
