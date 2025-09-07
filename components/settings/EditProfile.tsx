import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { useProfile } from '~/hooks/useProfile';
import { useAuth } from '~/features/auth/AuthProvider';
import { useLanguage } from '~/hooks/useLanguage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera, Mail } from 'lucide-react-native';

export default function EditProfile() {
  const { session } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state - initialize with empty values first
  const [formData, setFormData] = useState({
    display_name: '',
    name: '',
    surname: '',
  });

  // Update form data when profile loads/changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || profile.username || '',
        name: profile.name || '',
        surname: profile.surname || '',
      });
    }
  }, [profile?.display_name, profile?.username, profile?.name, profile?.surname]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('💾 Saving profile data:', formData);
      
      const result = await updateProfile(formData);
      
      if (result.success) {
        if (result.warning) {
          Alert.alert(
            '⚠️ Berhasil Sebagian', 
            result.warning + '\n\nData username dan avatar tersimpan, tapi nama depan/belakang belum. Silakan jalankan migration untuk fitur lengkap.'
          );
        } else {
          Alert.alert(t('success'), 'Profil berhasil diperbarui! ✅');
        }
      } else {
        console.error('❌ Save failed:', result.error);
        Alert.alert(
          t('error'), 
          result.error?.includes('column') 
            ? 'Database belum diupdate. Silakan jalankan migration terlebih dahulu.\n\nLihat file: APPLY_MIGRATION_STEPS.md'
            : result.error || t('updateError')
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        t('error'), 
        'Terjadi kesalahan saat menyimpan profil. Pastikan database sudah diupdate dengan migration.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      setUploading(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('permissionError'));
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        throw new Error('No image selected');
      }

      // Crop and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        image.uri,
        [
          { resize: { width: 300, height: 300 } }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Upload image
      const uploadResult = await uploadAvatar(manipulatedImage.uri);
      
      if (uploadResult.success) {
        Alert.alert(t('success'), t('avatarUpdated'));
      } else {
        Alert.alert(t('error'), uploadResult.error || t('uploadError'));
      }

    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(t('error'), t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const avatarFallback = useMemo(() => {
    // Use static values to avoid infinite re-renders
    const displayName = formData.display_name || `${formData.name} ${formData.surname}`.trim();
    if (displayName) {
      return displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return session?.user?.email?.slice(0, 2).toUpperCase() || 'U';
  }, [formData.display_name, formData.name, formData.surname]);

  return (
    <ScrollView className="flex-1 bg-background p-4" showsVerticalScrollIndicator={false}>
      {/* Avatar Section */}
      <View className="items-center mb-8">
        <TouchableOpacity 
          onPress={handleAvatarUpload}
          disabled={uploading}
          className="relative"
        >
          <Avatar alt="Profile Picture" className="w-24 h-24">
            <AvatarImage source={{ uri: profile.avatar_url || undefined }} />
            <AvatarFallback>
              <Text className="text-2xl font-semibold text-muted-foreground">
                {avatarFallback}
              </Text>
            </AvatarFallback>
          </Avatar>
          
          <View className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2">
            <Camera size={16} className="text-primary-foreground" />
          </View>
        </TouchableOpacity>
        
        <Text className="text-sm text-muted-foreground mt-2">
          {uploading ? t('loading') : t('changeAvatar')}
        </Text>
      </View>

      {/* Form Fields */}
      <View className="space-y-6">
        {/* Email (read-only) */}
        <View>
          <Label className="text-sm font-medium text-foreground mb-2">
            {t('email')}
          </Label>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-3">
            <Mail size={16} className="text-muted-foreground mr-2" />
            <Text className="text-muted-foreground flex-1">
              {session?.user?.email}
            </Text>
          </View>
        </View>

        {/* Display Name */}
        <View>
          <Label className="text-sm font-medium text-foreground mb-2">
            {t('displayName')}
          </Label>
          <Input
            value={formData.display_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
            placeholder="Masukkan nama tampilan Anda"
            className="bg-background"
          />
        </View>

        {/* First Name */}
        <View>
          <Label className="text-sm font-medium text-foreground mb-2">
            Nama Depan
          </Label>
          <Input
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Masukkan nama depan Anda"
            className="bg-background"
          />
        </View>

        {/* Last Name */}
        <View>
          <Label className="text-sm font-medium text-foreground mb-2">
            Nama Belakang
          </Label>
          <Input
            value={formData.surname}
            onChangeText={(text) => setFormData(prev => ({ ...prev, surname: text }))}
            placeholder="Masukkan nama belakang Anda"
            className="bg-background"
          />
        </View>
      </View>

      {/* Save Button */}
      <View className="mt-8 mb-6">
        <Button
          onPress={handleSave}
          disabled={saving || uploading}
          className="py-4"
        >
          <Text className="text-primary-foreground font-medium">
            {saving ? t('loading') : t('save')}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}
