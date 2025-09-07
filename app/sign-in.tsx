import { ScrollView, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Auth from '~/components/Auth';
import { Text } from '~/components/ui/text';
import { CheckSquare, Zap, TrendingUp } from 'lucide-react-native';
import { PublicRoute } from '~/features/auth/guard';

export default function SignIn() {
    const { height } = Dimensions.get('window');
    
    return (
        <PublicRoute>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0f172a', '#1e3a8a', '#3b82f6']}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ 
                        flexGrow: 1, 
                        minHeight: height 
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 justify-center px-6 py-12">
                        <View className="w-full max-w-sm mx-auto">
                            {/* TaskFi Header Section */}
                            <View className="mb-12 items-center">
                                {/* TaskFi Logo */}
                                <View className="relative mb-8">
                                    <View className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 justify-center items-center shadow-lg">
                                        <CheckSquare size={48} color="white" strokeWidth={2.5} />
                                    </View>
                                    
                                    {/* Accent Icons */}
                                    <View className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full justify-center items-center">
                                        <Zap size={12} color="#1e3a8a" strokeWidth={3} />
                                    </View>
                                    <View className="absolute -bottom-1 -left-1 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full justify-center items-center">
                                        <TrendingUp size={10} color="#1e3a8a" strokeWidth={3} />
                                    </View>
                                </View>
                                
                                {/* Welcome Text */}
                                <Text className="text-white text-4xl font-bold text-center mb-3 tracking-wide">
                                    Welcome to TaskFi
                                </Text>
                                <Text className="text-blue-200 text-lg text-center mb-2 font-light">
                                    Your productivity & finance companion
                                </Text>
                                <View className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
                                    <Text className="text-white/90 text-sm text-center font-medium">
                                        Organize • Track • Achieve
                                    </Text>
                                </View>
                            </View>

                            {/* Auth Form */}
                            <Auth />
                            
                            {/* Footer */}
                            <View className="mt-8 items-center">
                                <Text className="text-white/60 text-sm text-center">
                                    Secure authentication powered by Supabase
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Decorative Elements */}
                    <View className="absolute top-20 left-8 w-16 h-16 rounded-full bg-blue-400/10 border border-blue-300/20" />
                    <View className="absolute top-32 right-12 w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-300/20" />
                    <View className="absolute bottom-40 left-6 w-20 h-20 rounded-full bg-green-400/10 border border-green-300/20" />
                    <View className="absolute bottom-24 right-8 w-14 h-14 rounded-full bg-purple-400/10 border border-purple-300/20" />
                </ScrollView>
            </LinearGradient>
        </PublicRoute>
    );
}