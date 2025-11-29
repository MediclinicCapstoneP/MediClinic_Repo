import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorPatientManagement } from '@/components/doctor/DoctorPatientManagement';
import { useRouter } from 'expo-router';

export default function PatientsScreen() {
  const router = useRouter();

  const handleAppointmentPress = (patientId: string) => {
    // Navigate to appointments filtered by patient
    router.push({
      pathname: '/(tabs)/appointments',
      params: { patientId }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <DoctorPatientManagement onAppointmentPress={handleAppointmentPress} />
    </SafeAreaView>
  );
}
