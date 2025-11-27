import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['patient', 'clinic', 'doctor'],
  redirectTo = '/(auth)/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.replace(redirectTo as any);
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect based on their role
        const roleRoutes = {
          patient: '/(tabs)/patient',
          clinic: '/(tabs)/clinic',
          doctor: '/(tabs)/doctor',
        };
        router.replace(roleRoutes[user.role] as any || '/(auth)/login');
        return;
      }
    }
  }, [user, loading, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
