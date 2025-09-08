import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { X, Camera as CameraIcon, Flashlight, FlashlightOff } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useThemeColor } from '~/hooks/useThemeColor';

interface OCRScannerProps {
  visible: boolean;
  onClose: () => void;
  onTextRecognized: (text: string) => void;
}

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.8;

export function OCRScanner({ visible, onClose, onTextRecognized }: OCRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torch, setTorch] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');

  useEffect(() => {
    if (visible) {
      // Simulate permission request
      setTimeout(() => setHasPermission(true), 500);
    }
  }, [visible]);

  const takePicture = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock OCR results with realistic Indonesian receipt data
      const mockReceipts = [
        `ALFAMART
Jl. Sudirman No. 123
Jakarta Selatan 12190

STRUK BELANJA
================================
Teh Botol Sosro 350ml     8.500
Indomie Goreng            3.500
Roti Tawar Sari Roti     12.000
Air Mineral Aqua 600ml    3.000
Oreo Original            15.500
================================
Sub Total                42.500
PPN 11%                   4.675
TOTAL                    47.175
================================
TUNAI                    50.000
KEMBALIAN                 2.825
================================
Tanggal: 08/09/2024
Waktu: 14:30:25
Kasir: SARI (001)`,

        `INDOMARET
JL. GATOT SUBROTO 45
JAKARTA PUSAT

NOTA PEMBELIAN
--------------------------
KOPI KAPAL API          4.500
MIE SEDAAP GORENG       3.200
SABUN LIFEBUOY          8.900
SHAMPO CLEAR           15.700
--------------------------
SUBTOTAL               32.300
TOTAL                  32.300
--------------------------
TUNAI                  35.000
KEMBALI                 2.700
--------------------------
TGL: 08/09/24  JAM: 15:45
KASIR: BUDI`,

        `WARUNG KOPI BAHAGIA
Jl. Kemang Raya No. 89
Jakarta Selatan

BON PEMBELIAN
========================
Kopi Tubruk              15.000
Nasi Gudeg               25.000
Es Teh Manis              8.000
Kerupuk                   5.000
========================
Total                    53.000
========================
Bayar Tunai              55.000
Kembalian                 2.000
========================
08/09/2024 - 12:15 WIB
Server: ANDI`,

        `SPBU PERTAMINA
STASIUN 44.502.09
JL. SUDIRMAN KM 7
JAKARTA SELATAN

STRUK PEMBELIAN BBM
===================
PERTALITE
10.00 Liter x 10.000
===================
TOTAL      100.000
===================
TUNAI      100.000
KEMBALIAN        0
===================
08/09/2024 10:30
POMPA: 3
OPERATOR: RUDI`,

        `APOTEK SEHAT SENTOSA
Jl. Mangga Besar No. 56
Jakarta Barat 11180

NOTA OBAT
--------------------
PARACETAMOL 500MG   12.500
VITAMIN C 1000MG    25.000
PLASTER HANSAPLAST   8.500
BETADINE 15ML       18.000
--------------------
SUB TOTAL           64.000
DISKON 5%            3.200
TOTAL               60.800
--------------------
CASH                65.000
CHANGE               4.200
--------------------
DATE: 08/09/2024
TIME: 16:20:15
CASHIER: SITI`
      ];

      const selectedReceipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      onTextRecognized(selectedReceipt.trim());
      onClose();
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <View style={[styles.container, { backgroundColor }]}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-center mt-4 text-muted-foreground">
              Meminta izin kamera...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Mock Camera Background */}
        <View style={styles.mockCameraBackground}>
          <View style={styles.mockReceiptContainer}>
            <Text style={styles.mockReceiptText}>
              📄 {'\n'}
              Mock Receipt{'\n'}
              ================={'\n'}
              Alfamart{'\n'}
              Total: Rp 47.175{'\n'}
              08/09/2024{'\n'}
              =================
            </Text>
          </View>
        </View>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Struk (Demo)</Text>
          <TouchableOpacity 
            onPress={() => setTorch(!torch)} 
            style={styles.closeButton}
          >
            {torch ? (
              <FlashlightOff size={24} color="white" />
            ) : (
              <Flashlight size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={[styles.overlayTop, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          
          {/* Middle row with scan area */}
          <View style={styles.overlayMiddle}>
            <View style={[styles.overlaySide, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
            <View style={styles.scanArea}>
              <View style={styles.scanCorner} />
              <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
              
              {/* Grid lines */}
              <View style={styles.gridContainer}>
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineVertical} />
                <View style={styles.gridLineVertical} />
              </View>
            </View>
            <View style={[styles.overlaySide, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          </View>
          
          {/* Bottom overlay */}
          <View style={[styles.overlayBottom, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Arahkan kamera ke struk belanja
          </Text>
          <Text style={styles.instructionsSubtext}>
            (Mode Demo: Akan menggunakan data mock)
          </Text>
        </View>

        {/* Capture button */}
        <View style={styles.captureContainer}>
          <TouchableOpacity
            onPress={takePicture}
            disabled={isProcessing}
            style={[
              styles.captureButton,
              { backgroundColor: cardColor },
              isProcessing && styles.captureButtonDisabled
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color={primaryColor} />
            ) : (
              <CameraIcon size={32} color={primaryColor} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mockCameraBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockReceiptContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    transform: [{ rotate: '-5deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mockReceiptText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    height: (height - SCAN_AREA_SIZE) / 2,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    width: (width - SCAN_AREA_SIZE) / 2,
  },
  overlayBottom: {
    flex: 1,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#ffffff',
    top: 0,
    left: 0,
  },
  scanCornerTopRight: {
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    top: 0,
    right: 0,
    left: 'auto',
  },
  scanCornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    bottom: 0,
    top: 'auto',
    left: 0,
  },
  scanCornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    left: '33.33%',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
});
