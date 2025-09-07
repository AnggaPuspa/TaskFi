import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { useLanguage, SUPPORTED_LANGUAGES } from '~/hooks/useLanguage';
import { Check, Globe } from 'lucide-react-native';

export default function LanguageSettings() {
  const { currentLanguage, availableLanguages, isChanging, changeLanguage, t } = useLanguage();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) {
      return;
    }

    try {
      const success = await changeLanguage(languageCode as any);
      if (success) {
        Alert.alert(t('success'), `Language changed to ${availableLanguages.find(l => l.code === languageCode)?.name}`);
      } else {
        Alert.alert(t('error'), 'Failed to change language');
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error'), 'Failed to change language');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4" showsVerticalScrollIndicator={false}>
      {/* Language Options */}
      <View className="bg-card rounded-lg overflow-hidden">
        {availableLanguages.map((language, index) => (
          <TouchableOpacity
            key={language.code}
            onPress={() => handleLanguageChange(language.code)}
            disabled={isChanging}
            className={`p-4 flex-row items-center justify-between ${
              index < availableLanguages.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                <Globe size={20} className="text-muted-foreground" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  {language.nativeName}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {language.name}
                </Text>
              </View>
            </View>
            
            {currentLanguage === language.code && (
              <Check size={20} className="text-primary" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Selection Info */}
      <View className="bg-muted/50 rounded-lg p-4 mt-6">
        <Text className="text-sm font-medium text-foreground mb-1">
          Bahasa Saat Ini
        </Text>
        <Text className="text-sm text-muted-foreground">
          {availableLanguages.find(l => l.code === currentLanguage)?.nativeName || 'English'}
        </Text>
      </View>

      {/* Help Text */}
      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
        <Text className="text-sm text-blue-800 dark:text-blue-200">
          💡 Perubahan bahasa akan disimpan ke profil Anda dan disinkronkan di semua perangkat.
        </Text>
      </View>

      {isChanging && (
        <View className="items-center mt-6">
          <Text className="text-muted-foreground">{t('loading')}</Text>
        </View>
      )}
    </ScrollView>
  );
}
