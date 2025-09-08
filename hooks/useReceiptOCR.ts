// ================================================================
// RECEIPT OCR HOOK
// ================================================================
// React hook for managing OCR processing and realtime scanning
// ================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  RealtimeOCRState, 
  ParsedReceipt, 
  OCRMetrics,
  OCRResult 
} from '../utils/receiptParser.types';
import { parseReceipt, validateParsedReceipt } from '../utils/parseReceipt';

export interface UseReceiptOCROptions {
  throttleMs?: number;
  stabilityThreshold?: number;
  minConfidence?: number;
  onStableResult?: (result: ParsedReceipt) => void;
  onError?: (error: string) => void;
}

export interface UseReceiptOCRReturn {
  state: RealtimeOCRState;
  metrics: OCRMetrics;
  processOCRResult: (ocrResult: OCRResult) => void;
  startScanning: () => void;
  stopScanning: () => void;
  resetState: () => void;
  getLastResult: () => ParsedReceipt | null;
}

const DEFAULT_OPTIONS: Required<UseReceiptOCROptions> = {
  throttleMs: 300,
  stabilityThreshold: 3,
  minConfidence: 0.6,
  onStableResult: () => {},
  onError: () => {}
};

export function useReceiptOCR(options: UseReceiptOCROptions = {}): UseReceiptOCRReturn {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [state, setState] = useState<RealtimeOCRState>({
    isActive: false,
    isStable: false,
    lastStableResult: null,
    frameCount: 0,
    errorMessage: null,
    status: 'detecting'
  });

  const [metrics, setMetrics] = useState<OCRMetrics>({
    avgProcessingTime: 0,
    frameProcessingRate: 0,
    successRate: 0,
    lastProcessedAt: 0,
    totalFramesProcessed: 0
  });

  // Refs for tracking
  const lastProcessTime = useRef<number>(0);
  const processingTimes = useRef<number[]>([]);
  const successfulFrames = useRef<number>(0);
  const stabilityBuffer = useRef<ParsedReceipt[]>([]);
  const lastThrottleTime = useRef<number>(0);

  /**
   * Process OCR result with throttling and stability detection
   */
  const processOCRResult = useCallback((ocrResult: OCRResult) => {
    const now = Date.now();
    
    // Throttling check
    if (now - lastThrottleTime.current < finalOptions.throttleMs) {
      return;
    }
    lastThrottleTime.current = now;

    if (!state.isActive) {
      return;
    }

    try {
      const startTime = Date.now();
      
      // Parse the OCR result
      const parseResult = parseReceipt(ocrResult);
      const processingTime = Date.now() - startTime;
      
      // Update processing metrics
      processingTimes.current.push(processingTime);
      if (processingTimes.current.length > 10) {
        processingTimes.current.shift(); // Keep only last 10 measurements
      }

      const avgProcessingTime = processingTimes.current.reduce((a, b) => a + b, 0) / processingTimes.current.length;
      
      if (parseResult.success && parseResult.data) {
        successfulFrames.current++;
        const parsedReceipt = parseResult.data;
        
        // Validate minimum confidence
        if (parsedReceipt.confidence.overall >= finalOptions.minConfidence) {
          // Add to stability buffer
          stabilityBuffer.current.push(parsedReceipt);
          if (stabilityBuffer.current.length > finalOptions.stabilityThreshold) {
            stabilityBuffer.current.shift();
          }

          // Check for stability
          const isStable = checkStability(stabilityBuffer.current);
          
          if (isStable && !state.isStable) {
            // Became stable - notify callback
            const stableResult = stabilityBuffer.current[stabilityBuffer.current.length - 1];
            finalOptions.onStableResult(stableResult);
            
            setState(prev => ({
              ...prev,
              isStable: true,
              lastStableResult: stableResult,
              status: 'stable',
              errorMessage: null
            }));
          } else if (!isStable && state.isStable) {
            // Lost stability
            setState(prev => ({
              ...prev,
              isStable: false,
              status: 'detecting'
            }));
          }
        } else {
          // Low confidence - update status
          setState(prev => ({
            ...prev,
            status: determineStatus(ocrResult, parseResult.data),
            isStable: false,
            errorMessage: parseResult.errors.join(', ') || null
          }));
        }
      } else {
        // Parsing failed
        setState(prev => ({
          ...prev,
          status: 'error',
          isStable: false,
          errorMessage: parseResult.errors.join(', ') || 'Parsing failed'
        }));
        
        finalOptions.onError(parseResult.errors.join(', ') || 'OCR processing failed');
      }

      // Update metrics
      const totalFrames = metrics.totalFramesProcessed + 1;
      const successRate = (successfulFrames.current / totalFrames) * 100;
      const frameRate = 1000 / (now - metrics.lastProcessedAt || finalOptions.throttleMs);

      setMetrics({
        avgProcessingTime,
        frameProcessingRate: frameRate,
        successRate,
        lastProcessedAt: now,
        totalFramesProcessed: totalFrames
      });

      setState(prev => ({
        ...prev,
        frameCount: prev.frameCount + 1
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OCR error';
      
      setState(prev => ({
        ...prev,
        status: 'error',
        isStable: false,
        errorMessage
      }));
      
      finalOptions.onError(errorMessage);
    }
  }, [state.isActive, state.isStable, finalOptions, metrics.lastProcessedAt, metrics.totalFramesProcessed]);

  /**
   * Start OCR scanning
   */
  const startScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      status: 'detecting',
      errorMessage: null
    }));
    
    // Reset buffers
    stabilityBuffer.current = [];
    lastThrottleTime.current = 0;
  }, []);

  /**
   * Stop OCR scanning
   */
  const stopScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      status: 'detecting'
    }));
  }, []);

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    setState({
      isActive: false,
      isStable: false,
      lastStableResult: null,
      frameCount: 0,
      errorMessage: null,
      status: 'detecting'
    });
    
    setMetrics({
      avgProcessingTime: 0,
      frameProcessingRate: 0,
      successRate: 0,
      lastProcessedAt: 0,
      totalFramesProcessed: 0
    });
    
    // Reset refs
    processingTimes.current = [];
    successfulFrames.current = 0;
    stabilityBuffer.current = [];
    lastThrottleTime.current = 0;
  }, []);

  /**
   * Get the last stable result
   */
  const getLastResult = useCallback(() => {
    return state.lastStableResult;
  }, [state.lastStableResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  return {
    state,
    metrics,
    processOCRResult,
    startScanning,
    stopScanning,
    resetState,
    getLastResult
  };
}

/**
 * Check if the results in buffer are stable (similar)
 */
function checkStability(buffer: ParsedReceipt[]): boolean {
  if (buffer.length < 2) return false;

  const latest = buffer[buffer.length - 1];
  const comparisons = buffer.slice(-3); // Compare last 3 results

  let stableCount = 0;
  
  for (const result of comparisons) {
    if (areResultsSimilar(latest, result)) {
      stableCount++;
    }
  }

  // Consider stable if majority of recent results are similar
  return stableCount >= Math.ceil(comparisons.length * 0.7);
}

/**
 * Compare two parsed receipts for similarity
 */
function areResultsSimilar(a: ParsedReceipt, b: ParsedReceipt): boolean {
  // Compare merchant (normalized)
  const merchantSimilar = normalizeText(a.merchant || '') === normalizeText(b.merchant || '');
  
  // Compare amounts (within 5% tolerance)
  const amountSimilar = a.totalAmount && b.totalAmount ? 
    Math.abs(a.totalAmount - b.totalAmount) / Math.max(a.totalAmount, b.totalAmount) < 0.05 : 
    a.totalAmount === b.totalAmount;

  // Compare dates
  const dateSimilar = a.purchaseDate === b.purchaseDate;

  // At least 2 out of 3 should match for stability
  return [merchantSimilar, amountSimilar, dateSimilar].filter(Boolean).length >= 2;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w]/g, '')
    .trim();
}

/**
 * Determine status based on OCR quality
 */
function determineStatus(ocrResult: OCRResult, parsedData: ParsedReceipt | null): RealtimeOCRState['status'] {
  // Check text quality indicators
  const textLength = ocrResult.text.length;
  const confidence = ocrResult.confidence || 0;
  
  if (textLength < 20) {
    return 'dark'; // Probably too dark to read much
  }
  
  if (confidence < 0.5) {
    return 'blurry'; // Low OCR confidence
  }
  
  if (parsedData && (!parsedData.merchant && !parsedData.totalAmount)) {
    return 'tilted'; // Text detected but can't parse meaningful data
  }
  
  return 'detecting';
}
