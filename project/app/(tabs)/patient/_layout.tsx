import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="clinics" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}