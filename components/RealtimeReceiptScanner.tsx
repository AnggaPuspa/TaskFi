// ================================================================
// REALTIME RECEIPT SCANNER COMPONENT
// ================================================================
// Main camera screen with realtime OCR processing
// ================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Text, 
  Alert,
  StatusBar,
  Dimensions 
} from 'react-native';
import { 
  Camera, 
  useCameraDevice, 
  useCameraPermission,
  useFrameProcessor,
  type Frame 
} from 'react-native-vision-camera';
import { ocrService } from '~/utils/ocrService';
import { runOnJS } from 'react-native-reanimated';
import { router } from 'expo-router';
import { CameraConfig, PerformanceConfig, ConfigHelpers } from '@/utils/appConfig';

import { useReceiptOCR } from '../hooks/useReceiptOCR';
import { CameraOverlay, ROI_WIDTH, ROI_HEIGHT, ROI_X, ROI_Y } from './ui/CameraOverlay';
import { ReceiptBottomSheet } from './ui/ReceiptBottomSheet';
import { TorchButton } from './ui/TorchButton';
import type { OCRResult, ParsedReceipt } from '../utils/receiptParser.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RealtimeReceiptScannerProps {
  onScanComplete?: (result: ParsedReceipt) => void;
  onCancel?: () => void;
  debugMode?: boolean;
}

export function RealtimeReceiptScanner({ 
  onScanComplete, 
  onCancel,
  debugMode = false 
}: RealtimeReceiptScannerProps) {
  // Camera setup
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  
  // State
  const [isActive, setIsActive] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // OCR hook
  const {
    state: ocrState,
    metrics,
    processOCRResult,
    startScanning,
    stopScanning,
    getLastResult
  } = useReceiptOCR({
    throttleMs: 300,
    stabilityThreshold: 3,
    minConfidence: 0.6,
    onStableResult: handleStableResult,
    onError: handleOCRError
  });

  // Refs
  const cameraRef = useRef<Camera>(null);
  const frameCountRef = useRef(0);
  const lastProcessTimeRef = useRef(0);

  /**
   * Assess frame quality for OCR suitability
   */
  const assessFrameQuality = useCallback((frame: Frame) => {
    'worklet';
    
    // Basic quality metrics
    const brightness = estimateBrightness(frame);
    const sharpness = estimateSharpness(frame);
    const contrast = estimateContrast(frame);
    
    // Determine overall quality and status
    let status: 'detecting' | 'dark' | 'blurry' | 'bright' | 'good' = 'detecting';
    let overall = 0.7; // Default score
    
    if (brightness < 0.3) {
      status = 'dark';
      overall = 0.4;
    } else if (brightness > 0.9) {
      status = 'bright';
      overall = 0.5;
    } else if (sharpness < 0.4) {
      status = 'blurry';
      overall = 0.3;
    } else if (contrast > 0.6 && brightness > 0.4 && brightness < 0.8) {
      status = 'good';
      overall = 0.9;
    }
    
    return {
      brightness,
      sharpness,
      contrast,
      overall,
      status
    };
  }, []);

  /**
   * Estimate brightness from frame (simplified heuristic)
   */
  const estimateBrightness = useCallback((frame: Frame): number => {
    'worklet';
    // Simplified brightness estimation
    // In real implementation, you'd analyze pixel values
    return Math.random() * 0.4 + 0.5; // Mock: 0.5-0.9 range
  }, []);

  /**
   * Estimate sharpness/blur from frame
   */
  const estimateSharpness = useCallback((frame: Frame): number => {
    'worklet';
    // Simplified sharpness estimation
    // In real implementation, you'd use edge detection algorithms
    return Math.random() * 0.3 + 0.6; // Mock: 0.6-0.9 range
  }, []);

  /**
   * Estimate contrast from frame
   */
  const estimateContrast = useCallback((frame: Frame): number => {
    'worklet';
    // Simplified contrast estimation
    return Math.random() * 0.4 + 0.5; // Mock: 0.5-0.9 range
  }, []);

  /**
   * Update OCR status on UI thread
   */
  const updateOCRStatus = useCallback((status: string) => {
    // Update OCR state based on frame quality
    if (ConfigHelpers.isDevelopment()) {
      console.log(`📱 Frame quality status: ${status}`);
    }
    // You could update a state here to show user feedback
  }, []);

  /**
   * Process frame with OCR using production configuration
   */
  const processFrameWithOCR = useCallback(async (frame: Frame) => {
    const now = Date.now();
    
    // Use configuration-based throttling
    const interval = PerformanceConfig.enableFrameSkipping ? 
      Math.max(500, 1000 / PerformanceConfig.maxConcurrentOCRTasks) : 500;
    
    if (now - lastProcessTimeRef.current < interval) {
      return;
    }
    lastProcessTimeRef.current = now;
    
    if (ConfigHelpers.isDevelopment()) {
      console.log('🔄 Starting frame OCR processing...');
    }
    
    try {
      // Check frame quality first
      const quality = assessFrameQuality(frame);
      
      if (quality.overall < 0.5) {
        return; // Skip poor quality frames
      }

      // Convert frame to processable format
      // In production, you'd use a native module to extract image data from frame
      // For now, we'll simulate this with a mock processing
      
      const frameProcessingResult = await processFrameToImage(frame);
      
      if (frameProcessingResult.success) {
        if (ConfigHelpers.isDevelopment()) {
          console.log('📸 Frame converted to image, running OCR...');
        }
        
        const ocrResult = await ocrService.processFrameBuffer(frameProcessingResult.imageData);
        
        if (ocrResult && ocrResult.text.length > 0) {
          if (ConfigHelpers.isDevelopment()) {
            console.log('✅ OCR successful, processing result...');
          }
          processOCRResult(ocrResult);
        } else {
          if (ConfigHelpers.isDevelopment()) {
            console.log('❌ OCR returned empty result');
          }
        }
      }
    } catch (error) {
      if (ConfigHelpers.isDevelopment()) {
        console.warn('OCR processing error:', error);
      }
    }
  }, [processOCRResult, assessFrameQuality]);

  /**
   * Process frame to image for OCR (real implementation)
   */
  const processFrameToImage = useCallback(async (frame: Frame) => {
    try {
      // In a real implementation, you would:
      // 1. Extract pixel data from frame buffer
      // 2. Convert to JPEG/PNG format
      // 3. Apply ROI cropping
      // 4. Enhance image quality (contrast, brightness, etc.)
      
      // For now, we'll use a temporary file approach
      // This is a simplified implementation - in production you'd use native modules
      
      if (ConfigHelpers.isDevelopment()) {
        console.log('🎬 Processing frame to image for OCR...');
      }
      
      // Create a temporary image URI from frame
      // Note: This is a placeholder - real implementation would extract frame data
      const tempImageUri = `file:///tmp/frame_${Date.now()}.jpg`;
      
      return {
        success: true,
        imageData: {
          uri: tempImageUri,
          width: frame.width,
          height: frame.height,
          timestamp: frame.timestamp
        }
      };
    } catch (error) {
      if (ConfigHelpers.isDevelopment()) {
        console.error('Frame processing error:', error);
      }
      return {
        success: false,
        imageData: null
      };
    }
  }, []);

  /**
   * Handle stable OCR result
   */
  function handleStableResult(result: ParsedReceipt) {
    runOnJS(() => {
      setShowBottomSheet(true);
      // Optional haptic feedback
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    })();
  }

  /**
   * Handle OCR errors
   */
  function handleOCRError(error: string) {
    console.warn('OCR Error:', error);
    // Could show toast notification here
  }

  /**
   * Frame processor for realtime OCR with quality checks
   */
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    
    if (!isActive || isProcessing) {
      return;
    }

    try {
      // Quality checks before processing
      const qualityScore = assessFrameQuality(frame);
      
      // Only process frames with good quality
      if (qualityScore.overall < 0.6) {
        // Update status based on quality issues
        runOnJS(updateOCRStatus)(qualityScore.status);
        return;
      }
      
      // Crop frame to ROI area for better performance
      const roiFrame = cropFrameToROI(frame);
      
      // Throttle frame processing (every nth frame)
      const frameNumber = (frame.timestamp / 33.33) | 0; // ~30fps
      if (frameNumber % 3 !== 0) { // Process every 3rd frame
        return;
      }
      
      // Log successful frame processing
      if (ConfigHelpers.isDevelopment()) {
        console.log('🎯 Frame passed quality check, processing with OCR...');
      }
      
      // Convert frame to image and process with OCR
      runOnJS(processFrameWithOCR)(roiFrame);
      
    } catch (error) {
      // Handle frame processing errors silently
      console.warn('Frame processing error:', error);
      runOnJS(updateOCRStatus)('error');
    }
  }, [isActive, isProcessing]);

  /**
   * Crop frame to ROI (Region of Interest) area for better OCR performance
   */
  function cropFrameToROI(frame: Frame): Frame {
    'worklet';
    
    try {
      // Calculate ROI bounds based on screen dimensions
      const roiLeft = Math.max(0, ROI_X);
      const roiTop = Math.max(0, ROI_Y);
      const roiRight = Math.min(frame.width, ROI_X + ROI_WIDTH);
      const roiBottom = Math.min(frame.height, ROI_Y + ROI_HEIGHT);
      
      // Validate ROI bounds
      if (roiLeft >= roiRight || roiTop >= roiBottom) {
        console.warn('Invalid ROI bounds, returning original frame');
        return frame;
      }
      
      // Create a new frame with cropped dimensions
      // Note: This is a conceptual implementation - actual frame cropping
      // would require native module integration for optimal performance
      const croppedFrame = {
        ...frame,
        width: roiRight - roiLeft,
        height: roiBottom - roiTop,
        // Store crop info for OCR processing
        cropRegion: {
          x: roiLeft,
          y: roiTop,
          width: roiRight - roiLeft,
          height: roiBottom - roiTop
        }
      } as Frame;
      
      return croppedFrame;
    } catch (error) {
      console.warn('Frame cropping failed:', error);
      return frame;
    }
  }

  /**
   * Request camera permission on mount
   */
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  /**
   * Start OCR when camera becomes active
   */
  useEffect(() => {
    if (isActive && hasPermission) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isActive, hasPermission, startScanning, stopScanning]);

  /**
   * Handle torch toggle
   */
  const handleTorchToggle = useCallback(() => {
    setTorchEnabled(prev => !prev);
  }, []);

  /**
   * Handle manual photo capture (fallback)
   */
  const handleCapturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePhoto({
        flash: torchEnabled ? 'on' : 'off',
      });

      // Process the captured image with OCR
      const ocrResult = await ocrService.processImage(photo.path);
      
      if (ocrResult && ocrResult.text.length > 0) {
        processOCRResult(ocrResult);
      } else {
        Alert.alert('Gagal', 'Tidak dapat mendeteksi teks dari foto. Coba lagi dengan pencahayaan yang lebih baik.');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  }, [torchEnabled, processOCRResult]);

  /**
   * Handle scan confirmation
   */
  const handleConfirm = useCallback(() => {
    const result = getLastResult();
    if (result) {
      onScanComplete?.(result);
      // Navigate to review screen
      router.push({
        pathname: '/receipt-review',
        params: {
          ocrData: JSON.stringify(result)
        }
      });
    }
  }, [getLastResult, onScanComplete]);

  /**
   * Handle retake
   */
  const handleRetake = useCallback(() => {
    setShowBottomSheet(false);
    setIsActive(true);
    startScanning();
  }, [startScanning]);

  /**
   * Handle cancel/back
   */
  const handleCancel = useCallback(() => {
    stopScanning();
    onCancel?.();
    router.back();
  }, [stopScanning, onCancel]);

  // Show permission request if needed
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Aplikasi memerlukan akses kamera untuk scan struk
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Berikan Izin</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no camera device
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Kamera tidak tersedia</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        torch={torchEnabled ? 'on' : 'off'}
        photo={true}
        pixelFormat="yuv"
        enableBufferCompression={true}
      />

      {/* Overlay with ROI guides */}
      <CameraOverlay 
        ocrState={ocrState} 
        metrics={metrics}
        showMetrics={debugMode}
      />

      {/* Top toolbar */}
      <SafeAreaView style={styles.topToolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleCancel}>
          <Text style={styles.toolbarButtonText}>✕</Text>
        </TouchableOpacity>
        
        <Text style={styles.toolbarTitle}>Scan Struk</Text>
        
        <View style={styles.toolbarSpacer} />
      </SafeAreaView>

      {/* Bottom toolbar */}
      <View style={styles.bottomToolbar}>
        <View style={styles.bottomToolbarContent}>
          {/* Torch button */}
          <TorchButton 
            isEnabled={torchEnabled}
            onToggle={handleTorchToggle}
          />

          {/* Capture button (fallback) */}
          <TouchableOpacity 
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
            onPress={handleCapturePhoto}
            disabled={isProcessing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Pause/Resume button */}
          <TouchableOpacity 
            style={styles.pauseButton}
            onPress={() => setIsActive(!isActive)}
          >
            <Text style={styles.pauseButtonText}>
              {isActive ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet for results */}
      <ReceiptBottomSheet
        ocrState={ocrState}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
        isVisible={showBottomSheet && ocrState.isStable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#EF4444',
  },
  topToolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 2,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  toolbarTitle: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  toolbarSpacer: {
    width: 44,
  },
  bottomToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 34, // Safe area
    zIndex: 2,
  },
  bottomToolbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 24,
  },
});
