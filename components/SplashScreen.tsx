import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Text } from '~/components/ui/text';
import { CheckSquare, Zap, TrendingUp, Users, DollarSign } from 'lucide-react-native';

interface SplashScreenProps {
    onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    const { width, height } = Dimensions.get('window');

    useEffect(() => {
        // Small delay to ensure component is mounted properly
        const timer = setTimeout(() => {
            // Start sparkle animation immediately
            Animated.loop(
                Animated.sequence([
                    Animated.timing(sparkleAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(sparkleAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Main animation sequence
            const animationSequence = Animated.sequence([
                // Initial fade in and scale
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 40,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                // Bounce effect
                Animated.spring(bounceAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 6,
                    useNativeDriver: true,
                }),
                // Pause
                Animated.delay(1200),
                // Subtle rotation animation
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                // Another pause
                Animated.delay(600),
                // Fade out
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]),
            ]);

            animationRef.current = animationSequence;
            animationSequence.start((finished) => {
                if (finished) {
                    onFinish();
                }
            });
        }, 150);

        // Cleanup function
        return () => {
            clearTimeout(timer);
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, [onFinish]);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'],
    });

    const bounceInterpolate = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    return (
        <>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0f172a', '#1e3a8a', '#3b82f6']}
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
                    {/* Animated Floating Elements */}
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            top: height * 0.15,
                            left: width * 0.1,
                            opacity: sparkleAnim,
                        }}
                        className="w-24 h-24 rounded-full bg-blue-400/10 border border-blue-300/20 justify-center items-center"
                    >
                        <DollarSign size={32} color="#60a5fa" strokeWidth={1.5} />
                    </Animated.View>
                    
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            top: height * 0.25,
                            right: width * 0.15,
                            opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
                        }}
                        className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-300/20 justify-center items-center"
                    >
                        <Zap size={28} color="#fbbf24" strokeWidth={1.5} />
                    </Animated.View>

                    <Animated.View 
                        style={{
                            position: 'absolute',
                            bottom: height * 0.25,
                            left: width * 0.2,
                            opacity: sparkleAnim,
                        }}
                        className="w-16 h-16 rounded-full bg-green-400/10 border border-green-300/20 justify-center items-center"
                    >
                        <TrendingUp size={24} color="#34d399" strokeWidth={1.5} />
                    </Animated.View>

                    <Animated.View 
                        style={{
                            position: 'absolute',
                            bottom: height * 0.15,
                            right: width * 0.25,
                            opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }),
                        }}
                        className="w-18 h-18 rounded-full bg-purple-400/10 border border-purple-300/20 justify-center items-center"
                    >
                        <Users size={20} color="#a855f7" strokeWidth={1.5} />
                    </Animated.View>

                    {/* Main TaskFi Logo */}
                    <Animated.View
                        style={{
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim },
                                { rotate: rotateInterpolate },
                                { translateY: bounceInterpolate },
                            ],
                        }}
                        className="mb-12 items-center"
                    >
                        {/* Logo Container */}
                        <View className="relative">
                            {/* Main Logo Background with Glow Effect */}
                            <View className="w-44 h-44 rounded-3xl bg-white/10 backdrop-blur-lg border-2 border-white/20 justify-center items-center shadow-2xl">
                                {/* Inner glow */}
                                <View className="w-36 h-36 rounded-2xl bg-white/5 border border-white/10 justify-center items-center">
                                    <CheckSquare size={88} color="white" strokeWidth={2.5} />
                                </View>
                            </View>
                            
                            {/* Accent Icons with Animations */}
                            <Animated.View 
                                style={{
                                    transform: [{ rotate: rotateInterpolate }]
                                }}
                                className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full justify-center items-center shadow-lg border-2 border-white/30"
                            >
                                <Zap size={24} color="#1e3a8a" strokeWidth={3} />
                            </Animated.View>
                            
                            <Animated.View 
                                style={{
                                    transform: [{ rotate: rotateInterpolate }]
                                }}
                                className="absolute -bottom-3 -left-3 w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full justify-center items-center shadow-lg border-2 border-white/30"
                            >
                                <TrendingUp size={20} color="#1e3a8a" strokeWidth={3} />
                            </Animated.View>

                            {/* Sparkle Effects */}
                            <Animated.View
                                style={{
                                    opacity: sparkleAnim,
                                    transform: [{ scale: sparkleAnim }]
                                }}
                                className="absolute top-8 right-2 w-3 h-3 bg-white rounded-full"
                            />
                            <Animated.View
                                style={{
                                    opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                                    transform: [{ scale: sparkleAnim }]
                                }}
                                className="absolute bottom-12 right-8 w-2 h-2 bg-yellow-300 rounded-full"
                            />
                        </View>
                    </Animated.View>

                    {/* TaskFi Branding */}
                    <Animated.View
                        style={{
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim,
                        }}
                        className="items-center mb-8"
                    >
                        <Text className="text-white text-5xl font-bold text-center mb-3 tracking-wider">
                            TaskFi
                        </Text>
                        <Text className="text-blue-200 text-xl text-center tracking-wide font-light">
                            Tasks • Finance • Success
                        </Text>
                        <View className="mt-4 bg-white/10 px-6 py-2 rounded-full border border-white/20">
                            <Text className="text-white/90 text-sm font-medium tracking-wide">
                                Organize • Track • Achieve
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Loading Indicator */}
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                        className="absolute bottom-24 items-center"
                    >
                        <View className="flex-row space-x-3 mb-4">
                            {[0, 1, 2, 3, 4].map((index) => (
                                <Animated.View
                                    key={index}
                                    style={{
                                        opacity: sparkleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                        transform: [{
                                            scale: sparkleAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.7, 1],
                                            }),
                                        }],
                                    }}
                                    className="w-3 h-3 bg-white rounded-full"
                                />
                            ))}
                        </View>
                        <Text className="text-white/70 text-base tracking-wide font-medium">
                            Initializing TaskFi...
                        </Text>
                    </Animated.View>

                    {/* Version Badge */}
                    <View className="absolute bottom-8 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <Text className="text-white/60 text-xs font-medium tracking-wide">
                            Version 1.0.0 • Beta Release
                        </Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        </>
    );
}
