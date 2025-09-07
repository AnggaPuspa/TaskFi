import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from './useProfile';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';

export type Language = 'en' | 'id';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
];

export interface UseLanguageReturn {
  currentLanguage: Language;
  availableLanguages: LanguageOption[];
  isChanging: boolean;
  changeLanguage: (language: Language) => Promise<boolean>;
  t: (key: string, options?: any) => string;
}

export function useLanguage(): UseLanguageReturn {
  const { i18n, t } = useTranslation();
  const { session } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = (i18n.language as Language) || 'en';

  const changeLanguage = async (language: Language): Promise<boolean> => {
    try {
      setIsChanging(true);

      // Change i18n language
      await i18n.changeLanguage(language);

      // Update profile in database if user is authenticated
      if (session?.user?.id) {
        const result = await updateProfile({ language });
        if (!result.success) {
          console.error('Failed to update profile language:', result.error);
          // Don't revert i18n change even if profile update fails
          // The language change is still valid for the current session
        }
      }

      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    } finally {
      setIsChanging(false);
    }
  };

  // Sync i18n language with profile language when profile loads
  useEffect(() => {
    if (profile.language && profile.language !== currentLanguage) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile.language, currentLanguage, i18n]);

  return {
    currentLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    isChanging,
    changeLanguage,
    t,
  };
}
