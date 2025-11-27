import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';

export default function DoctorDashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <DoctorDashboard />
    </SafeAreaView>
  );
}

