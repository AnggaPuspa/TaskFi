// ================================================================
// OCR TEST COMPONENT
// ================================================================
// Simple component to test OCR functionality
// ================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ocrService } from '../utils/ocrService';
import { parseReceipt } from '../utils/parseReceipt';

export function OCRTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const testOCR = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing OCR Service...');
      
      // Test with a mock image URI
      const testImageUri = 'test-image.jpg';
      const ocrResult = await ocrService.processImage(testImageUri);
      
      console.log('📝 OCR Result:', ocrResult);
      
      // Parse the result
      const parseResult = parseReceipt(ocrResult);
      
      if (parseResult.success && parseResult.data) {
        const receipt = parseResult.data;
        setResult(`
✅ OCR Test Successful!

📄 Raw Text: ${ocrResult.text.substring(0, 100)}...

🏪 Merchant: ${receipt.merchant || 'Not detected'}
💰 Total: ${receipt.totalAmount ? `Rp ${receipt.totalAmount.toLocaleString('id-ID')}` : 'Not detected'}
📅 Date: ${receipt.purchaseDate || 'Not detected'}

🎯 Confidence: ${Math.round((receipt.confidence.overall || 0) * 100)}%
        `);
      } else {
        setResult(`❌ OCR Test Failed: ${parseResult.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error('OCR Test Error:', error);
      setResult(`❌ OCR Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OCR Test Component</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testOCR}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test OCR Service'}
        </Text>
      </TouchableOpacity>
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📱 Mock Mode: {ocrService.isUsingMockData ? 'Enabled' : 'Disabled'}
        </Text>
        <Text style={styles.infoText}>
          🔧 Real-time: {ocrService['config'].enableRealTimeProcessing ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
});