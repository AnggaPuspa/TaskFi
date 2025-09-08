# 🧾 Realtime OCR Receipt Scanner

Fitur scanning struk realtime menggunakan on-device OCR untuk aplikasi TaskFi. Mengintegrasikan react-native-vision-camera dengan ML Kit untuk deteksi teks realtime dan parsing data struk Indonesia.

## 🚀 Fitur Utama

### ✨ Realtime Scanning
- **Live OCR Processing**: Deteksi teks realtime dengan throttling 300ms
- **ROI (Region of Interest)**: Fokus processing hanya pada area tengah kamera
- **Stability Detection**: Tunggu hingga hasil stabil sebelum konfirmasi
- **Visual Feedback**: Indikator status dan panduan pengguna realtime

### 🎯 Indonesian Receipt Parsing
- **Total Amount**: Deteksi format Rupiah (Rp 12.345,67)
- **Purchase Date**: Support DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
- **Merchant Name**: Ekstraksi nama toko dari baris pertama
- **Smart Parsing**: Prioritas keyword "TOTAL", "Grand Total", "JUMLAH"

### 📱 User Experience
- **Camera Controls**: Torch toggle, tap-to-focus, pause/resume
- **Bottom Sheet**: Preview hasil live dengan confidence scores
- **Review Screen**: Edit dan konfirmasi sebelum simpan
- **Fallback Mode**: Still image capture jika realtime gagal

### 🔐 Privacy & Security
- **100% On-Device**: Semua OCR processing lokal, tidak ada cloud
- **Optional Storage**: Foto hanya disimpan jika user setuju
- **Supabase RLS**: Row Level Security proteksi data user

## 🛠️ Teknologi

### Core Dependencies
```bash
react-native-vision-camera       # Camera dengan JSI support
@react-native-ml-kit/text-recognition  # Google ML Kit on-device
react-native-worklets-core       # Frame processor support
react-native-reanimated         # Smooth animations
```

### Platform Support
- **Android**: Primary target (API 24+, ML Kit)
- **iOS**: Secondary support (Vision framework)
- **Expo**: Dev Client atau EAS Build (bukan Expo Go)

## 📁 Struktur File

```
components/
├── RealtimeReceiptScanner.tsx   # Main camera component
├── ui/
│   ├── CameraOverlay.tsx       # ROI guides & status
│   ├── ReceiptBottomSheet.tsx  # Live results preview
│   └── TorchButton.tsx         # Camera flash control

app/
├── scan-receipt.tsx            # Scanner screen route
└── receipt-review.tsx          # Edit & confirm screen

utils/
├── parseReceipt.ts             # Indonesian parsing logic
├── receiptParser.types.ts      # TypeScript definitions
└── receiptHelpers.ts           # Supabase integration

hooks/
└── useReceiptOCR.ts           # OCR processing hook

supabase/migrations/
└── 003_add_receipts_table.sql  # Database schema
```

## 🎯 Performance Metrics

### Target Specifications
- **Frame Processing**: 2-3 FPS (throttled)
- **OCR Latency**: ≤ 120ms per frame
- **Memory Usage**: < 100MB tambahan
- **CPU Usage**: < 30% pada perangkat mid-range
- **Success Rate**: > 85% untuk struk standar Indonesia

### Stability Detection
- **Threshold**: 3 hasil konsisten berturut-turut
- **Similarity Check**: Merchant, amount, date matching
- **Confidence Filter**: Minimum 60% overall confidence

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
npm install react-native-vision-camera @react-native-ml-kit/text-recognition react-native-worklets-core
```

### 2. Update App Configuration
```json
// app.json
{
  "plugins": [
    ["react-native-vision-camera", {
      "cameraPermissionText": "Untuk scan struk realtime"
    }]
  ],
  "android": {
    "permissions": ["android.permission.CAMERA", "android.permission.FLASHLIGHT"]
  }
}
```

### 3. Run Database Migration
```sql
-- Execute supabase/migrations/003_add_receipts_table.sql
-- in your Supabase dashboard SQL editor
```

### 4. Build Dev Client
```bash
npx expo run:android
# atau
eas build --platform android --profile development
```

### 5. Navigate to Scanner
```typescript
import { router } from 'expo-router';

// Buka scanner
router.push('/scan-receipt');
```

## 🧪 Testing

### Unit Tests
```bash
npm test receiptParser.test.ts
```

### Manual QA Checklist

#### ✅ Android Mid-Range Device
- [ ] Camera permission granted
- [ ] Realtime OCR berjalan tanpa lag
- [ ] Torch toggle berfungsi
- [ ] ROI overlay akurat
- [ ] Tap-to-focus responsif

#### ✅ Receipt Parsing (Indonesia)
- [ ] `TOTAL Rp 123.456` → 123456
- [ ] `Grand Total: 12.345,67` → 12345.67
- [ ] `Tanggal: 12/08/2025` → 2025-08-12
- [ ] `15 Agustus 2025` → 2025-08-15
- [ ] Merchant dari baris pertama

#### ✅ UX Flow
- [ ] Bottom sheet muncul saat stabil
- [ ] Review screen data terisi
- [ ] Save to Supabase berhasil
- [ ] Error handling graceful
- [ ] Fallback still image berfungsi

## 🔧 Troubleshooting

### Common Issues

#### Camera Permission Denied
```typescript
// Check permission status
const { hasPermission } = useCameraPermission();
if (!hasPermission) {
  await requestPermission();
}
```

#### OCR Low Accuracy
- Pastikan cahaya cukup (aktifkan torch)
- Luruskan struk dalam ROI guides
- Gunakan fallback still image untuk hasil terbaik
- Check confidence scores di debug mode

#### Frame Processor Crash
```typescript
// Pastikan worklets-core installed
npm install react-native-worklets-core

// Enable new architecture in app.json
"newArchEnabled": true
```

#### Build Errors
- Untuk Android: pastikan minSdkVersion 24+
- Untuk iOS: tambahkan NSCameraUsageDescription
- Expo Go tidak support, gunakan Dev Client

### Performance Optimization

#### Low-End Devices
```typescript
// Reduce processing frequency
const ocrHook = useReceiptOCR({
  throttleMs: 500, // Slower on low-end devices
  stabilityThreshold: 2 // Faster confirmation
});
```

#### Memory Management
```typescript
// Monitor memory usage in debug
const metrics = ocrHook.metrics;
console.log('Avg processing time:', metrics.avgProcessingTime);
console.log('Success rate:', metrics.successRate);
```

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Setup Supabase project dan migration
4. Build Dev Client: `npx expo run:android`
5. Test di device fisik (bukan emulator untuk camera)

### Code Style
- TypeScript strict mode
- Functional components dengan hooks
- Error boundaries untuk OCR failures
- Comprehensive logging di debug mode

### Testing Requirements
- Unit tests untuk parsing logic
- Integration tests untuk Supabase
- Manual testing di minimal 2 Android devices
- Performance profiling untuk memory/CPU

## 📊 Analytics & Monitoring

### Metrics yang Dilog
```typescript
interface OCRMetrics {
  avgProcessingTime: number;    // ms per frame
  frameProcessingRate: number;  // FPS
  successRate: number;          // % successful parses
  totalFramesProcessed: number; // Total frames
}
```

### Error Tracking
- OCR processing failures
- Permission denied events
- Camera initialization errors
- Parsing validation failures
- Supabase save errors

### User Behavior
- Scan success/failure rates
- Time to stable result
- Most common parsing errors
- Fallback usage frequency

## 🔮 Future Enhancements

### Planned Features
- [ ] Multiple receipt formats support
- [ ] Batch scanning multiple receipts
- [ ] OCR confidence improvement ML
- [ ] Offline-first with sync
- [ ] Receipt categorization AI

### Advanced Parsing
- [ ] Line items extraction
- [ ] Tax/discount detection
- [ ] Payment method recognition
- [ ] Store location from address

### Performance
- [ ] Edge TPU support untuk Android
- [ ] iOS Neural Engine optimization
- [ ] Progressive image enhancement
- [ ] Smart ROI auto-adjustment

---

## 📝 License

Bagian dari TaskFi application. Lihat LICENSE file untuk details.

## 🆘 Support

Untuk bug reports atau feature requests:
1. Check existing issues
2. Provide device info (Android version, device model)
3. Include sample receipt yang gagal diparse
4. Attach debug logs jika tersedia

**Happy Scanning! 🧾📱**
