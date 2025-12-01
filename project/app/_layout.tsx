import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { FloatingChatButton } from '../components/chatbot/FloatingChatButton';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
  });

  return (
    <AuthProvider>
      {fontsLoaded ? (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <FloatingChatButton />
        </>
      ) : null}
    </AuthProvider>
  );
}
