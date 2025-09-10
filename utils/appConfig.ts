// ================================================================
// PRODUCTION CONFIGURATION
// ================================================================
// Environment-specific settings for OCR and app features
// ================================================================

import { loadEnvironment } from './envLoader';

// Ensure environment variables are loaded
loadEnvironment();

interface AppConfig {
  // OCR Configuration
  ocr: {
    enableRealTimeProcessing: boolean;
    useMockData: boolean;
    confidenceThreshold: number;
    frameProcessingInterval: number;
    maxRetries: number;
    timeoutMs: number;
  };
  
  // Performance Settings
  performance: {
    maxConcurrentOCRTasks: number;
    enableFrameSkipping: boolean;
    enableImageCompression: boolean;
    maxImageSize: number;
  };
  
  // Camera Settings
  camera: {
    enableHighQuality: boolean;
    enableStabilization: boolean;
    defaultPixelFormat: 'yuv' | 'rgb';
    compressionQuality: number;
  };
  
  // Feature Flags
  features: {
    enableRealtimeOCR: boolean;
    enableAutoTransactionCreation: boolean;
    enableReceiptStorage: boolean;
    enableDebugMode: boolean;
  };
  
  // API Configuration
  api: {
    supabaseUrl: string;
    enableOfflineMode: boolean;
    syncInterval: number;
  };
}

// Development Configuration - REAL OCR ENABLED
const developmentConfig: AppConfig = {
  ocr: {
    enableRealTimeProcessing: process.env.EXPO_PUBLIC_ENABLE_REALTIME_OCR === 'true',
    useMockData: process.env.EXPO_PUBLIC_OCR_MOCK_MODE === 'true',
    confidenceThreshold: parseFloat(process.env.EXPO_PUBLIC_OCR_CONFIDENCE_THRESHOLD || '0.5'),
    frameProcessingInterval: parseInt(process.env.EXPO_PUBLIC_OCR_PROCESSING_INTERVAL || '500'),
    maxRetries: parseInt(process.env.EXPO_PUBLIC_OCR_MAX_RETRIES || '2'),
    timeoutMs: parseInt(process.env.EXPO_PUBLIC_OCR_TIMEOUT || '5000'),
  },
  performance: {
    maxConcurrentOCRTasks: parseInt(process.env.EXPO_PUBLIC_MAX_CONCURRENT_OCR_TASKS || '1'),
    enableFrameSkipping: process.env.EXPO_PUBLIC_ENABLE_FRAME_SKIPPING === 'true',
    enableImageCompression: process.env.EXPO_PUBLIC_ENABLE_IMAGE_COMPRESSION === 'true',
    maxImageSize: parseInt(process.env.EXPO_PUBLIC_MAX_IMAGE_SIZE || '1024'),
  },
  camera: {
    enableHighQuality: process.env.EXPO_PUBLIC_CAMERA_HIGH_QUALITY === 'true',
    enableStabilization: process.env.EXPO_PUBLIC_CAMERA_STABILIZATION === 'true',
    defaultPixelFormat: (process.env.EXPO_PUBLIC_CAMERA_PIXEL_FORMAT as 'yuv' | 'rgb') || 'yuv',
    compressionQuality: parseFloat(process.env.EXPO_PUBLIC_CAMERA_COMPRESSION_QUALITY || '0.8'),
  },
  features: {
    enableRealtimeOCR: process.env.EXPO_PUBLIC_ENABLE_REALTIME_OCR === 'true',
    enableAutoTransactionCreation: process.env.EXPO_PUBLIC_ENABLE_AUTO_TRANSACTION_CREATION === 'true',
    enableReceiptStorage: process.env.EXPO_PUBLIC_ENABLE_RECEIPT_STORAGE === 'true',
    enableDebugMode: process.env.EXPO_PUBLIC_ENABLE_DEBUG_MODE === 'true',
  },
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    enableOfflineMode: true,
    syncInterval: 30000,
  },
};

// Production Configuration
const productionConfig: AppConfig = {
  ocr: {
    enableRealTimeProcessing: true,
    useMockData: false,
    confidenceThreshold: 0.7,
    frameProcessingInterval: 300,
    maxRetries: 3,
    timeoutMs: 10000,
  },
  performance: {
    maxConcurrentOCRTasks: 2,
    enableFrameSkipping: true,
    enableImageCompression: true,
    maxImageSize: 2048,
  },
  camera: {
    enableHighQuality: true,
    enableStabilization: true,
    defaultPixelFormat: 'yuv',
    compressionQuality: 0.9,
  },
  features: {
    enableRealtimeOCR: true,
    enableAutoTransactionCreation: true,
    enableReceiptStorage: true,
    enableDebugMode: false,
  },
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    enableOfflineMode: true,
    syncInterval: 60000,
  },
};

// Staging Configuration
const stagingConfig: AppConfig = {
  ...productionConfig,
  ocr: {
    ...productionConfig.ocr,
    useMockData: false,
    confidenceThreshold: 0.6,
  },
  features: {
    ...productionConfig.features,
    enableDebugMode: true,
  },
};

// Environment Detection
function getEnvironment(): 'development' | 'staging' | 'production' {
  if (__DEV__) {
    return 'development';
  }
  
  const channel = process.env.EXPO_PUBLIC_CHANNEL;
  if (channel === 'staging' || channel === 'preview') {
    return 'staging';
  }
  
  return 'production';
}

// Export current configuration
function getAppConfig(): AppConfig {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
}

export const AppConfig = getAppConfig();
export const Environment = getEnvironment();

// Configuration Helpers
export const ConfigHelpers = {
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return AppConfig.features[feature];
  },
  
  /**
   * Get OCR configuration
   */
  getOCRConfig() {
    return AppConfig.ocr;
  },
  
  /**
   * Get camera configuration
   */
  getCameraConfig() {
    return AppConfig.camera;
  },
  
  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return AppConfig.performance;
  },
  
  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return Environment === 'development';
  },
  
  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return Environment === 'production';
  },
  
  /**
   * Get debug settings
   */
  getDebugConfig() {
    return {
      enableDebugMode: AppConfig.features.enableDebugMode,
      enableLogging: Environment !== 'production',
      enableMetricsDisplay: AppConfig.features.enableDebugMode,
    };
  },
};

// Export configurations for specific modules
export const OCRConfig = AppConfig.ocr;
export const CameraConfig = AppConfig.camera;
export const PerformanceConfig = AppConfig.performance;
export const FeatureFlags = AppConfig.features;
