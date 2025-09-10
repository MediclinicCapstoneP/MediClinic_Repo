import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClinicMapView } from '@/components/map/ClinicMapView';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ClinicMapView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
