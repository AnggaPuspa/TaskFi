# 📱 Realtime OCR Implementation Plan

## 📦 Required Packages & Justification

### 1. Camera & OCR Core
```bash
# Vision Camera (JSI-based, high performance)
npm install react-native-vision-camera

# OCR Plugins (on-device, free)
npm install @react-native-ml-kit/text-recognition  # Android ML Kit
npm install vision-camera-text-recognition         # iOS/Android alternative

# Frame Processor (for realtime processing)
npm install react-native-worklets-core react-native-reanimated
```

### 2. Justification
- **react-native-vision-camera**: Industry standard, JSI-based, supports frame processors
- **@react-native-ml-kit/text-recognition**: Google ML Kit on-device, free, accurate for Indonesian text
- **vision-camera-text-recognition**: Alternative plugin supporting both platforms
- **react-native-worklets-core**: Required for frame processors (real-time processing)

## 🏗️ Architecture Overview

```
├── RealtimeReceiptScanner.tsx    # Main camera screen with overlay
├── ReceiptReviewScreen.tsx       # Review & edit before save
├── parseReceipt.ts              # Domain-specific parsing logic
├── receiptParser.types.ts       # TypeScript definitions
├── hooks/useReceiptOCR.ts       # OCR processing hook
├── components/
│   ├── CameraOverlay.tsx        # ROI guides + status
│   ├── ReceiptBottomSheet.tsx   # Live preview results
│   └── TorchButton.tsx          # Camera controls
└── supabase/
    ├── receipts-migration.sql   # Database schema
    └── receipts-helpers.ts      # Supabase integration
```

## 🎯 Performance Targets
- **Frame Processing**: 2-3 FPS (process every 300-500ms)
- **OCR Latency**: ≤ 120ms per frame
- **Memory Usage**: < 100MB additional
- **CPU Usage**: < 30% on mid-range devices

## 📱 Platform Support
- **Primary**: Android (API 24+, ML Kit)
- **Secondary**: iOS (Vision framework)
- **Fallback**: Still image capture + OCR

## 🔒 Privacy & Security
- ✅ All OCR processing on-device
- ✅ No cloud services used
- ✅ Photos only saved if user consents
- ✅ Supabase RLS protects user data
