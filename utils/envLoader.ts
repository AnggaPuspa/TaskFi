// ================================================================
// ENVIRONMENT LOADER
// ================================================================
// Ensures environment variables are properly loaded
// ================================================================

import 'dotenv/config';

// Load environment variables based on NODE_ENV
const loadEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    require('dotenv').config({ path: '.env.development' });
  } else if (env === 'staging') {
    require('dotenv').config({ path: '.env.staging' });
  } else if (env === 'production') {
    require('dotenv').config({ path: '.env.production' });
  }
  
  // Log loaded environment variables in development
  if (env === 'development') {
    console.log('🔧 Environment loaded:', env);
    console.log('📱 OCR Mock Mode:', process.env.EXPO_PUBLIC_OCR_MOCK_MODE);
    console.log('🎯 Real-time OCR:', process.env.EXPO_PUBLIC_ENABLE_REALTIME_OCR);
    console.log('📷 Camera High Quality:', process.env.EXPO_PUBLIC_CAMERA_HIGH_QUALITY);
  }
};

// Initialize environment loading
loadEnvironment();

export { loadEnvironment };