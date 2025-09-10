import { Tabs } from 'expo-router';
import { Home, Calendar, User, Stethoscope, Settings, Users, FileText, Activity } from 'lucide-react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

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
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
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
                <tab.icon size={size} color={color} />
              ),
              href: user && tab.allowedRoles.includes(user.role) ? undefined : null,
            }}
          />
        ))}
      </Tabs>
    </ProtectedRoute>
  );
}