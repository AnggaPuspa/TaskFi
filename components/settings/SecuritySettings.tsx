import React from 'react';
import { View, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { useSecurity } from '~/hooks/useSecurity';
import { useLanguage } from '~/hooks/useLanguage';
import { Shield, Lock, Fingerprint, Smartphone, AlertTriangle } from 'lucide-react-native';

export default function SecuritySettings() {
  const { t } = useLanguage();
  const {
    isAppLockEnabled,
    securityLevel,
    supportedBiometrics,
    isBiometricAvailable,
    isLoading,
    enableAppLock,
    disableAppLock,
    authenticate,
  } = useSecurity();

  const handleToggleAppLock = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await enableAppLock();
        if (success) {
          Alert.alert(t('success'), 'Kunci aplikasi berhasil diaktifkan');
        } else {
          Alert.alert(t('error'), 'Gagal mengaktifkan kunci aplikasi');
        }
      } else {
        // Require authentication before disabling
        const authResult = await authenticate();
        if (authResult.success) {
          const success = await disableAppLock();
          if (success) {
            Alert.alert(t('success'), 'Kunci aplikasi berhasil dinonaktifkan');
          } else {
            Alert.alert(t('error'), 'Gagal menonaktifkan kunci aplikasi');
          }
        } else {
          Alert.alert(t('error'), authResult.error || 'Autentikasi gagal');
        }
      }
    } catch (error) {
      console.error('Error toggling app lock:', error);
      Alert.alert(t('error'), 'An error occurred');
    }
  };

  const handleTestAuthentication = async () => {
    const result = await authenticate();
    if (result.success) {
      Alert.alert(t('success'), 'Autentikasi berhasil!');
    } else {
      Alert.alert(t('error'), result.error || 'Autentikasi gagal');
    }
  };

  const getSecurityLevelText = () => {
    switch (securityLevel) {
      case 'biometric':
        return 'Autentikasi Biometrik';
      case 'pin':
        return 'Autentikasi PIN';
      case 'none':
      default:
        return 'Tanpa Keamanan';
    }
  };

  const getSecurityLevelIcon = () => {
    switch (securityLevel) {
      case 'biometric':
        return <Fingerprint size={20} className="text-green-500" />;
      case 'pin':
        return <Lock size={20} className="text-blue-500" />;
      case 'none':
      default:
        return <AlertTriangle size={20} className="text-red-500" />;
    }
  };

  const getBiometricTypesText = () => {
    if (!isBiometricAvailable || supportedBiometrics.includes('none')) {
      return 'Tidak tersedia';
    }
    return supportedBiometrics.join(', ');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted-foreground">{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4" showsVerticalScrollIndicator={false}>
      {/* Current Security Status */}
      <View className="bg-card rounded-lg p-4 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">
            Status Keamanan
          </Text>
          {getSecurityLevelIcon()}
        </View>
        
        <Text className="text-sm text-muted-foreground mb-3">
          Level saat ini: {getSecurityLevelText()}
        </Text>

        <View className="bg-muted/50 rounded-lg p-3">
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Biometrik Tersedia
          </Text>
          <Text className="text-sm text-foreground">
            {getBiometricTypesText()}
          </Text>
        </View>
      </View>

      {/* App Lock Settings */}
      <View className="bg-card rounded-lg p-4 mb-6">
        <Text className="text-lg font-semibold text-foreground mb-4">
          {t('appLock')}
        </Text>

        {/* Enable/Disable App Lock */}
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center mb-1">
              <Shield size={16} className="text-muted-foreground mr-2" />
              <Text className="text-base font-medium text-foreground">
                Aktifkan Kunci Aplikasi
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              Memerlukan autentikasi untuk mengakses aplikasi
            </Text>
          </View>
          <Switch
            value={isAppLockEnabled}
            onValueChange={handleToggleAppLock}
          />
        </View>

        {isAppLockEnabled && (
          <>
            <Separator className="my-3" />
            
            {/* Test Authentication */}
            <TouchableOpacity
              onPress={handleTestAuthentication}
              className="flex-row items-center py-3"
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Smartphone size={16} className="text-muted-foreground mr-2" />
                  <Text className="text-base font-medium text-foreground">
                    Tes Autentikasi
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  Uji metode autentikasi Anda saat ini
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Security Tips */}
      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <Text className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          🔒 Tips Keamanan
        </Text>
        <Text className="text-sm text-blue-700 dark:text-blue-300">
          • Aktifkan kunci aplikasi untuk melindungi data keuangan Anda{'\n'}
          • Gunakan autentikasi biometrik untuk kemudahan{'\n'}
          • Pilih PIN yang kuat jika biometrik tidak tersedia{'\n'}
          • Pengaturan keamanan disimpan lokal dan disinkronkan antar perangkat
        </Text>
      </View>

      {/* Biometric Not Available Warning */}
      {!isBiometricAvailable && (
        <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <View className="flex-row items-start">
            <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
            <Text className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
              {t('biometricNotSupported')} Anda masih bisa menggunakan autentikasi PIN untuk mengamankan aplikasi.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
