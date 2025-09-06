import React, { useState } from 'react'
import { Alert, AppState, View, Platform } from 'react-native'
import { supabase } from '../utils/supabase'
import { Input } from '~/components/ui/input';
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useSession } from '~/utils/ctx';
import { Mail } from '~/lib/icons/Mail';
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
  const { signIn, signUp, signInWithApple, fakeSignIn } = useSession()
  const { isDarkColorScheme } = useColorScheme()

  // Fake login function that bypasses all validation
  async function fakeLogin() {
    setLoading(true)
    
    try {
      // Use the fake sign in from context
      await fakeSignIn()
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.log('Fake login completed', error)
    }
    
    setLoading(false)
  }

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await signIn(email, password)

    if (error) Alert.alert('Sign In Error', error)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const { error } = await signUp(email, password)

    if (error) {
      Alert.alert('Sign Up Error', error)
    } else {
      setPendingEmail(email)
      setShowOTPVerification(true)
      Alert.alert('Check Your Email', 'We\'ve sent you a 6-digit verification code. Please check your email and enter the code to complete your registration.')
    }
    setLoading(false)
  }

  async function handleAppleSignIn() {
    setLoading(true)
    const { error } = await signInWithApple()
    if (error) Alert.alert('Apple Sign In Error', error)
    setLoading(false)
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
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {showEmailForm ? (isSignUp ? 'Create Account' : 'Sign In') : 'Welcome'}
            </CardTitle>
            <CardDescription className="text-center">
              {showEmailForm
                ? (isSignUp
                  ? 'Enter your details to create a new account'
                  : 'Enter your credentials to access your account'
                )
                : 'Choose your preferred sign in method'
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
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-border" />
                  <Text className="px-4 text-muted-foreground text-sm">or</Text>
                  <View className="flex-1 h-px bg-border" />
                </View>            {/* Email Sign In */}
                <Button
                  onPress={() => setShowEmailForm(true)}
                  disabled={loading}
                  variant="outline"
                  className="h-12 flex-row items-center justify-center space-x-2"
                >
                  <Mail size={20} />
                  <Text className="ml-2">Continue with Email</Text>
                </Button>

                {/* Quick Login Button for Development */}
                <Button
                  onPress={fakeLogin}
                  disabled={loading}
                  className="h-12 bg-green-600 hover:bg-green-700"
                >
                  <Text className="text-white font-semibold">
                    {loading ? 'Logging in...' : '🚀 Quick Login (Dev)'}
                  </Text>
                </Button>
              </View>
            ) : (
              // Email Form
              <View className="space-y-4">
                {/* Email Input */}
                <View className="space-y-2">
                  <Text className="text-sm font-medium text-foreground">
                    Email
                  </Text>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    className="h-12"
                  />
                </View>

                {/* Password Input */}
                <View className="space-y-2">
                  <Text className="text-sm font-medium text-foreground">
                    Password
                  </Text>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="h-12"
                  />
                </View>

                {/* Action Buttons */}
                <View className="space-y-4 pt-4">
                  <Button
                    onPress={isSignUp ? signUpWithEmail : signInWithEmail}
                    disabled={loading}
                    className="h-12"
                    size="lg"
                  >
                    <Text className={loading ? "opacity-70" : ""}>
                      {loading
                        ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                        : (isSignUp ? 'Create Account' : 'Sign In')
                      }
                    </Text>
                  </Button>

                  <Button
                    variant="outline"
                    onPress={() => setIsSignUp(!isSignUp)}
                    disabled={loading}
                    className="h-12 mt-2"
                  >
                    <Text>
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </Text>
                  </Button>

                  <Button
                    variant="ghost"
                    onPress={() => setShowEmailForm(false)}
                    disabled={loading}
                    className="h-10"
                  >
                    <Text className="text-muted-foreground">
                      ← Back to sign in options
                    </Text>
                  </Button>

                  {/* Quick Login Button in Email Form */}
                  <Button
                    onPress={fakeLogin}
                    disabled={loading}
                    className="h-10 bg-green-600 hover:bg-green-700"
                  >
                    <Text className="text-white text-sm">
                      {loading ? 'Logging in...' : '🚀 Quick Login (Skip Form)'}
                    </Text>
                  </Button>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}