// ================================================================
// OCR SERVICE TEST
// ================================================================
// Simple test to verify OCR service configuration
// ================================================================

const { ocrService } = require('./utils/ocrService.ts');

async function testOCRService() {
  console.log('🧪 Testing OCR Service Configuration...');
  
  try {
    // Test configuration
    console.log('📋 OCR Service Config:');
    console.log('- Using Mock Data:', ocrService.isUsingMockData);
    console.log('- Real-time Processing:', ocrService['config'].enableRealTimeProcessing);
    console.log('- Confidence Threshold:', ocrService['config'].confidenceThreshold);
    
    // Test mock data generation
    console.log('\n🎭 Testing Mock Data Generation...');
    const mockResult = await ocrService.processImage('test-image.jpg');
    console.log('✅ Mock OCR Result:');
    console.log('- Text Length:', mockResult.text.length);
    console.log('- Confidence:', mockResult.confidence);
    console.log('- First 100 chars:', mockResult.text.substring(0, 100));
    
    console.log('\n✅ OCR Service test completed successfully!');
    
  } catch (error) {
    console.error('❌ OCR Service test failed:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  testOCRService();
}

module.exports = { testOCRService };