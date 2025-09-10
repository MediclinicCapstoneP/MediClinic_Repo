import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, Star, Clock, Heart } from 'lucide-react-native';

interface ClinicCardProps {
  clinic: {
    id: string;
    name: string;
    address: string;
    rating: number;
    distance: string;
    price: string;
    image: string;
    specialties?: string[];
    openHours?: string;
  };
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function ClinicCard({
  clinic,
  onPress,
  onFavorite,
  isFavorite = false,
}: ClinicCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: clinic.image }} style={styles.image} />
      
      <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
        <Heart
          size={20}
          color={isFavorite ? '#DC2626' : '#6B7280'}
          fill={isFavorite ? '#DC2626' : 'transparent'}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.name}>{clinic.name}</Text>
        
        <View style={styles.row}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.address}>{clinic.address}</Text>
        </View>

        {clinic.openHours && (
          <View style={styles.row}>
            <Clock size={14} color="#059669" />
            <Text style={styles.openHours}>{clinic.openHours}</Text>
          </View>
        )}

        {clinic.specialties && (
          <View style={styles.specialties}>
            {clinic.specialties.slice(0, 2).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {clinic.specialties.length > 2 && (
              <Text style={styles.moreSpecialties}>
                +{clinic.specialties.length - 2} more
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{clinic.rating}</Text>
          </View>
          <Text style={styles.distance}>{clinic.distance}</Text>
          <Text style={styles.price}>{clinic.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  openHours: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialtyText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
  },
  price: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
});