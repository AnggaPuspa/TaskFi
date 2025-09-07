import React, { useState } from 'react'
import { View, ScrollView, Alert, Linking, Platform, TouchableOpacity, Pressable } from 'react-native'
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Separator } from './ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Mail } from '~/lib/icons/Mail'
import { useAuth } from '~/features/auth/AuthProvider'
import { useProfile } from '~/hooks/useProfile'
import { ThemeToggle } from './ThemeToggle'
import * as ImagePicker from 'expo-image-picker'
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
  Sun
} from 'lucide-react-native'

export default function Settings() {
    const { session, signOut } = useAuth()
    const { profile, loading, uploadAvatar: uploadAvatarHook } = useProfile()
    const [uploading, setUploading] = useState(false)

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

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => signOut()
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
                Alert.alert('Permission Required', 'We need camera roll permissions to upload your avatar.')
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

            // Use the hook's upload function
            const uploadResult = await uploadAvatarHook(image.uri)
            if (uploadResult.success) {
                Alert.alert('Success', 'Avatar updated successfully!')
            } else if (uploadResult.error) {
                Alert.alert('Upload Error', uploadResult.error)
            }

        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Upload Error', error.message)
            }
        } finally {
            setUploading(false)
        }
    }

    const getAvatarFallback = () => {
        const fullName = `${profile.name} ${profile.surname}`.trim()
        if (fullName) {
            return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        }
        if (profile.username) {
            return profile.username.slice(0, 2).toUpperCase()
        }
        return session?.user?.email?.slice(0, 2).toUpperCase() || 'U'
    }

    return (
        <ScrollView className="flex-1 bg-background px-4 pt-6 pb-2">
            {/* Profile Header */}
            <Pressable 
                className="bg-card p-5 flex-row items-center rounded-lg mb-3"
                onPress={handleUploadAvatar}
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
                        {`${profile.name} ${profile.surname}`.trim() || profile.username || 'User'}
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
                        Account
                    </Text>
                </View>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5 border-b border-border"
                    onPress={handlePermissions}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Lock size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">Permissions</Text>
                            <Text className="text-sm text-muted-foreground mt-0.5">Manage app permissions</Text>
                        </View>
                    </View>
                    <View className="pl-2">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5 border-b border-border"
                    onPress={() => {}}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Bell size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">Notifications</Text>
                            <Text className="text-sm text-muted-foreground mt-0.5">Notification preferences</Text>
                        </View>
                    </View>
                    <View className="pl-2">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center px-4 py-5"
                    onPress={() => {}}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mr-4">
                            <Globe size={20} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-medium text-foreground">Language</Text>
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
                    <Text className="text-base font-medium text-destructive-foreground">Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View className="h-6" />
        </ScrollView>
    )
}