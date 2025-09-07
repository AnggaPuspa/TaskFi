import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      
      // Settings
      settings: 'Settings',
      profile: 'Profile',
      editProfile: 'Edit Profile',
      notifications: 'Notifications',
      language: 'Language',
      security: 'Security',
      signOut: 'Sign Out',
      
      // Profile
      displayName: 'Display Name',
      email: 'Email',
      uploadAvatar: 'Upload Avatar',
      changeAvatar: 'Change Avatar',
      avatarUpdated: 'Avatar updated successfully!',
      profileUpdated: 'Profile updated successfully!',
      
      // Notifications
      notificationPermissions: 'Notification Permissions',
      dailyExpenseReminder: 'Daily Expense Reminder',
      todoReminder: 'Todo Reminders',
      reminderTime: 'Reminder Time',
      permissionRequired: 'Permission Required',
      notificationPermissionDenied: 'Notification permission is required to receive reminders.',
      
      // Security
      appLock: 'App Lock',
      enableBiometric: 'Enable Biometric Lock',
      enablePin: 'Enable PIN Lock',
      biometricNotSupported: 'Biometric authentication is not supported on this device.',
      
      // Language
      selectLanguage: 'Select Language',
      english: 'English',
      indonesian: 'Bahasa Indonesia',
      
      // Sign Out
      signOutConfirm: 'Are you sure you want to sign out?',
      signOutSuccess: 'Successfully signed out',
      
      // Errors
      uploadError: 'Failed to upload image',
      permissionError: 'Permission denied',
      updateError: 'Failed to update',
      
      // Reminder messages
      dailyExpenseReminderTitle: 'Record Your Daily Expenses',
      dailyExpenseReminderBody: "Don't forget to record your expenses for today!",
      todoReminderTitle: 'Todo Due Tomorrow',
      todoReminderBody: 'You have a todo due tomorrow: {{title}}',
    },
  },
  id: {
    translation: {
      // Common
      save: 'Simpan',
      cancel: 'Batal',
      edit: 'Edit',
      delete: 'Hapus',
      confirm: 'Konfirmasi',
      success: 'Berhasil',
      error: 'Error',
      loading: 'Memuat...',
      
      // Settings
      settings: 'Pengaturan',
      profile: 'Profil',
      editProfile: 'Edit Profil',
      notifications: 'Notifikasi',
      language: 'Bahasa',
      security: 'Keamanan',
      signOut: 'Keluar',
      
      // Profile
      displayName: 'Nama Tampilan',
      email: 'Email',
      uploadAvatar: 'Unggah Avatar',
      changeAvatar: 'Ganti Avatar',
      avatarUpdated: 'Avatar berhasil diperbarui!',
      profileUpdated: 'Profil berhasil diperbarui!',
      
      // Notifications
      notificationPermissions: 'Izin Notifikasi',
      dailyExpenseReminder: 'Pengingat Pengeluaran Harian',
      todoReminder: 'Pengingat Todo',
      reminderTime: 'Waktu Pengingat',
      permissionRequired: 'Izin Diperlukan',
      notificationPermissionDenied: 'Izin notifikasi diperlukan untuk menerima pengingat.',
      
      // Security
      appLock: 'Kunci Aplikasi',
      enableBiometric: 'Aktifkan Kunci Biometrik',
      enablePin: 'Aktifkan Kunci PIN',
      biometricNotSupported: 'Autentikasi biometrik tidak didukung pada perangkat ini.',
      
      // Language
      selectLanguage: 'Pilih Bahasa',
      english: 'English',
      indonesian: 'Bahasa Indonesia',
      
      // Sign Out
      signOutConfirm: 'Apakah Anda yakin ingin keluar?',
      signOutSuccess: 'Berhasil keluar',
      
      // Errors
      uploadError: 'Gagal mengunggah gambar',
      permissionError: 'Izin ditolak',
      updateError: 'Gagal memperbarui',
      
      // Reminder messages
      dailyExpenseReminderTitle: 'Catat Pengeluaran Harian Anda',
      dailyExpenseReminderBody: 'Jangan lupa catat pengeluaran Anda hari ini!',
      todoReminderTitle: 'Todo Jatuh Tempo Besok',
      todoReminderBody: 'Anda memiliki todo yang jatuh tempo besok: {{title}}',
    },
  },
};

// Create language detector that uses AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('app-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fall back to device locale
      const deviceLocales = Localization.getLocales();
      const deviceLocale = deviceLocales[0]?.languageCode || 'en';
      const supportedLanguage = ['en', 'id'].includes(deviceLocale) ? deviceLocale : 'en';
      callback(supportedLanguage);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('app-language', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
