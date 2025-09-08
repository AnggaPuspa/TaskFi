# OCR Receipt Scanner Feature

## Overview
Fitur "Scan Struk (OCR)" memungkinkan pengguna untuk mengisi form transaksi secara otomatis dengan memindai foto struk belanja menggunakan teknologi Optical Character Recognition (OCR).

## Features
- 📱 **Camera Integration**: Menggunakan kamera perangkat untuk mengambil foto struk
- 🤖 **Intelligent Parsing**: Parser khusus untuk format struk Indonesia
- 🎯 **High Accuracy**: Parsing akurat untuk merchant lokal (Alfamart, Indomaret, dll)
- 📊 **Confidence Score**: Menampilkan tingkat akurasi deteksi
- 🔒 **Privacy First**: Semua pemrosesan dilakukan di perangkat (on-device)

## Architecture

### Components
1. **OCRScanner**: Modal kamera dengan overlay scan area
2. **OCRResultSheet**: Bottom sheet untuk menampilkan hasil parsing
3. **OCRParser**: Utility untuk parsing teks struk Indonesia

### Data Flow
```
Camera → Photo → OCR Processing → Text Recognition → 
Indonesian Receipt Parser → Structured Data → Form Auto-fill
```

## Integration with Add Transaction

### UI Changes
- Tombol "Scan Struk (OCR)" ditambahkan di bawah field "Nominal"
- Menggunakan NativeWind classes: `rounded-xl h-11 px-3 bg-primary/10 border border-primary/30 text-primary`

### Form Integration
```typescript
// OCR data automatically fills existing form fields
const handleUseOCRData = (data: ParsedReceiptData) => {
  if (data.amount) {
    setFormData(prev => ({ ...prev, amount: formatInputIDR(data.amount) }));
  }
  if (data.title) {
    setFormData(prev => ({ ...prev, title: data.title }));
  }
  // ... other fields
};
```

## Indonesian Receipt Parser

### Supported Formats
- **Merchants**: Alfamart, Indomaret, Hypermart, Giant, Carrefour, dll
- **Amount Formats**: Rp 15.000, 15,000, Rp. 15.000,00
- **Date Formats**: DD/MM/YYYY, DD-MM-YYYY, DD Month YYYY
- **Time Formats**: HH:MM, HH:MM:SS

### Parsing Logic

#### Amount Detection
```typescript
// Priority-based patterns
1. Total patterns: "TOTAL Rp 15.000" (confidence: 90%)
2. Payment patterns: "TUNAI Rp 15.000" (confidence: 80%)
3. Standalone amounts: "15.000" (confidence: 50%)
```

#### Merchant Detection
```typescript
// Known merchants (high confidence)
const knownMerchants = ['ALFAMART', 'INDOMARET', 'HYPERMART', ...];

// Fallback: Extract from first valid lines
- Skip common receipt terms
- Prefer uppercase text
- Avoid lines with numbers/dates
```

#### Category Mapping
```typescript
const categoryMapping = {
  'shopping': /mart|supermarket|toko|belanja/i,
  'food': /warung|cafe|restaurant|makanan/i,
  'transport': /spbu|bensin|grab|gojek/i,
  'health': /apotek|pharmacy|klinik/i,
  // ...
};
```

### Confidence Scoring
- **Amount**: 0-1 based on pattern match
- **Title**: 0-1 based on merchant recognition
- **Date**: 0-1 based on format validity
- **Overall**: Weighted average + quality bonus

## Mock Data for Development

Since ML Kit requires bare React Native (not Expo managed), the current implementation uses realistic mock data:

```typescript
const mockReceipts = [
  'Alfamart receipt with proper formatting',
  'Indomaret receipt with different structure', 
  'Cafe receipt with merchant detection',
  'SPBU receipt for transport category',
  'Apotek receipt for health category'
];
```

## Configuration

### Expo Configuration (app.json)
```json
{
  "plugins": [
    ["expo-camera", {
      "cameraPermission": "Aplikasi memerlukan akses kamera untuk scan struk"
    }]
  ],
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Akses kamera untuk scan struk belanja"
    }
  },
  "android": {
    "permissions": ["android.permission.CAMERA"]
  }
}
```

### Dependencies Required
```json
{
  "expo-camera": "latest",
  "expo-image-manipulator": "latest",
  "@react-native-ml-kit/text-recognition": "latest" // For production
}
```

## Usage Flow

1. **Open Form**: User navigates to Add Transaction
2. **Scan Button**: Click "Scan Struk (OCR)" button
3. **Camera Permission**: App requests camera access
4. **Capture Photo**: User takes photo of receipt
5. **OCR Processing**: Text recognition on captured image
6. **Parse Results**: Indonesian parser extracts structured data
7. **Review Sheet**: User reviews detected data with confidence scores
8. **Apply Data**: Click "Gunakan Data" to fill form fields
9. **Submit**: User can edit and submit as normal

## Error Handling

- **Permission Denied**: Show permission request dialog
- **OCR Failed**: Show error message with retry option
- **Low Confidence**: Warning message in result sheet
- **No Text Detected**: Fallback message

## Performance Considerations

- Image compression before OCR (80% quality)
- Crop to scan area to reduce processing time
- On-device processing (no network calls)
- Async processing with loading indicators

## Future Improvements

1. **Real OCR Integration**: Implement actual ML Kit text recognition
2. **Receipt Templates**: Support more receipt formats
3. **Manual Correction**: Allow users to correct OCR errors
4. **Learning Algorithm**: Improve parsing based on user corrections
5. **Offline Capability**: Full offline OCR processing

## Testing Strategy

### Mock Data Testing
- Test with various receipt formats
- Validate parsing accuracy for different merchants
- Check confidence score calculations

### UI Testing
- Camera modal functionality
- Result sheet interactions
- Form field auto-fill
- Error state handling

### Integration Testing
- End-to-end flow from scan to save
- Data persistence after OCR
- Existing form validation with OCR data

## Security & Privacy

- **No Cloud Processing**: All OCR happens on-device
- **No Image Storage**: Photos are processed and discarded
- **No Telemetry**: No usage data sent to external services
- **Permission Transparency**: Clear camera permission messages
