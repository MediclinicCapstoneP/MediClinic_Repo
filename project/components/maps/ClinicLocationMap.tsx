import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';

interface Clinic {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  province?: string;
}

interface ClinicLocationMapProps {
  clinic: Clinic;
  onClose: () => void;
}

export const ClinicLocationMap: React.FC<ClinicLocationMapProps> = ({ clinic, onClose }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Request location permission and get user location
  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      setError('Unable to get your location. Please enable location services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Generate HTML for Leaflet map
  const generateMapHTML = () => {
    const clinicLat = clinic.latitude || 14.5995; // Default Manila coordinates
    const clinicLng = clinic.longitude || 120.9842;
    const userLat = userLocation?.lat || 14.5995;
    const userLng = userLocation?.lng || 120.9842;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Clinic Location Map</title>
        
        <!-- Leaflet CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        
        <!-- Leaflet Routing Machine CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .location-button {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            border: none;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          }
          .clinic-info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            max-height: 150px;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        
        <button class="location-button" onclick="centerOnUser()">
          📍 My Location
        </button>
        
        <div class="clinic-info">
          <h3 style="margin: 0 0 8px 0; color: #2563EB;">${clinic.name}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            ${clinic.address || 'Address not available'}
          </p>
          <p style="margin: 4px 0 0 0; color: #10B981; font-size: 12px;">
            🚗 Route calculated from your location
          </p>
        </div>

        <!-- Leaflet JS -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        
        <!-- Leaflet Routing Machine JS -->
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        
        <script>
          // Initialize map
          const map = L.map('map').setView([${userLat}, ${userLng}], 13);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Custom icons
          const userIcon = L.divIcon({
            html: '📍',
            iconSize: [30, 30],
            className: 'user-location-marker'
          });
          
          const clinicIcon = L.divIcon({
            html: '🏥',
            iconSize: [30, 30],
            className: 'clinic-marker'
          });
          
          // Add user location marker
          const userMarker = L.marker([${userLat}, ${userLng}], { icon: userIcon })
            .addTo(map)
            .bindPopup('Your Location');
          
          // Add clinic marker
          const clinicMarker = L.marker([${clinicLat}, ${clinicLng}], { icon: clinicIcon })
            .addTo(map)
            .bindPopup('<b>${clinic.name}</b><br>${clinic.address || "Address not available"}')
            .openPopup();
          
          // Add routing from user to clinic
          const routingControl = L.Routing.control({
            waypoints: [
              L.latLng(${userLat}, ${userLng}),
              L.latLng(${clinicLat}, ${clinicLng})
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: function() { return null; }, // Don't create additional markers
            lineOptions: {
              styles: [
                { color: '#2563EB', weight: 6, opacity: 0.7 }
              ]
            }
          }).addTo(map);
          
          // Fit map to show both markers and route
          const group = new L.featureGroup([userMarker, clinicMarker]);
          map.fitBounds(group.getBounds().pad(0.1));
          
          // Center on user location
          function centerOnUser() {
            map.setView([${userLat}, ${userLng}], 15);
            userMarker.openPopup();
          }
          
          // Handle routing errors
          routingControl.on('routeserror', function(e) {
            console.error('Routing error:', e);
          });
          
          // Notify React Native when route is calculated
          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            // Send route info to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'route_calculated',
              distance: (summary.totalDistance / 1000).toFixed(1) + ' km',
              duration: Math.round(summary.totalTime / 60) + ' min'
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'route_calculated') {
        console.log('Route calculated:', data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const openInMaps = () => {
    if (!clinic.latitude || !clinic.longitude) {
      Alert.alert('Error', 'Clinic coordinates not available');
      return;
    }

    // Show the coordinates in the alert for now
    // In production, this would open Google Maps with Linking.openURL()
    Alert.alert(
      'Open in Maps', 
      `This would open Google Maps with directions to:\n${clinic.name}\nLat: ${clinic.latitude}, Lng: ${clinic.longitude}`
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinic Location</Text>
        <TouchableOpacity onPress={openInMaps} style={styles.mapsButton}>
          <Ionicons name="map" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mapsButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
