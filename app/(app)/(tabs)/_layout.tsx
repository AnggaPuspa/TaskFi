import { Tabs } from 'expo-router';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  CheckSquare, 
  BarChart3, 
  Settings 
} from 'lucide-react-native';
import { useThemeColor } from '~/hooks/useThemeColor';
import { ThemeToggle } from '~/components/ThemeToggle';

export default function TabLayout() {
  const activeTintColor = useThemeColor({}, 'primary');
  const inactiveTintColor = useThemeColor({}, 'muted-foreground');
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: useThemeColor({}, 'border'),
        },
        headerShown: false, // We'll handle headers in individual screens
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <ArrowUpDown size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'Todos',
          tabBarIcon: ({ color, size }) => (
            <CheckSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      
      {/* Hide the old screens */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
