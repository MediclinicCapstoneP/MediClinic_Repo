import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from './SplashScreen';

export default function AuthNavigator() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after auth check is complete
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1000); // Give splash screen time to show

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show splash screen while loading or during initial app launch
  if (showSplash || loading) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If user is authenticated, show main app with tabs
  if (user) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }

  // If user is not authenticated, show login screen only
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
