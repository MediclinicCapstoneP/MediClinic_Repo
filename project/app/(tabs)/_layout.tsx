import { Tabs } from 'expo-router';
import { Home, Calendar, User, Stethoscope, Settings, Users, FileText, Activity } from 'lucide-react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Platform } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallScreen = screenWidth < 375;
  
  // Calculate responsive dimensions
  const getResponsiveTabBarHeight = () => {
    if (isTablet) return 80;
    if (isSmallScreen) return 65;
    return 70;
  };
  
  const getResponsiveIconSize = () => {
    if (isTablet) return 28;
    if (isSmallScreen) return 20;
    return 24;
  };
  
  const getResponsiveFontSize = () => {
    if (isTablet) return 14;
    if (isSmallScreen) return 10;
    return 12;
  };
  
  const getResponsivePadding = () => {
    if (isTablet) return 12;
    if (isSmallScreen) return 6;
    return 8;
  };

  // Show different tabs based on user role
  const getTabsForRole = () => {
    if (!user) return [];

    if (user.role === 'patient') {
      return [
        {
          name: 'patient',
          title: 'Home',
          icon: Home,
          allowedRoles: ['patient'],
        },
        {
          name: 'appointments',
          title: 'Appointments',
          icon: Calendar,
          allowedRoles: ['patient'],
        },
        {
          name: 'profile',
          title: 'Profile',
          icon: User,
          allowedRoles: ['patient'],
        },
      ];
    } else if (user.role === 'doctor' || user.role === 'clinic') {
      return [
        {
          name: 'doctor',
          title: 'Dashboard',
          icon: Activity,
          allowedRoles: ['doctor', 'clinic'],
        },
        {
          name: 'appointments',
          title: 'Appointments',
          icon: Calendar,
          allowedRoles: ['doctor', 'clinic'],
        },
        {
          name: 'patients',
          title: 'Patients',
          icon: Users,
          allowedRoles: ['doctor', 'clinic'],
        },
        {
          name: 'profile',
          title: 'Profile',
          icon: User,
          allowedRoles: ['doctor', 'clinic'],
        },
      ];
    }

    return [];
  };

  const tabs = getTabsForRole();

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingTop: getResponsivePadding(),
            paddingBottom: Math.max(insets.bottom, getResponsivePadding()),
            paddingHorizontal: isTablet ? 20 : 0,
            height: getResponsiveTabBarHeight() + Math.max(insets.bottom, 0),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: getResponsiveFontSize(),
            fontWeight: '500',
            marginTop: isSmallScreen ? 2 : 4,
          },
          tabBarIconStyle: {
            marginBottom: isSmallScreen ? 2 : 4,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ size, color }) => (
                <tab.icon size={getResponsiveIconSize()} color={color} />
              ),
              href: user && tab.allowedRoles.includes(user.role) ? undefined : null,
            }}
          />
        ))}
      </Tabs>
    </ProtectedRoute>
  );
}