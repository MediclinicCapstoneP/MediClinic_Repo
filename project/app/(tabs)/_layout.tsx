import { Tabs } from 'expo-router';
import { Home, Calendar, User, Stethoscope, Settings, Users, FileText, Activity, Search, Hospital, Bell, MessageCircle } from 'lucide-react-native';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Platform, View, Text } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallScreen = screenWidth < 375;
  
  // If no user, show loading or redirect to auth
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
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

  // Render Patient Navigation
  if (user.role === 'patient') {
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
          <Tabs.Screen
            name="patient"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => (
                <Home size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="appointments/index"
            options={{
              title: 'My Appointments',
              tabBarIcon: ({ color }) => (
                <Calendar size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="clinics"
            options={{
              title: 'Find Clinics',
              tabBarIcon: ({ color }) => (
                <Search size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications/index"
            options={{
              title: 'Notifications',
              tabBarIcon: ({ color }) => (
                <Bell size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          {/* Hide other role's screens */}
          <Tabs.Screen
            name="doctor"
            options={{ href: null }}
          />
        </Tabs>
      </ProtectedRoute>
    );
  }

  // Render Doctor/Clinic Navigation
  if (user.role === 'doctor' || user.role === 'clinic') {
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
          <Tabs.Screen
            name="doctor/index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => (
                <Activity size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="appointments/index"
            options={{
              title: 'Appointments',
              tabBarIcon: ({ color }) => (
                <Calendar size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="doctor/patients"
            options={{
              title: 'Patients',
              tabBarIcon: ({ color }) => (
                <Users size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications/index"
            options={{
              title: 'Notifications',
              tabBarIcon: ({ color }) => (
                <Bell size={getResponsiveIconSize()} color={color} />
              ),
            }}
          />
          {/* Hide patient-only screens */}
          <Tabs.Screen
            name="patient"
            options={{ href: null }}
          />
          <Tabs.Screen
            name="clinics"
            options={{ href: null }}
          />
        </Tabs>
      </ProtectedRoute>
    );
  }

  // Default fallback for unknown roles
  return (
    <ProtectedRoute>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Unknown user role. Please contact support.</Text>
      </View>
    </ProtectedRoute>
  );
}
