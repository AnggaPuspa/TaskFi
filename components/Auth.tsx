import React, { useState } from 'react'
import { Alert, AppState, View, Platform } from 'react-native'
import { supabase } from '../utils/supabase'
import { Input } from '~/components/ui/input';
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '~/features/auth/AuthProvider';
import { Mail, Apple, Smartphone, Shield, CheckCircle } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useColorScheme } from '~/lib/useColorScheme';
import OTPVerification from './OTPVerification';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const { signIn, signUp } = useAuth()
  const { isDarkColorScheme } = useColorScheme()

  // Fake login function that bypasses all validation
  async function fakeLogin() {
    setLoading(true)
    
    try {
      // Create a fake session that mimics Supabase session structure
      const fakeSession = {
        access_token: 'fake-access-token-' + Date.now(),
        refresh_token: 'fake-refresh-token-' + Date.now(),
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'fake-user-id-' + Date.now(),
          aud: 'authenticated',
          role: 'authenticated',
          email: 'demo@example.com',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {
            provider: 'fake',
            providers: ['fake']
          },
          user_metadata: {
            name: 'Demo User'
          },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      
      // For now, we'll just show an alert that fake login is complete
      Alert.alert('Demo Login', 'You\'ve successfully accessed the demo mode!')
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.log('Fake login completed', error)
    }
    
    setLoading(false)
  }

  async function signInWithEmail() {
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        // Check if it's a network error
        if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
          Alert.alert(
            'Connection Error',
            'Unable to connect to the server. Please check your internet connection and try again.\n\nIf you\'re a developer, make sure your Supabase credentials are properly configured in the .env file.',
            [
              { text: 'Try Demo Login', onPress: fakeLogin },
              { text: 'Retry', style: 'default' }
            ]
          )
        } else {
          Alert.alert('Sign In Error', error)
        }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection.\n\nFor development: Use Demo Login to test the app without a server connection.',
        [
          { text: 'Try Demo Login', onPress: fakeLogin },
          { text: 'OK', style: 'default' }
        ]
      )
    }
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    try {
      const { error } = await signUp(email, password)

      if (error) {
        // Check if it's a network error
        if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
          Alert.alert(
            'Connection Error',
            'Unable to connect to the server. Please check your internet connection and try again.\n\nIf you\'re a developer, make sure your Supabase credentials are properly configured in the .env file.',
            [
              { text: 'Try Demo Login', onPress: fakeLogin },
              { text: 'Retry', style: 'default' }
            ]
          )
        } else {
          Alert.alert('Sign Up Error', error)
        }
      } else {
        setPendingEmail(email)
        setShowOTPVerification(true)
        Alert.alert('Check Your Email', 'We\'ve sent you a 6-digit verification code. Please check your email and enter the code to complete your registration.')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection.\n\nFor development: Use Demo Login to test the app without a server connection.',
        [
          { text: 'Try Demo Login', onPress: fakeLogin },
          { text: 'OK', style: 'default' }
        ]
      )
    }
    setLoading(false)
  }

  async function handleAppleSignIn() {
    Alert.alert('Not Implemented', 'Apple Sign In is not fully implemented in this demo.')
    return
  }

  function handleOTPVerificationSuccess() {
    // Reset form state
    setEmail('')
    setPassword('')
    setShowOTPVerification(false)
    setShowEmailForm(false)
    setPendingEmail('')
    // The session will be automatically updated via the auth state change listener
  }

  function handleBackFromOTP() {
    setShowOTPVerification(false)
    // Keep the email form visible so user can try again
  }

  return (
    <>
      {showOTPVerification ? (
        <OTPVerification
          email={pendingEmail}
          onVerificationSuccess={handleOTPVerificationSuccess}
          onBack={handleBackFromOTP}
        />
      ) : (
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center text-white font-bold">
              {showEmailForm ? (isSignUp ? 'Join TaskFi' : 'Welcome Back') : 'Get Started'}
            </CardTitle>
            <CardDescription className="text-center text-blue-200">
              {showEmailForm
                ? (isSignUp
                  ? 'Create your TaskFi account to start organizing'
                  : 'Sign in to continue your productivity journey'
                )
                : 'Choose your preferred authentication method'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showEmailForm ? (
              // OAuth and Email Options
              <View className="space-y-3">
                {/* Apple Sign In - Only show on iOS */}
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={
                      isDarkColorScheme
                        ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                        : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={8}
                    style={{
                      width: '100%',
                      height: 48,
                    }}
                    onPress={handleAppleSignIn}
                  />
                )}

                {/* Divider */}
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-white/20" />
                  <Text className="px-4 text-white/60 text-sm font-medium">or continue with</Text>
                  <View className="flex-1 h-px bg-white/20" />
                </View>            {/* Email Sign In */}
                <View className="space-y-2">
                  <View className="flex-row items-center space-x-2 mb-2">
                    <Mail size={16} color="white" />
                    <Text className="text-white/80 text-sm font-medium">Email Authentication</Text>
                  </View>
                  <Button
                    onPress={() => setShowEmailForm(true)}
                    disabled={loading}
                    variant="outline"
                    className="h-14 border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    <View className="flex-row items-center justify-center space-x-3">
                      <Mail size={20} color="white" />
                      <Text className="text-white font-medium text-base">Continue with Email</Text>
                    </View>
                  </Button>
                </View>

                {/* Quick Login Button for Development */}
                <View className="mt-6">
                  <View className="flex-row items-center space-x-2 mb-2">
                    <Smartphone size={16} color="#10b981" />
                    <Text className="text-green-400 text-sm font-medium">Development Mode</Text>
                  </View>
                  <Button
                    onPress={fakeLogin}
                    disabled={loading}
                    className="h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                  >
                    <View className="flex-row items-center justify-center space-x-3">
                      <CheckCircle size={20} color="white" />
                      <Text className="text-white font-bold text-base">
                        {loading ? 'Signing in...' : '🚀 Quick Access (Demo)'}
                      </Text>
                    </View>
                  </Button>
                </View>
              </View>
            ) : (
              // Email Form
              <View className="space-y-6">
                {/* Email Input */}
                <View className="space-y-3">
                  <View className="flex-row items-center space-x-2">
                    <Mail size={16} color="white" />
                    <Text className="text-sm font-medium text-white">
                      Email Address
                    </Text>
                  </View>
                  <Input
                    id="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    className="h-14 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </View>

                {/* Password Input */}
                <View className="space-y-3">
                  <View className="flex-row items-center space-x-2">
                    <Shield size={16} color="white" />
                    <Text className="text-sm font-medium text-white">
                      Password
                    </Text>
                  </View>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="h-14 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </View>

                {/* Action Buttons */}
                <View className="space-y-4 pt-6">
                  <Button
                    onPress={isSignUp ? signUpWithEmail : signInWithEmail}
                    disabled={loading}
                    className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                    size="lg"
                  >
                    <Text className={`text-white font-bold text-base ${loading ? "opacity-70" : ""}`}>
                      {loading
                        ? (isSignUp ? 'Creating your TaskFi account...' : 'Signing you in...')
                        : (isSignUp ? 'Create TaskFi Account' : 'Sign In to TaskFi')
                      }
                    </Text>
                  </Button>

                  <Button
                    variant="outline"
                    onPress={() => setIsSignUp(!isSignUp)}
                    disabled={loading}
                    className="h-12 border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    <Text className="text-white font-medium">
                      {isSignUp ? 'Already have a TaskFi account? Sign In' : "New to TaskFi? Create Account"}
                    </Text>
                  </Button>

                  <Button
                    variant="ghost"
                    onPress={() => setShowEmailForm(false)}
                    disabled={loading}
                    className="h-10"
                  >
                    <Text className="text-white/70">
                      ← Back to authentication options
                    </Text>
                  </Button>

                  {/* Quick Login Button in Email Form */}
                  <View className="mt-4 pt-4 border-t border-white/10">
                    <View className="flex-row items-center space-x-2 mb-2">
                      <Smartphone size={14} color="#10b981" />
                      <Text className="text-green-400 text-xs font-medium">Development Shortcut</Text>
                    </View>
                    <Button
                      onPress={fakeLogin}
                      disabled={loading}
                      className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <View className="flex-row items-center justify-center space-x-2">
                        <CheckCircle size={16} color="white" />
                        <Text className="text-white font-medium text-sm">
                          {loading ? 'Accessing...' : '🚀 Demo Access (Skip Form)'}
                        </Text>
                      </View>
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}