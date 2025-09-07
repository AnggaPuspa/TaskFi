import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '~/i18n';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';
export type SecurityLevel = 'none' | 'biometric' | 'pin';

export class BiometricService {
  private static readonly APP_LOCK_KEY = 'app_lock_enabled';
  private static readonly SECURITY_LEVEL_KEY = 'security_level';
  private static readonly PIN_KEY = 'app_pin';

  /**
   * Check if biometric authentication is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get available biometric types
   */
  static async getSupportedBiometrics(): Promise<BiometricType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes: BiometricType[] = [];

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricTypes.push('fingerprint');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricTypes.push('facial');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricTypes.push('iris');
      }

      return biometricTypes.length > 0 ? biometricTypes : ['none'];
    } catch (error) {
      console.error('Error getting supported biometrics:', error);
      return ['none'];
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(promptMessage?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: i18n.t('biometricNotSupported'),
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access the app',
        cancelLabel: i18n.t('cancel'),
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  }

  /**
   * Check if app lock is enabled
   */
  static async isAppLockEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.APP_LOCK_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking app lock status:', error);
      return false;
    }
  }

  /**
   * Enable or disable app lock
   */
  static async setAppLockEnabled(enabled: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.APP_LOCK_KEY, enabled.toString());
      return true;
    } catch (error) {
      console.error('Error setting app lock status:', error);
      return false;
    }
  }

  /**
   * Get current security level
   */
  static async getSecurityLevel(): Promise<SecurityLevel> {
    try {
      const level = await AsyncStorage.getItem(this.SECURITY_LEVEL_KEY);
      return (level as SecurityLevel) || 'none';
    } catch (error) {
      console.error('Error getting security level:', error);
      return 'none';
    }
  }

  /**
   * Set security level
   */
  static async setSecurityLevel(level: SecurityLevel): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.SECURITY_LEVEL_KEY, level);
      await this.setAppLockEnabled(level !== 'none');
      return true;
    } catch (error) {
      console.error('Error setting security level:', error);
      return false;
    }
  }

  /**
   * Set PIN for authentication
   */
  static async setPIN(pin: string): Promise<boolean> {
    try {
      // In a real app, you should hash the PIN
      await AsyncStorage.setItem(this.PIN_KEY, pin);
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  }

  /**
   * Verify PIN
   */
  static async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(this.PIN_KEY);
      return storedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  /**
   * Clear all security settings
   */
  static async clearSecuritySettings(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        this.APP_LOCK_KEY,
        this.SECURITY_LEVEL_KEY,
        this.PIN_KEY,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing security settings:', error);
      return false;
    }
  }

  /**
   * Show security setup dialog
   */
  static async showSecuritySetup(): Promise<SecurityLevel | null> {
    return new Promise((resolve) => {
      Alert.alert(
        i18n.t('security'),
        i18n.t('selectSecurityMethod'),
        [
          {
            text: i18n.t('cancel'),
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: i18n.t('enableBiometric'),
            onPress: async () => {
              const isAvailable = await this.isAvailable();
              if (isAvailable) {
                resolve('biometric');
              } else {
                Alert.alert(i18n.t('error'), i18n.t('biometricNotSupported'));
                resolve(null);
              }
            },
          },
          {
            text: i18n.t('enablePin'),
            onPress: () => resolve('pin'),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  /**
   * Perform authentication based on current security level
   */
  static async performAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      const securityLevel = await this.getSecurityLevel();

      switch (securityLevel) {
        case 'biometric':
          return await this.authenticate('Unlock app with biometrics');

        case 'pin':
          // For PIN, you would typically show a PIN input dialog
          // This is a simplified version
          return new Promise((resolve) => {
            Alert.prompt(
              'Enter PIN',
              'Please enter your PIN to unlock the app',
              [
                {
                  text: i18n.t('cancel'),
                  style: 'cancel',
                  onPress: () => resolve({ success: false, error: 'Cancelled' }),
                },
                {
                  text: 'OK',
                  onPress: async (pin) => {
                    if (pin && await this.verifyPIN(pin)) {
                      resolve({ success: true });
                    } else {
                      resolve({ success: false, error: 'Invalid PIN' });
                    }
                  },
                },
              ],
              'secure-text'
            );
          });

        case 'none':
        default:
          return { success: true };
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}
