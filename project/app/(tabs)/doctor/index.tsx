import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProviderDashboard } from '@/components/dashboard/ProviderDashboard';

export default function DoctorDashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ProviderDashboard />
    </SafeAreaView>
  );
}

