import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');

interface Clinic {
  id: string;
  clinic_name: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  status: string;
}

interface ClinicWithDetails extends Clinic {
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const NativeMapView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<ClinicWithDetails[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDetails | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749, // San Francisco default
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
    fetchClinics();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see nearby clinics and your current location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLocationPermission(false);
        return;
      }
      
      setLocationPermission(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });
      
      const userPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userPos);
      
      // Update region to center on user location
      setRegion({
        latitude: userPos.latitude,
        longitude: userPos.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error', 
        'Unable to get your current location. Make sure location services are enabled.'
      );
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
        Alert.alert('Error', 'Failed to load clinic locations');
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

  const handleMarkerPress = (clinic: ClinicWithDetails) => {
    setSelectedClinic(clinic);
    
    // Animate to clinic location
    if (mapRef.current && clinic.latitude && clinic.longitude) {
      mapRef.current.animateToRegion({
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const openDirections = (clinic: ClinicWithDetails) => {
    if (!clinic.latitude || !clinic.longitude) return;
    
    const destination = `${clinic.latitude},${clinic.longitude}`;
    const label = encodeURIComponent(clinic.clinic_name);
    
    if (Platform.OS === 'ios') {
      // iOS Maps
      const url = `http://maps.apple.com/?daddr=${destination}&dirflg=d&t=m&ll=${destination}`;
      Linking.openURL(url);
    } else {
      // Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`;
      Linking.openURL(url);
    }
  };

  const centerOnUser = () => {
    if (!userLocation) {
      Alert.alert('Location Unavailable', 'Your location is not available. Please enable location services.');
      return;
    }
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
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
        </View>

        <View style={styles.clinicActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkerPress(clinic)}
          >
            <Ionicons name="location" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View on Map</Text>
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
      {/* Map Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Nearby Clinics</Text>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={centerOnUser}
          disabled={!userLocation}
        >
          <Ionicons 
            name="locate" 
            size={24} 
            color={userLocation ? "#3B82F6" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChange={setRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          followsUserLocation={false}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          {/* Clinic Markers */}
          {clinics.map((clinic) => (
            clinic.latitude && clinic.longitude ? (
              <Marker
                key={clinic.id}
                coordinate={{
                  latitude: clinic.latitude,
                  longitude: clinic.longitude,
                }}
                title={clinic.clinic_name}
                description={clinic.address}
                onPress={() => handleMarkerPress(clinic)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="medical" size={24} color="#FFFFFF" />
                </View>
              </Marker>
            ) : null
          ))}
        </MapView>
      </View>

      {/* Selected Clinic Details */}
      {selectedClinic && (
        <View style={styles.selectedClinicContainer}>
          <View style={styles.selectedClinicHeader}>
            <Text style={styles.selectedClinicTitle}>Selected Clinic</Text>
            <TouchableOpacity onPress={() => setSelectedClinic(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {renderClinicCard(selectedClinic)}
        </View>
      )}

      {/* Clinic List */}
      <View style={styles.clinicListContainer}>
        <Text style={styles.listTitle}>
          All Clinics ({clinics.length})
        </Text>
        <ScrollView 
          style={styles.clinicList}
          showsVerticalScrollIndicator={false}
        >
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: height * 0.4,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedClinicContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedClinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedClinicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  clinicListContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clinicList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clinicCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
