import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { supabase } from '~/utils/supabase';
import { Shield, Mail, CheckCircle } from 'lucide-react-native';

interface OTPVerificationProps {
    email: string;
    onVerificationSuccess: () => void;
    onBack: () => void;
}

export default function OTPVerification({ email, onVerificationSuccess, onBack }: OTPVerificationProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) return; // Prevent multiple characters

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otpCode,
                type: 'signup'
            });

            if (error) {
                Alert.alert('Verification Failed', error.message);
            } else {
                Alert.alert('Success', 'Your TaskFi account has been verified!');
                onVerificationSuccess();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email
            });

            if (error) {
                Alert.alert('Resend Failed', error.message);
            } else {
                Alert.alert('Success', 'A new verification code has been sent to your email');
                setTimer(60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']); // Clear current OTP
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg shadow-2xl">
            <CardHeader className="space-y-3">
                <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 justify-center items-center mb-4">
                        <Shield size={32} color="#3b82f6" strokeWidth={2} />
                    </View>
                </View>
                <CardTitle className="text-2xl text-center text-white font-bold">
                    Verify Your TaskFi Email
                </CardTitle>
                <CardDescription className="text-center text-blue-200">
                    We've sent a 6-digit verification code to{' '}
                    <Text className="font-semibold text-white">{email}</Text>
                    {' '}Please enter it below to complete your TaskFi registration.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* OTP Input Fields */}
                <View className="items-center">
                    <View className="flex-row items-center space-x-2 mb-4">
                        <Mail size={16} color="white" />
                        <Text className="text-white/80 text-sm font-medium">Enter Verification Code</Text>
                    </View>
                    <View className="flex-row justify-center space-x-4">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                className="w-14 h-14 text-center text-xl font-bold border-2 border-white/20 rounded-xl bg-white/5 text-white"
                                style={{
                                    borderColor: digit ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                                    backgroundColor: digit ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                }}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="numeric"
                                maxLength={1}
                                selectTextOnFocus
                                autoFocus={index === 0}
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            />
                        ))}
                    </View>
                </View>

                {/* Verify Button */}
                <Button
                    onPress={handleVerifyOTP}
                    disabled={loading || otp.join('').length !== 6}
                    className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                    size="lg"
                >
                    <View className="flex-row items-center justify-center space-x-2">
                        <CheckCircle size={20} color="white" />
                        <Text className={`text-white font-bold text-base ${loading ? "opacity-70" : ""}`}>
                            {loading ? 'Verifying your code...' : 'Complete TaskFi Setup'}
                        </Text>
                    </View>
                </Button>

                {/* Resend Code */}
                <View className="items-center space-y-3">
                    <Text className="text-sm text-white/70">
                        Didn't receive the verification code?
                    </Text>

                    {canResend ? (
                        <Button
                            variant="ghost"
                            onPress={handleResendOTP}
                            disabled={resendLoading}
                            className="h-12 bg-white/5 border border-white/20"
                        >
                            <Text className="text-blue-400 font-medium">
                                {resendLoading ? 'Sending new code...' : 'Resend Verification Code'}
                            </Text>
                        </Button>
                    ) : (
                        <View className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <Text className="text-sm text-white/70">
                                Resend available in {timer}s
                            </Text>
                        </View>
                    )}
                </View>

                {/* Back Button */}
                <Button
                    variant="outline"
                    onPress={onBack}
                    disabled={loading}
                    className="h-12 border-white/20 bg-white/5 hover:bg-white/10"
                >
                    <Text className="text-white font-medium">
                        ← Back to Registration
                    </Text>
                </Button>
            </CardContent>
        </Card>
    );
}