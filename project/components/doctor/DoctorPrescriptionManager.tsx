import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorPrescriptionService, Prescription, PrescriptionCreate, MedicationInfo } from '../../services/doctorPrescriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CreatePrescriptionModal } from './CreatePrescriptionModal';
import { doctorPatientService } from '../../services/doctorPatientService';

const { width } = Dimensions.get('window');

type PrescriptionStatus = 'all' | 'active' | 'completed' | 'discontinued';

interface DoctorPrescriptionManagerProps {
  patientId?: string;
  onPatientSelect?: (patientId: string) => void;
}

export const DoctorPrescriptionManager: React.FC<DoctorPrescriptionManagerProps> = ({
  patientId,
  onPatientSelect
}) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PrescriptionStatus>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [medicationSearchResults, setMedicationSearchResults] = useState<MedicationInfo[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    completedPrescriptions: 0,
    prescriptionsThisMonth: 0,
    uniquePatients: 0,
    topMedications: [] as { medication: string; count: number }[]
  });

  // Form state
  const [form, setForm] = useState<PrescriptionCreate>({
    patient_id: patientId || '',
    doctor_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills_remaining: 0
  });

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchPrescriptions();
      fetchStats();
      if (!patientId) {
        fetchPatients();
      }
    }
  }, [doctorId, selectedStatus, searchTerm, patientId]);

  const fetchPatients = async () => {
    if (!doctorId) return;

    try {
      const { success, data, error } = await doctorPatientService.getPatients(doctorId);
      if (success && data) {
        setPatients(data.map(p => ({ id: p.id, first_name: p.first_name, last_name: p.last_name })));
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

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

  const fetchPrescriptions = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const filters = {
        patientId: patientId || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        medicationName: searchTerm || undefined
      };

      const { data, error } = await doctorPrescriptionService.getPrescriptions(doctorId, filters);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await doctorPrescriptionService.getPrescriptionStats(doctorId);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreatePrescription = async () => {
    if (!doctorId) return;

    // Validate form
    const validation = await doctorPrescriptionService.validatePrescription(form);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors?.join('\n') || 'Please check your input');
      return;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      Alert.alert(
        'Prescription Warnings',
        validation.warnings.join('\n\n') + '\n\nDo you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => createPrescription()
          }
        ]
      );
    } else {
      createPrescription();
    }
  };

  const createPrescription = async () => {
    try {
      const { success, data, error } = await doctorPrescriptionService.createPrescription(form);

      if (!success) {
        Alert.alert('Error', error || 'Failed to create prescription');
        return;
      }

      Alert.alert('Success', 'Prescription created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchPrescriptions();
      fetchStats();
    } catch (error) {
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription');
    }
  };

  const handleUpdatePrescription = async () => {
    if (!selectedPrescription || !doctorId) return;

    try {
      const { success, data, error } = await doctorPrescriptionService.updatePrescription(
        selectedPrescription.id,
        form,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to update prescription');
        return;
      }

      Alert.alert('Success', 'Prescription updated successfully');
      setShowEditModal(false);
      setSelectedPrescription(null);
      resetForm();
      fetchPrescriptions();
    } catch (error) {
      console.error('Error updating prescription:', error);
      Alert.alert('Error', 'Failed to update prescription');
    }
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    if (!doctorId) return;

    Alert.alert(
      'Delete Prescription',
      `Are you sure you want to delete the prescription for ${prescription.medication_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await doctorPrescriptionService.deletePrescription(
                prescription.id,
                doctorId
              );

              if (!success) {
                Alert.alert('Error', error || 'Failed to delete prescription');
                return;
              }

              Alert.alert('Success', 'Prescription deleted');
              fetchPrescriptions();
              fetchStats();
            } catch (error) {
              console.error('Error deleting prescription:', error);
              Alert.alert('Error', 'Failed to delete prescription');
            }
          }
        }
      ]
    );
  };

  const handleRefillPrescription = async (prescription: Prescription) => {
    if (!doctorId) return;

    try {
      const { success, error } = await doctorPrescriptionService.refillPrescription(
        prescription.id,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to refill prescription');
        return;
      }

      Alert.alert('Success', 'Prescription refilled successfully');
      fetchPrescriptions();
      fetchStats();
    } catch (error) {
      console.error('Error refilling prescription:', error);
      Alert.alert('Error', 'Failed to refill prescription');
    }
  };

  const handleSearchMedications = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setMedicationSearchResults([]);
      return;
    }

    try {
      const { data, error } = await doctorPrescriptionService.searchMedications(searchTerm);

      if (error) {
        console.error('Error searching medications:', error);
        return;
      }

      setMedicationSearchResults(data);
    } catch (error) {
      console.error('Error searching medications:', error);
    }
  };

  const selectMedication = (medication: MedicationInfo) => {
    setForm({
      ...form,
      medication_name: medication.name,
      dosage: medication.common_dosages[0] || '',
      frequency: medication.common_frequencies[0] || '',
      duration: medication.typical_duration
    });
    setShowMedicationSearch(false);
    setMedicationSearchResults([]);
  };

  const openEditModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setForm({
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      appointment_id: prescription.appointment_id,
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions || '',
      refills_remaining: prescription.refills_remaining || 0
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      patient_id: patientId || selectedPatientForPrescription?.id || '',
      doctor_id: doctorId || '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      refills_remaining: 0
    });
    setMedicationSearchResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'discontinued':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statusFilterContainer}
    >
      {(['all', 'active', 'completed', 'discontinued'] as PrescriptionStatus[]).map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.statusFilterButton,
            selectedStatus === status && styles.activeStatusFilter
          ]}
          onPress={() => setSelectedStatus(status)}
        >
          <Text style={[
            styles.statusFilterText,
            selectedStatus === status && styles.activeStatusFilterText
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPrescriptionCard = (prescription: Prescription) => (
    <View key={prescription.id} style={styles.prescriptionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{prescription.medication_name}</Text>
          <Text style={styles.dosage}>{prescription.dosage}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(prescription.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(prescription.status) }]}>
            {prescription.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.prescriptionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{prescription.frequency}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{prescription.duration}</Text>
        </View>
        {prescription.refills_remaining !== undefined && prescription.refills_remaining > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refills:</Text>
            <Text style={styles.detailValue}>{prescription.refills_remaining}</Text>
          </View>
        )}
      </View>

      {prescription.instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsLabel}>Instructions:</Text>
          <Text style={styles.instructionsText}>{prescription.instructions}</Text>
        </View>
      )}

      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>
          {prescription.patient.first_name} {prescription.patient.last_name}
        </Text>
        <Text style={styles.prescribedDate}>
          Prescribed: {formatDate(prescription.prescribed_at)}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(prescription)}
        >
          <Ionicons name="create" size={16} color="#2563EB" />
          <Text style={[styles.actionButtonText, { color: '#2563EB' }]}>Edit</Text>
        </TouchableOpacity>
        
        {prescription.status === 'active' && prescription.refills_remaining && prescription.refills_remaining > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.refillButton]}
            onPress={() => handleRefillPrescription(prescription)}
          >
            <Ionicons name="refresh" size={16} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Refill</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePrescription(prescription)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Prescription Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPrescriptions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.activePrescriptions}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.prescriptionsThisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.uniquePatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
      </View>
      
      {stats.topMedications.length > 0 && (
        <View style={styles.topMedicationsContainer}>
          <Text style={styles.topMedicationsTitle}>Top Medications</Text>
          {stats.topMedications.map((med, index) => (
            <View key={index} style={styles.topMedicationItem}>
              <Text style={styles.topMedicationName}>{med.medication}</Text>
              <Text style={styles.topMedicationCount}>{med.count} prescriptions</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prescriptions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (patientId) {
              setShowCreateModal(true);
            } else {
              setShowPatientSelector(true);
            }
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {!patientId && renderStatsCard()}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {renderStatusFilter()}

      <ScrollView 
        style={styles.prescriptionsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([fetchPrescriptions(), fetchStats()]);
              setRefreshing(false);
            }}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No prescriptions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try adjusting your search' : 'No prescriptions match the current filters'}
            </Text>
          </View>
        ) : (
          prescriptions.map(renderPrescriptionCard)
        )}
      </ScrollView>

      {/* Patient Selector Modal */}
      <Modal
        visible={showPatientSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPatientSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Patient</Text>
            <ScrollView style={styles.patientList}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientItem}
                  onPress={() => {
                    setSelectedPatientForPrescription({
                      id: patient.id,
                      name: `${patient.first_name} ${patient.last_name}`,
                    });
                    setShowPatientSelector(false);
                    setShowCreateModal(true);
                  }}
                >
                  <Ionicons name="person-circle" size={32} color="#2563EB" />
                  <View style={styles.patientItemInfo}>
                    <Text style={styles.patientItemName}>
                      {patient.first_name} {patient.last_name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowPatientSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Prescription Modal */}
      {(showCreateModal && (patientId || selectedPatientForPrescription)) && (
        <CreatePrescriptionModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedPatientForPrescription(null);
            resetForm();
          }}
          patientId={patientId || selectedPatientForPrescription?.id || ''}
          patientName={selectedPatientForPrescription?.name}
          onSuccess={() => {
            fetchPrescriptions();
            fetchStats();
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* Edit Prescription Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Prescription</Text>
            
            <Text style={styles.inputLabel}>Medication</Text>
            <TextInput
              style={styles.input}
              value={form.medication_name}
              onChangeText={(text) => setForm({ ...form, medication_name: text })}
            />

            <Text style={styles.inputLabel}>Dosage</Text>
            <TextInput
              style={styles.input}
              value={form.dosage}
              onChangeText={(text) => setForm({ ...form, dosage: text })}
            />

            <Text style={styles.inputLabel}>Frequency</Text>
            <TextInput
              style={styles.input}
              value={form.frequency}
              onChangeText={(text) => setForm({ ...form, frequency: text })}
            />

            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={form.duration}
              onChangeText={(text) => setForm({ ...form, duration: text })}
            />

            <Text style={styles.inputLabel}>Instructions (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.instructions}
              onChangeText={(text) => setForm({ ...form, instructions: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Refills</Text>
            <TextInput
              style={styles.input}
              value={form.refills_remaining?.toString() || '0'}
              onChangeText={(text) => setForm({ ...form, refills_remaining: parseInt(text) || 0 })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedPrescription(null);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdatePrescription}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  topMedicationsContainer: {
    marginTop: 8,
  },
  topMedicationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  topMedicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topMedicationName: {
    fontSize: 14,
    color: '#374151',
  },
  topMedicationCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  statusFilterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStatusFilter: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeStatusFilterText: {
    color: 'white',
  },
  prescriptionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  prescriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  instructionsLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#78350F',
  },
  patientInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginBottom: 12,
  },
  patientName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  prescribedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  refillButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: width - 32,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  medicationInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  medicationInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  medicationResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  medicationResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medicationResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  medicationResultCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  patientList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patientItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
