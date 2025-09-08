// ================================================================
// PRODUCTION CONFIGURATION
// ================================================================
// Environment-specific settings for OCR and app features
// ================================================================

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
    enableRealTimeProcessing: true,  // Enable real-time processing
    useMockData: false,              // DISABLE mock data - use REAL OCR
    confidenceThreshold: 0.5,
    frameProcessingInterval: 500,    // Faster processing for development
    maxRetries: 2,
    timeoutMs: 5000,
  },
  performance: {
    maxConcurrentOCRTasks: 1,
    enableFrameSkipping: true,
    enableImageCompression: false,
    maxImageSize: 1024,
  },
  camera: {
    enableHighQuality: true,         // Enable high quality for better OCR
    enableStabilization: true,       // Enable stabilization
    defaultPixelFormat: 'yuv',
    compressionQuality: 0.8,
  },
  features: {
    enableRealtimeOCR: true,         // ENABLE real-time OCR
    enableAutoTransactionCreation: true,
    enableReceiptStorage: true,
    enableDebugMode: true,
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
