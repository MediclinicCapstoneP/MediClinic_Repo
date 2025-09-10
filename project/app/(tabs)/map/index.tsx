import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClinicMapView } from '@/components/map/ClinicMapView';

export default function MapScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ClinicMapView />
    </SafeAreaView>
  );
}
