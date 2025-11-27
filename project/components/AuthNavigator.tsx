import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export function AuthNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.replace('/(auth)/login');
      } else {
        // Authenticated, redirect based on role
        const roleRoutes = {
          patient: '/(tabs)/patient',
          clinic: '/(tabs)/doctor', // Clinic uses doctor interface for now
          doctor: '/(tabs)/doctor',
        };
        
        const targetRoute = roleRoutes[user.role];
        if (targetRoute) {
          router.replace(targetRoute as any);
        }
      }
    }
  }, [user, loading]);

  return null; // This component doesn't render anything
}
