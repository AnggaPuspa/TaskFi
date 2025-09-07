import React from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '~/components/ui/text';
import { CheckSquare, Zap, TrendingUp } from 'lucide-react-native';

interface LoadingScreenProps {
    message?: string;
    showIcon?: boolean;
}

export function LoadingScreen({ message = "Initializing TaskFi...", showIcon = true }: LoadingScreenProps) {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    const { width, height } = Dimensions.get('window');

    React.useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Scale animation for logo
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Rotation animation for accent icon
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation for loading dots
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        pulseAnimation.start();

        return () => {
            pulseAnimation.stop();
        };
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: fadeAnim,
                }}
            >
                {/* Animated Background Elements */}
                <Animated.View 
                    style={{
                        position: 'absolute',
                        top: height * 0.1,
                        left: width * 0.1,
                        transform: [{ rotate: spin }]
                    }}
                    className="w-20 h-20 rounded-full bg-white/5 border border-white/10"
                />
                <View className="absolute top-1/3 right-8 w-32 h-32 rounded-full bg-white/5" />
                <View className="absolute bottom-1/4 left-12 w-24 h-24 rounded-full bg-white/10" />
                <Animated.View 
                    style={{
                        position: 'absolute',
                        bottom: height * 0.15,
                        right: width * 0.15,
                        transform: [{ rotate: spin }]
                    }}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/20"
                />

                {showIcon && (
                    <Animated.View
                        style={{
                            transform: [{ scale: scaleAnim }]
                        }}
                        className="mb-12 items-center"
                    >
                        {/* TaskFi Logo Container */}
                        <View className="relative">
                            {/* Main Logo Background */}
                            <View className="w-32 h-32 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 justify-center items-center shadow-2xl">
                                <CheckSquare size={64} color="white" strokeWidth={2.5} />
                            </View>
                            
                            {/* Accent Icons */}
                            <View className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full justify-center items-center">
                                <Zap size={20} color="#1e3a8a" strokeWidth={3} />
                            </View>
                            <View className="absolute -bottom-2 -left-2 w-10 h-10 bg-green-400 rounded-full justify-center items-center">
                                <TrendingUp size={16} color="#1e3a8a" strokeWidth={3} />
                            </View>
                        </View>

                        {/* Brand Name */}
                        <View className="mt-8 items-center">
                            <Text className="text-white text-4xl font-bold text-center mb-2 tracking-wider">
                                TaskFi
                            </Text>
                            <Text className="text-white/80 text-lg text-center tracking-wide font-light">
                                Productivity & Finance
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* Loading Message */}
                <Text className="text-white/90 text-lg text-center mb-8 tracking-wide px-8">
                    {message}
                </Text>

                {/* Modern Loading Indicator */}
                <View className="flex-row items-center space-x-3">
                    {[0, 1, 2, 3].map((index) => (
                        <Animated.View
                            key={index}
                            style={{
                                opacity: pulseAnim,
                                transform: [{
                                    scale: pulseAnim.interpolate({
                                        inputRange: [0.4, 1],
                                        outputRange: [0.6, 1],
                                    })
                                }]
                            }}
                            className="w-3 h-3 bg-white rounded-full"
                        />
                    ))}
                </View>

                {/* Version Badge */}
                <View className="absolute bottom-16 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                    <Text className="text-white/70 text-sm font-medium">
                        v1.0.0 Beta
                    </Text>
                </View>
            </Animated.View>
        </LinearGradient>
    );
}
