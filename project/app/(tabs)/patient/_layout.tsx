import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="clinics" />

      <Stack.Screen name="history" />
      <Stack.Screen name="history/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prescriptions" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}