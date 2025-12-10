import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorPrescriptionService, PrescriptionCreate, MedicationInfo } from '../../services/doctorPrescriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface CreatePrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId?: string;
  patientId: string;
  patientName?: string;
  onSuccess?: () => void;
}

export const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({
  visible,
  onClose,
  appointmentId,
  patientId,
  patientName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [medicationSearchResults, setMedicationSearchResults] = useState<MedicationInfo[]>([]);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [searchingMedications, setSearchingMedications] = useState(false);

  const [form, setForm] = useState<PrescriptionCreate>({
    patient_id: patientId,
    doctor_id: '',
    appointment_id: appointmentId,
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills_remaining: 0,
  });

  useEffect(() => {
    if (visible && user) {
      fetchDoctorId();
      setForm(prev => ({ ...prev, patient_id: patientId, appointment_id: appointmentId }));
    }
  }, [visible, user, patientId, appointmentId]);

  const fetchDoctorId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setDoctorId(data.id);
      setForm(prev => ({ ...prev, doctor_id: data.id }));
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  };

  const handleSearchMedications = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setMedicationSearchResults([]);
      setShowMedicationDropdown(false);
      return;
    }

    setSearchingMedications(true);
    setShowMedicationDropdown(true);

    try {
      const { data, error } = await doctorPrescriptionService.searchMedications(searchTerm);

      if (error) {
        console.error('Error searching medications:', error);
        return;
      }

      setMedicationSearchResults(data);
    } catch (error) {
      console.error('Error searching medications:', error);
    } finally {
      setSearchingMedications(false);
    }
  };

  const selectMedication = (medication: MedicationInfo) => {
    setForm({
      ...form,
      medication_name: medication.name,
      dosage: medication.common_dosages[0] || '',
      frequency: medication.common_frequencies[0] || '',
      duration: medication.typical_duration,
    });
    setShowMedicationDropdown(false);
    setMedicationSearchResults([]);
  };

  const handleCreatePrescription = async () => {
    if (!doctorId) {
      Alert.alert('Error', 'Doctor information not found');
      return;
    }

    // Validate form
    if (!form.medication_name.trim()) {
      Alert.alert('Validation Error', 'Please enter medication name');
      return;
    }

    if (!form.dosage.trim()) {
      Alert.alert('Validation Error', 'Please enter dosage');
      return;
    }

    if (!form.frequency.trim()) {
      Alert.alert('Validation Error', 'Please enter frequency');
      return;
    }

    if (!form.duration.trim()) {
      Alert.alert('Validation Error', 'Please enter duration');
      return;
    }

    setLoading(true);

    try {
      const validation = await doctorPrescriptionService.validatePrescription(form);
      
      if (!validation.valid) {
        Alert.alert('Validation Error', validation.errors?.join('\n') || 'Please check your input');
        setLoading(false);
        return;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        Alert.alert(
          'Prescription Warnings',
          validation.warnings.join('\n\n') + '\n\nDo you want to continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            {
              text: 'Continue',
              onPress: async () => {
                await createPrescription();
              }
            }
          ]
        );
        return;
      }

      await createPrescription();
    } catch (error) {
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription');
      setLoading(false);
    }
  };

  const createPrescription = async () => {
    try {
      const { success, data, error } = await doctorPrescriptionService.createPrescription(form);

      if (!success) {
        Alert.alert('Error', error || 'Failed to create prescription');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Prescription created successfully', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      patient_id: patientId,
      doctor_id: doctorId || '',
      appointment_id: appointmentId,
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      refills_remaining: 0,
    });
    setMedicationSearchResults([]);
    setShowMedicationDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Prescription</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {patientName && (
            <View style={styles.patientInfoCard}>
              <Ionicons name="person" size={20} color="#2563EB" />
              <Text style={styles.patientInfoText}>{patientName}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Medication Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Medication Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.medicationInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Search or enter medication name..."
                  value={form.medication_name}
                  onChangeText={(text) => {
                    setForm({ ...form, medication_name: text });
                    handleSearchMedications(text);
                  }}
                  onFocus={() => {
                    if (form.medication_name) {
                      handleSearchMedications(form.medication_name);
                    }
                  }}
                />
                {searchingMedications && (
                  <View style={styles.searchingIndicator}>
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                )}
                {showMedicationDropdown && medicationSearchResults.length > 0 && (
                  <View style={styles.medicationDropdown}>
                    <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                      {medicationSearchResults.map((med, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.medicationItem}
                          onPress={() => selectMedication(med)}
                        >
                          <View style={styles.medicationItemContent}>
                            <Text style={styles.medicationItemName}>{med.name}</Text>
                            <Text style={styles.medicationItemCategory}>{med.category}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Dosage */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Dosage <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 500mg, 10mg"
                value={form.dosage}
                onChangeText={(text) => setForm({ ...form, dosage: text })}
              />
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Frequency <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Every 8 hours, Once daily"
                value={form.frequency}
                onChangeText={(text) => setForm({ ...form, frequency: text })}
              />
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Duration <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7 days, 2 weeks"
                value={form.duration}
                onChangeText={(text) => setForm({ ...form, duration: text })}
              />
            </View>

            {/* Instructions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special instructions for the patient..."
                value={form.instructions}
                onChangeText={(text) => setForm({ ...form, instructions: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Refills */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Refills</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={form.refills_remaining?.toString() || '0'}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setForm({ ...form, refills_remaining: num });
                }}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreatePrescription}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="medical" size={18} color="white" />
                  <Text style={styles.createButtonText}>Create Prescription</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  patientInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  patientInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  scrollContent: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  medicationInputContainer: {
    position: 'relative',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  medicationDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medicationItemContent: {
    flex: 1,
  },
  medicationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  medicationItemCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    backgroundColor: '#2563EB',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

