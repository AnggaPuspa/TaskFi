// ================================================================
// CAMERA OVERLAY COMPONENT
// ================================================================
// ROI guides, status indicators, and visual feedback
// ================================================================

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import type { RealtimeOCRState, OCRMetrics } from '../../utils/receiptParser.types';
import { LinearGradient } from 'expo-linear-gradient';

interface CameraOverlayProps {
  ocrState: RealtimeOCRState;
  metrics: OCRMetrics;
  showMetrics?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ROI dimensions (centered rectangle)
const ROI_WIDTH = screenWidth * 0.85;
const ROI_HEIGHT = screenHeight * 0.4;
const ROI_X = (screenWidth - ROI_WIDTH) / 2;
const ROI_Y = (screenHeight - ROI_HEIGHT) / 2;

export function CameraOverlay({ ocrState, metrics, showMetrics = false }: CameraOverlayProps) {
  return (
    <View style={styles.overlay}>
      {/* Dark overlay with transparent ROI */}
      <View style={styles.overlayBackground}>
        {/* Top dark area */}
        <View style={[styles.darkArea, { height: ROI_Y }]} />
        
        {/* Middle row with ROI */}
        <View style={styles.middleRow}>
          <View style={[styles.darkArea, { width: ROI_X }]} />
          <View style={styles.roiContainer}>
            <ROIGuide status={ocrState.status} isStable={ocrState.isStable} />
          </View>
          <View style={[styles.darkArea, { width: ROI_X }]} />
        </View>
        
        {/* Bottom dark area */}
        <View style={[styles.darkArea, { flex: 1 }]} />
      </View>

      {/* Status indicator */}
      <StatusIndicator ocrState={ocrState} />
      
      {/* Instructions */}
      <Instructions status={ocrState.status} />
      
      {/* Metrics (debug mode) */}
      {showMetrics && <MetricsDisplay metrics={metrics} />}
    </View>
  );
}

/**
 * ROI Guide Component
 */
function ROIGuide({ status, isStable }: { status: RealtimeOCRState['status']; isStable: boolean }) {
  const getGuideColor = () => {
    switch (status) {
      case 'stable': return '#10B981'; // Green
      case 'detecting': return '#3B82F6'; // Blue
      case 'dark': return '#EF4444'; // Red
      case 'blurry': return '#F59E0B'; // Orange
      case 'tilted': return '#8B5CF6'; // Purple
      case 'error': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const guideColor = getGuideColor();
  const strokeWidth = isStable ? 4 : 2;
  const cornerLength = 30;

  return (
    <View style={styles.roiGuide}>
      {/* Four corner brackets */}
      {/* Top Left */}
      <View style={[styles.corner, styles.topLeft]}>
        <View style={[styles.cornerLine, styles.cornerLineHorizontal, { backgroundColor: guideColor, height: strokeWidth }]} />
        <View style={[styles.cornerLine, styles.cornerLineVertical, { backgroundColor: guideColor, width: strokeWidth }]} />
      </View>
      
      {/* Top Right */}
      <View style={[styles.corner, styles.topRight]}>
        <View style={[styles.cornerLine, styles.cornerLineHorizontal, { backgroundColor: guideColor, height: strokeWidth }]} />
        <View style={[styles.cornerLine, styles.cornerLineVertical, { backgroundColor: guideColor, width: strokeWidth }]} />
      </View>
      
      {/* Bottom Left */}
      <View style={[styles.corner, styles.bottomLeft]}>
        <View style={[styles.cornerLine, styles.cornerLineHorizontal, { backgroundColor: guideColor, height: strokeWidth }]} />
        <View style={[styles.cornerLine, styles.cornerLineVertical, { backgroundColor: guideColor, width: strokeWidth }]} />
      </View>
      
      {/* Bottom Right */}
      <View style={[styles.corner, styles.bottomRight]}>
        <View style={[styles.cornerLine, styles.cornerLineHorizontal, { backgroundColor: guideColor, height: strokeWidth }]} />
        <View style={[styles.cornerLine, styles.cornerLineVertical, { backgroundColor: guideColor, width: strokeWidth }]} />
      </View>

      {/* Center guide lines */}
      <View style={[styles.centerLine, styles.centerLineHorizontal, { backgroundColor: guideColor, opacity: 0.3 }]} />
      <View style={[styles.centerLine, styles.centerLineVertical, { backgroundColor: guideColor, opacity: 0.3 }]} />
      
      {/* Pulsing effect for stable state */}
      {isStable && (
        <View style={[styles.pulseOverlay, { borderColor: guideColor }]} />
      )}
    </View>
  );
}

/**
 * Status Indicator Component
 */
function StatusIndicator({ ocrState }: { ocrState: RealtimeOCRState }) {
  const getStatusConfig = () => {
    switch (ocrState.status) {
      case 'stable':
        return { text: '✓ Stabil', color: '#10B981', bgColor: '#ECFDF5' };
      case 'detecting':
        return { text: '📷 Mendeteksi...', color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'dark':
        return { text: '🔦 Terlalu gelap', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'blurry':
        return { text: '📱 Terlalu blur', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'tilted':
        return { text: '↕️ Luruskan struk', color: '#8B5CF6', bgColor: '#F5F3FF' };
      case 'error':
        return { text: '❌ Error', color: '#EF4444', bgColor: '#FEF2F2' };
      default:
        return { text: '📷 Siap scan', color: '#6B7280', bgColor: '#F9FAFB' };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusIndicator, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
      {ocrState.frameCount > 0 && (
        <Text style={[styles.frameCount, { color: config.color }]}>
          Frame: {ocrState.frameCount}
        </Text>
      )}
    </View>
  );
}

/**
 * Instructions Component
 */
function Instructions({ status }: { status: RealtimeOCRState['status'] }) {
  const getInstructions = () => {
    switch (status) {
      case 'dark':
        return '💡 Nyalakan torch atau pindah ke tempat yang lebih terang';
      case 'blurry':
        return '🤏 Dekatkan atau jauhkan kamera, pastikan fokus';
      case 'tilted':
        return '📐 Luruskan struk agar sejajar dengan panduan';
      case 'error':
        return '🔄 Coba ambil foto manual jika realtime gagal';
      case 'stable':
        return '✨ Hasil terdeteksi! Ketuk untuk konfirmasi';
      case 'detecting':
        return '🔍 Sedang mendeteksi teks pada struk...';
      default:
        return '🎯 Arahkan kamera ke struk dalam area panduan';
    }
  };

  // Debug logging in development
  if (__DEV__) {
    console.log('📱 Camera overlay status:', status);
  }

  return (
    <View style={styles.instructionsContainer}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.instructionsBackground}
      >
        <Text style={styles.instructionsText}>
          {getInstructions()}
        </Text>
      </LinearGradient>
    </View>
  );
}

/**
 * Metrics Display (Debug)
 */
function MetricsDisplay({ metrics }: { metrics: OCRMetrics }) {
  return (
    <View style={styles.metricsContainer}>
      <Text style={styles.metricsText}>
        FPS: {metrics.frameProcessingRate.toFixed(1)} | 
        Avg: {metrics.avgProcessingTime.toFixed(0)}ms | 
        Success: {metrics.successRate.toFixed(0)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlayBackground: {
    flex: 1,
  },
  darkArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleRow: {
    flexDirection: 'row',
    height: ROI_HEIGHT,
  },
  roiContainer: {
    width: ROI_WIDTH,
    height: ROI_HEIGHT,
  },
  roiGuide: {
    flex: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerLine: {
    position: 'absolute',
  },
  cornerLineHorizontal: {
    width: 30,
    height: 2,
  },
  cornerLineVertical: {
    width: 2,
    height: 30,
  },
  centerLine: {
    position: 'absolute',
  },
  centerLineHorizontal: {
    top: '50%',
    left: '25%',
    right: '25%',
    height: 1,
  },
  centerLineVertical: {
    left: '50%',
    top: '25%',
    bottom: '25%',
    width: 1,
  },
  pulseOverlay: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.6,
  },
  statusIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  frameCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  instructionsBackground: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  metricsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metricsText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export { ROI_WIDTH, ROI_HEIGHT, ROI_X, ROI_Y };
