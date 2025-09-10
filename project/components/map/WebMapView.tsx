import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, ClinicWithDetails } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const WebMapView: React.FC = () => {
  const [clinics, setClinics] = useState<ClinicWithDetails[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDetails | null>(null);

  useEffect(() => {
    fetchClinics();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Location error:', error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching clinics:', error);
        return;
      }

      setClinics(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const openDirections = (clinic: ClinicWithDetails) => {
    if (!clinic.latitude || !clinic.longitude) return;
    
    const destination = `${clinic.latitude},${clinic.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const openInGoogleMaps = (clinic: ClinicWithDetails) => {
    if (!clinic.latitude || !clinic.longitude) return;
    
    const url = `https://www.google.com/maps/@${clinic.latitude},${clinic.longitude},15z`;
    window.open(url, '_blank');
  };

  const renderClinicCard = (clinic: ClinicWithDetails) => {
    let distance = null;
    if (userLocation && clinic.latitude && clinic.longitude) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        clinic.latitude,
        clinic.longitude
      );
    }

    return (
      <View key={clinic.id} style={styles.clinicCard}>
        <View style={styles.clinicHeader}>
          <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
          {distance && (
            <Text style={styles.distanceText}>
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </Text>
          )}
        </View>
        
        <View style={styles.clinicDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={2}>
              {clinic.address}
            </Text>
          </View>
          
          {clinic.phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{clinic.phone}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {clinic.latitude?.toFixed(4)}, {clinic.longitude?.toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.clinicActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openInGoogleMaps(clinic)}
          >
            <Ionicons name="map" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View on Google Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.directionsButton]}
            onPress={() => openDirections(clinic)}
          >
            <Ionicons name="navigate" size={16} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading clinic locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clinic Locations</Text>
        <Text style={styles.headerSubtitle}>
          {userLocation 
            ? 'Sorted by distance from your location' 
            : 'Enable location to see distances'}
        </Text>
      </View>

      {/* Web Map Notice */}
      <View style={styles.webNotice}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.webNoticeText}>
          Interactive map is available on mobile. Click "View on Google Maps" to see locations.
        </Text>
      </View>

      {/* Clinic List */}
      <ScrollView style={styles.clinicsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.listTitle}>
          All Clinics ({clinics.length})
        </Text>
        {clinics
          .sort((a, b) => {
            if (!userLocation || !a.latitude || !a.longitude || !b.latitude || !b.longitude) {
              return a.clinic_name.localeCompare(b.clinic_name);
            }
            
            const distanceA = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.latitude,
              a.longitude
            );
            const distanceB = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.latitude,
              b.longitude
            );
            
            return distanceA - distanceB;
          })
          .map(renderClinicCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  webNoticeText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  clinicsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  clinicCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  clinicDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  clinicActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  directionsButton: {
    borderColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
});
