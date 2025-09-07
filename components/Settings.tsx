import React, { useState } from 'react'
import { View, ScrollView, Alert, Linking, Platform, TouchableOpacity, Pressable, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Separator } from './ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Mail } from '~/lib/icons/Mail'
import { useAuth } from '~/features/auth/AuthProvider'
import { useProfile } from '~/hooks/useProfile'
import { useLanguage } from '~/hooks/useLanguage'
import { ThemeToggle } from './ThemeToggle'
import { queryClient } from '~/utils/queryClient'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import EditProfile from './settings/EditProfile'
import NotificationSettings from './settings/NotificationSettings'
import LanguageSettings from './settings/LanguageSettings'
import SecuritySettings from './settings/SecuritySettings'
import { 
  User, 
  Shield, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Bell,
  Lock,
  Globe,
  Smartphone,
  ChevronRight,
  Camera,
  Moon,
  Sun,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react-native'

export default function Settings() {
    const { session, signOut } = useAuth()
    const { profile, loading, uploadAvatar: uploadAvatarHook } = useProfile()
    const { t } = useLanguage()
    const [uploading, setUploading] = useState(false)
    const [currentScreen, setCurrentScreen] = useState<'main' | 'profile' | 'notifications' | 'language' | 'security'>('main')

    const handlePermissions = async () => {
        // Check current permissions status
        const { status: mediaLibraryStatus } = await ImagePicker.getMediaLibraryPermissionsAsync()

        const permissionStatus = mediaLibraryStatus === 'granted' ? '✅ Granted' : '❌ Not Granted'

        Alert.alert(
            'App Permissions',
            `Current Permission Status:\n\n📸 Media Library: ${permissionStatus}\n\nThis app uses the following permissions:\n\n• Camera Roll/Media Library: To upload and change profile pictures\n• Network Access: To sync data with our servers\n• Storage: To cache data and save preferences\n\nTo change permissions, go to your device settings > Apps > ${Platform.OS === 'ios' ? 'This App' : 'RNR Base'} > Permissions`,
            [{ text: 'OK' }]
        )
    }

    const handleTermsOfUse = async () => {
        const termsUrl = 'https://your-app.com/terms' // Replace with your actual terms URL

        try {
            const supported = await Linking.canOpenURL(termsUrl)
            if (supported) {
                await Linking.openURL(termsUrl)
            } else {
                Alert.alert(
                    'Terms of Use',
                    'Our Terms of Use govern your use of this application. By using this app, you agree to be bound by these terms.\n\nFor the full terms, please visit our website or contact support.',
                    [{ text: 'OK' }]
                )
            }
        } catch (error) {
            Alert.alert(
                'Terms of Use',
                'Our Terms of Use govern your use of this application. By using this app, you agree to be bound by these terms.\n\nFor the full terms, please visit our website or contact support.',
                [{ text: 'OK' }]
            )
        }
    }

    const handlePrivacyPolicy = async () => {
        const privacyUrl = 'https://your-app.com/privacy' // Replace with your actual privacy URL

        try {
            const supported = await Linking.canOpenURL(privacyUrl)
            if (supported) {
                await Linking.openURL(privacyUrl)
            } else {
                Alert.alert(
                    'Privacy Policy',
                    'We respect your privacy and are committed to protecting your personal information. Our Privacy Policy explains how we collect, use, and protect your data.\n\nFor the full privacy policy, please visit our website or contact support.',
                    [{ text: 'OK' }]
                )
            }
        } catch (error) {
            Alert.alert(
                'Privacy Policy',
                'We respect your privacy and are committed to protecting your personal information. Our Privacy Policy explains how we collect, use, and protect your data.\n\nFor the full privacy policy, please visit our website or contact support.',
                [{ text: 'OK' }]
            )
        }
    }

    const handleSignOut = async () => {
        Alert.alert(
            t('signOut'),
            t('signOutConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('signOut'),
                    style: 'destructive',
                    onPress: async () => {
                        const result = await signOut()
                        if (result.success) {
                            // Clear all cached data
                            queryClient.clear()
                            Alert.alert(t('success'), t('signOutSuccess'))
                        } else {
                            Alert.alert(t('error'), result.error || 'Gagal keluar dari akun')
                        }
                    }
                }
            ]
        )
    }

    const handleSupport = () => {
        Alert.alert(
            'Support',
            'Need help? Contact our support team:\n\n📧 Email: support@yourapp.com\n🌐 Website: www.yourapp.com\n\nWe typically respond within 24 hours.',
            [{ text: 'OK' }]
        )
    }

    const handleAbout = () => {
        Alert.alert(
            'About RNR Base',
            'RNR Base is a modern React Native starter template built with:\n\n• Expo Router for navigation\n• NativeWind for styling\n• Supabase for backend\n• TypeScript for type safety\n\nBuilt with ❤️ for developers',
            [{ text: 'OK' }]
        )
    }

    const handleUploadAvatar = async () => {
        try {
            setUploading(true)

            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(t('permissionRequired'), t('permissionError'))
                return
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (result.canceled) {
                return
            }

            const image = result.assets[0]
            if (!image.uri) {
                throw new Error('No image selected')
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
            )

            // Use the hook's upload function
            const uploadResult = await uploadAvatarHook(manipulatedImage.uri)
            if (uploadResult.success) {
                Alert.alert(t('success'), t('avatarUpdated'))
            } else if (uploadResult.error) {
                Alert.alert(t('error'), uploadResult.error)
            }

        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(t('error'), error.message)
            }
        } finally {
            setUploading(false)
        }
    }

    const getAvatarFallback = () => {
        const displayName = profile.display_name || `${profile.name} ${profile.surname}`.trim()
        if (displayName) {
            return displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        }
        if (profile.username) {
            return profile.username.slice(0, 2).toUpperCase()
        }
        return session?.user?.email?.slice(0, 2).toUpperCase() || 'U'
    }

    // Render different screens based on currentScreen
    const renderHeader = () => (
        <View className="flex-row items-center mb-6 px-4 pt-2">
            {currentScreen !== 'main' && (
                <TouchableOpacity 
                    onPress={() => setCurrentScreen('main')}
                    className="mr-3 p-3 -ml-1 rounded-full"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={24} className="text-foreground" />
                </TouchableOpacity>
            )}
            <Text className="text-2xl font-bold text-foreground">
                {currentScreen === 'main' ? t('settings') : 
                 currentScreen === 'profile' ? t('editProfile') :
                 currentScreen === 'notifications' ? t('notifications') :
                 currentScreen === 'language' ? t('language') :
                 currentScreen === 'security' ? t('security') : t('settings')}
            </Text>
        </View>
    )

    if (currentScreen === 'profile') {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                {renderHeader()}
                <EditProfile />
            </SafeAreaView>
        )
    }

    if (currentScreen === 'notifications') {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                {renderHeader()}
                <NotificationSettings />
            </SafeAreaView>
        )
    }

    if (currentScreen === 'language') {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                {renderHeader()}
                <LanguageSettings />
            </SafeAreaView>
        )
    }

    if (currentScreen === 'security') {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                {renderHeader()}
                <SecuritySettings />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1 px-4 pt-2 pb-2">
                {renderHeader()}

            {/* Profile Header */}
            <Pressable 
                className="bg-card p-5 flex-row items-center rounded-lg mb-3"
                onPress={() => setCurrentScreen('profile')}
            >
                <View className="relative mr-4">
                    <Avatar alt="Profile Picture" className="w-16 h-16">
                        <AvatarImage source={{ uri: profile.avatar_url || undefined }} />
                        <AvatarFallback>
                            <Text className="text-xl font-semibold text-muted-foreground">
                                {getAvatarFallback()}
                            </Text>
                        </AvatarFallback>
                    </Avatar>
                    <View className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Camera size={12} className="text-primary-foreground" />
                    </View>
                </View>
                <View className="flex-1 pr-3">
                    <Text className="text-lg font-semibold text-foreground">
                        {profile.display_name || `${profile.name} ${profile.surname}`.trim() || profile.username || 'User'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Mail size={14} className="text-muted-foreground mr-2" />
                        <Text className="text-sm text-muted-foreground">
                            {session?.user?.email}
                        </Text>
                    </View>
                </View>
                <View className="pl-2">
                    <ChevronRight size={20} className="text-muted-foreground" />
                </View>
            </Pressable>

            {/* Settings List */}
            <View className="bg-card rounded-lg mb-3">
                {/* Account Section */}
                <View className="px-4 py-4">
                    <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {t('profile')}
                    </Text>
                </View>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5 border-b border-border"
                    onPress={() => setCurrentScreen('security')}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Shield size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">{t('security')}</Text>
                            <Text className="text-sm text-muted-foreground mt-0.5">App lock and biometric settings</Text>
                        </View>
                    </View>
                    <View className="pl-2">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5 border-b border-border"
                    onPress={() => setCurrentScreen('notifications')}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Bell size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">{t('notifications')}</Text>
                            <Text className="text-sm text-muted-foreground mt-0.5">Reminder preferences</Text>
                        </View>
                    </View>
                    <View className="pl-2">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5"
                    onPress={() => setCurrentScreen('language')}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Globe size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">{t('language')}</Text>
                            <Text className="text-sm text-muted-foreground mt-0.5">App language settings</Text>
                        </View>
                    </View>
                    <View className="pl-2">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </View>
                </TouchableOpacity>
            </View>

     
            {/* Sign Out */}
            <View className="bg-card rounded-lg p-5 mb-6">
                <TouchableOpacity 
                    className="flex-row items-center justify-center py-4 px-6 bg-destructive rounded-lg"
                    onPress={handleSignOut}
                >
                    <LogOut size={20} className="text-destructive-foreground mr-3" />
                    <Text className="text-base font-medium text-destructive-foreground">{t('signOut')}</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    )
}