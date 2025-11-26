import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { FloatingChatButton } from '../components/chatbot/FloatingChatButton';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <FloatingChatButton />
      </ProtectedRoute>
    </AuthProvider>
  );
}
