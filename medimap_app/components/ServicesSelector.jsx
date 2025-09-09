import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ServicesSelector = ({ 
  servicesOptions = [], 
  selectedServices = [], 
  onServiceToggle, 
  style 
}) => {
  if (!servicesOptions.length) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noServicesText}>
          No specific services listed. You may describe your needs during the appointment.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Services Needed (Optional)</Text>
      <View style={styles.servicesContainer}>
        {servicesOptions.map((service) => {
          const isSelected = selectedServices.includes(service);
          return (
            <TouchableOpacity
              key={service}
              style={[
                styles.serviceChip,
                isSelected && styles.selectedServiceChip,
              ]}
              onPress={() => onServiceToggle(service)}
            >
              <Text
                style={[
                  styles.serviceChipText,
                  isSelected && styles.selectedServiceChipText,
                ]}
              >
                {service}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedServices.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  serviceChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedServiceChip: {
    backgroundColor: '#1a4fb4',
    borderColor: '#1a4fb4',
  },
  serviceChipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedServiceChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noServicesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  selectedCount: {
    fontSize: 12,
    color: '#1a4fb4',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ServicesSelector;
