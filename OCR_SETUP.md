# 🧾 Fitur Scan Struk (OCR) - Setup Guide

## 📋 Overview

Fitur OCR (Optical Character Recognition) telah ditambahkan ke halaman **Add Transaction** untuk memungkinkan auto-fill form dari foto struk belanja. Fitur ini menggunakan parsing khusus untuk format struk Indonesia.

## 🚀 Quick Start

### 1. Install Dependencies (Production)

Untuk environment production dengan bare React Native:

```bash
npm install expo-camera expo-image-manipulator @react-native-ml-kit/text-recognition
```

### 2. Update App Configuration

File `app.json` sudah dikonfigurasi dengan:
- Camera permissions untuk iOS dan Android
- Plugin expo-camera dengan permission message

### 3. Development Mode (Current Setup)

Saat ini menggunakan **mock OCR data** untuk development karena:
- ML Kit memerlukan bare React Native
- Expo managed workflow belum support ML Kit
- 5 variasi mock receipt untuk testing berbagai skenario

## 🏗️ Architecture

### Files Structure
```
src/shared/ui/
├── OCRScanner.tsx          # Camera modal dengan scan overlay
├── OCRResultSheet.tsx      # Bottom sheet hasil parsing
└── index.ts               # Export components

utils/
├── ocrParser.ts           # Indonesian receipt parser utility
└── currency.ts            # Currency formatting (sudah ada)

app/
└── add-transaction.tsx    # Updated dengan OCR integration
```

### Component Integration

#### 1. OCRScanner Component
- **Purpose**: Modal kamera dengan scan area overlay
- **Features**: Permission handling, photo capture, grid overlay
- **Mock Mode**: Menggunakan 5 variasi struk realistis

#### 2. OCRResultSheet Component  
- **Purpose**: Menampilkan hasil parsing dengan confidence score
- **Features**: Data preview, confidence indicators, raw text view
- **Parser**: Menggunakan `parseIndonesianReceipt()` utility

#### 3. Add Transaction Integration
```typescript
// State management untuk OCR
const [showOCRScanner, setShowOCRScanner] = useState(false);
const [showOCRResult, setShowOCRResult] = useState(false);
const [ocrText, setOcrText] = useState('');

// Handler untuk auto-fill form
const handleUseOCRData = (data) => {
  if (data.amount) setFormData(prev => ({ ...prev, amount: formatInputIDR(data.amount) }));
  if (data.title) setFormData(prev => ({ ...prev, title: data.title }));
  // ... other fields
};
```

## 🧠 Indonesian Receipt Parser

### Supported Merchants
- **Retail**: Alfamart, Indomaret, Hypermart, Giant, Carrefour, Superindo
- **Food**: Warung, Cafe, Restaurant chains
- **Transport**: SPBU Pertamina, Grab, Gojek
- **Health**: Apotek, Pharmacy chains

### Parsing Features

#### Amount Detection (Priority-based)
```typescript
1. "TOTAL Rp 15.000"      → confidence: 90%
2. "TUNAI Rp 15.000"      → confidence: 80% 
3. "Rp 15.000"            → confidence: 70%
4. "15.000"               → confidence: 50%
```

#### Date Format Support
```typescript
- "08/09/2024"            → DD/MM/YYYY
- "08-09-2024"            → DD-MM-YYYY  
- "8 September 2024"      → DD Month YYYY
- "2024-09-08"            → YYYY-MM-DD
```

#### Confidence Scoring
- **Overall**: 70%+ = Hijau (Akurasi Tinggi)
- **Medium**: 40-70% = Kuning (Periksa Manual)  
- **Low**: <40% = Merah (Akurasi Rendah)

## 🎨 UI/UX Design

### Scan Button (NativeWind)
```typescript
<TouchableOpacity className="flex-row items-center justify-center gap-2 h-11 px-3 rounded-xl border border-primary/30 bg-primary/10">
  <Camera size={16} color={primaryColor} />
  <Text style={{ color: primaryColor }}>Scan Struk (OCR)</Text>
</TouchableOpacity>
```

### Camera Overlay
- Square scan area dengan corner indicators
- Grid lines untuk alignment
- Semi-transparent overlay
- Instruction text di bottom

### Result Sheet
- Confidence indicators dengan color coding
- Expandable raw text view
- Clear action buttons (Batal / Gunakan Data)

## 🔧 Development & Testing

### Mock Data Variations
```typescript
const mockReceipts = [
  'Alfamart receipt',      // Retail category
  'Indomaret receipt',     // Different format
  'Warung Kopi receipt',   // Food category  
  'SPBU receipt',          // Transport category
  'Apotek receipt'         // Health category
];
```

### Testing Scenarios
1. **Happy Path**: Scan → Parse → Review → Apply → Save
2. **Error Handling**: Permission denied, OCR failure
3. **Edge Cases**: Low confidence, no text detected
4. **Form Integration**: Auto-fill validation, error clearing

### Debug Mode
```typescript
// Enable console logs in OCRParser
const DEBUG_OCR = __DEV__;
if (DEBUG_OCR) {
  console.log('Parsed data:', parsedData);
  console.log('Confidence:', confidence);
}
```

## 🚢 Production Deployment

### 1. Replace Mock with Real OCR
```typescript
// In OCRScanner.tsx, replace processImageWithOCR():
import TextRecognition from '@react-native-ml-kit/text-recognition';

const processImageWithOCR = async (imageUri: string) => {
  try {
    const result = await TextRecognition.recognize(imageUri);
    onTextRecognized(result.text);
  } catch (error) {
    // Handle OCR error
  }
};
```

### 2. EAS Build Configuration
```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 3. Bundle Size Optimization
- Tree-shake unused ML Kit features
- Compress mock data in production
- Lazy load OCR components

## ⚠️ Known Limitations

### Current Setup (Mock Mode)
- ✅ UI/UX flow complete
- ✅ Parser logic functional  
- ✅ Form integration working
- ❌ Real OCR processing
- ❌ Photo capture functionality

### Production Requirements
- Bare React Native or EAS Build
- ML Kit Text Recognition dependency
- Device-specific testing for accuracy

## 🔮 Future Enhancements

1. **Smart Learning**: Improve parser based on user corrections
2. **Receipt Templates**: Support more merchant formats
3. **Batch Processing**: Multiple receipts at once
4. **Cloud Backup**: Optional cloud OCR for better accuracy
5. **Analytics**: Track parsing success rates

## 🐛 Troubleshooting

### Common Issues

#### "Camera permission denied"
```typescript
// Check app.json camera plugin configuration
// Verify iOS/Android permission messages
```

#### "OCR parsing returns empty"
```typescript
// Check mock data selection in OCRScanner
// Verify parseIndonesianReceipt() function
```

#### "Form fields not auto-filling"
```typescript
// Check handleUseOCRData() implementation
// Verify state updates in add-transaction.tsx
```

### Debug Steps
1. Check console logs for parsing results
2. Verify confidence scores in result sheet
3. Test with different mock receipt variations
4. Validate form field updates

## 📞 Support

Untuk pertanyaan atau bug reports:
1. Check console logs untuk detailed errors
2. Test dengan mock data variations
3. Verify component exports di `src/shared/ui/index.ts`
4. Review parsing logic di `utils/ocrParser.ts`

---

**🎯 Status**: ✅ **Mock Implementation Complete** - Ready for real OCR integration
