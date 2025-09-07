import { useState, useEffect } from 'react';
import { BiometricService, SecurityLevel, BiometricType } from '~/services/BiometricService';
import { useProfile } from './useProfile';
import { useAuth } from '~/features/auth/AuthProvider';

export interface UseSecurityReturn {
  isAppLockEnabled: boolean;
  securityLevel: SecurityLevel;
  supportedBiometrics: BiometricType[];
  isBiometricAvailable: boolean;
  isLoading: boolean;
  enableAppLock: () => Promise<boolean>;
  disableAppLock: () => Promise<boolean>;
  setSecurityLevel: (level: SecurityLevel) => Promise<boolean>;
  authenticate: () => Promise<{ success: boolean; error?: string }>;
  setupSecurity: () => Promise<SecurityLevel | null>;
  refreshSecurityStatus: () => Promise<void>;
}

export function useSecurity(): UseSecurityReturn {
  const { session } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [securityLevel, setSecurityLevelState] = useState<SecurityLevel>('none');
  const [supportedBiometrics, setSupportedBiometrics] = useState<BiometricType[]>(['none']);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load security status on mount and when profile changes
  useEffect(() => {
    loadSecurityStatus();
  }, [profile.app_lock_enabled]);

  const loadSecurityStatus = async () => {
    try {
      setIsLoading(true);

      // Check biometric availability
      const biometricAvailable = await BiometricService.isAvailable();
      setIsBiometricAvailable(biometricAvailable);

      // Get supported biometric types
      const biometrics = await BiometricService.getSupportedBiometrics();
      setSupportedBiometrics(biometrics);

      // Get current security level
      const level = await BiometricService.getSecurityLevel();
      setSecurityLevelState(level);

      // Get app lock status (prefer profile data, fallback to local storage)
      let appLockEnabled = profile.app_lock_enabled;
      if (!session?.user?.id) {
        appLockEnabled = await BiometricService.isAppLockEnabled();
      }
      setIsAppLockEnabled(appLockEnabled);

    } catch (error) {
      console.error('Error loading security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableAppLock = async (): Promise<boolean> => {
    try {
      // Show security setup dialog
      const selectedLevel = await BiometricService.showSecuritySetup();
      if (!selectedLevel) {
        return false;
      }

      // Set security level
      const success = await BiometricService.setSecurityLevel(selectedLevel);
      if (!success) {
        return false;
      }

      // Update profile if user is authenticated
      if (session?.user?.id) {
        const result = await updateProfile({ app_lock_enabled: true });
        if (!result.success) {
          console.error('Failed to update profile app lock status:', result.error);
          // Don't revert local changes even if profile update fails
        }
      }

      // Update local state
      setIsAppLockEnabled(true);
      setSecurityLevelState(selectedLevel);

      return true;
    } catch (error) {
      console.error('Error enabling app lock:', error);
      return false;
    }
  };

  const disableAppLock = async (): Promise<boolean> => {
    try {
      // Clear security settings
      const success = await BiometricService.clearSecuritySettings();
      if (!success) {
        return false;
      }

      // Update profile if user is authenticated
      if (session?.user?.id) {
        const result = await updateProfile({ app_lock_enabled: false });
        if (!result.success) {
          console.error('Failed to update profile app lock status:', result.error);
          // Don't revert local changes even if profile update fails
        }
      }

      // Update local state
      setIsAppLockEnabled(false);
      setSecurityLevelState('none');

      return true;
    } catch (error) {
      console.error('Error disabling app lock:', error);
      return false;
    }
  };

  const setSecurityLevel = async (level: SecurityLevel): Promise<boolean> => {
    try {
      const success = await BiometricService.setSecurityLevel(level);
      if (success) {
        setSecurityLevelState(level);
        setIsAppLockEnabled(level !== 'none');

        // Update profile if user is authenticated
        if (session?.user?.id) {
          const result = await updateProfile({ app_lock_enabled: level !== 'none' });
          if (!result.success) {
            console.error('Failed to update profile app lock status:', result.error);
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Error setting security level:', error);
      return false;
    }
  };

  const authenticate = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      return await BiometricService.performAuthentication();
    } catch (error) {
      console.error('Error during authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  };

  const setupSecurity = async (): Promise<SecurityLevel | null> => {
    try {
      return await BiometricService.showSecuritySetup();
    } catch (error) {
      console.error('Error setting up security:', error);
      return null;
    }
  };

  const refreshSecurityStatus = async () => {
    await loadSecurityStatus();
  };

  return {
    isAppLockEnabled,
    securityLevel,
    supportedBiometrics,
    isBiometricAvailable,
    isLoading,
    enableAppLock,
    disableAppLock,
    setSecurityLevel,
    authenticate,
    setupSecurity,
    refreshSecurityStatus,
  };
}
