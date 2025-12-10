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
import { doctorPatientService, PatientWithStats, PatientRecord, MedicalRecord } from '../../services/doctorPatientService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface DoctorPatientManagementProps {
  onAppointmentPress?: (patientId: string) => void;
}

export const DoctorPatientManagement: React.FC<DoctorPatientManagementProps> = ({
  onAppointmentPress
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    medical_history: '',
    allergies: '',
    medications: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId, searchTerm]);

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
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  };

  const fetchPatients = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const { data, error } = await doctorPatientService.getPatients(doctorId, searchTerm);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientPress = async (patient: PatientWithStats) => {
    setSelectedPatient(patient);
    setEditForm({
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || ''
    });
    setShowPatientDetails(true);
  };

  const handleEditPatient = () => {
    if (!selectedPatient) return;
    setShowEditModal(true);
  };

  const handleSavePatient = async () => {
    if (!selectedPatient || !doctorId) return;

    try {
      const { success, error } = await doctorPatientService.updatePatientRecord(
        selectedPatient.id,
        editForm,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to update patient record');
        return;
      }

      Alert.alert('Success', 'Patient record updated');
      setShowEditModal(false);
      fetchPatients();
      
      // Update selected patient with new data
      setSelectedPatient({
        ...selectedPatient,
        ...editForm
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      Alert.alert('Error', 'Failed to update patient record');
    }
  };

  const handleViewMedicalRecords = async () => {
    if (!selectedPatient || !doctorId) return;

    try {
      const { data, error } = await doctorPatientService.getMedicalRecords(
        selectedPatient.id,
        doctorId
      );

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setMedicalRecords(data);
      setShowMedicalRecords(true);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      Alert.alert('Error', 'Failed to load medical records');
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

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'Age not specified';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years old`;
  };

  const renderPatientCard = (patient: PatientWithStats) => (
    <TouchableOpacity
      key={patient.id}
      style={styles.patientCard}
      onPress={() => handlePatientPress(patient)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {patient.first_name} {patient.last_name}
          </Text>
          <Text style={styles.patientContact}>{patient.phone}</Text>
          <Text style={styles.patientEmail}>{patient.email}</Text>
          {patient.date_of_birth && (
            <Text style={styles.patientAge}>{calculateAge(patient.date_of_birth)}</Text>
          )}
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patient.appointmentCount}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          {patient.upcomingAppointments > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{patient.upcomingAppointments}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        {patient.lastAppointment && (
          <Text style={styles.lastVisit}>
            Last visit: {formatDate(patient.lastAppointment)}
          </Text>
        )}
        {patient.totalAmountSpent && patient.totalAmountSpent > 0 && (
          <Text style={styles.totalSpent}>
            Total spent: ₱{patient.totalAmountSpent.toFixed(2)}
          </Text>
        )}
        {patient.medical_history && (
          <Text style={styles.medicalInfo} numberOfLines={1}>
            Medical history: {patient.medical_history}
          </Text>
        )}
        {patient.allergies && (
          <Text style={styles.allergyInfo} numberOfLines={1}>
            Allergies: {patient.allergies}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMedicalRecord = (record: MedicalRecord) => (
    <View key={record.id} style={styles.medicalRecordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{formatDate(record.created_at)}</Text>
        {record.appointment && (
          <Text style={styles.recordAppointment}>
            Visit: {formatDate(record.appointment.appointment_date)}
          </Text>
        )}
      </View>
      
      <View style={styles.recordSection}>
        <Text style={styles.recordLabel}>Diagnosis:</Text>
        <Text style={styles.recordText}>{record.diagnosis}</Text>
      </View>
      
      <View style={styles.recordSection}>
        <Text style={styles.recordLabel}>Symptoms:</Text>
        <Text style={styles.recordText}>{record.symptoms}</Text>
      </View>
      
      <View style={styles.recordSection}>
        <Text style={styles.recordLabel}>Treatment:</Text>
        <Text style={styles.recordText}>{record.treatment}</Text>
      </View>
      
      {record.prescription && (
        <View style={styles.recordSection}>
          <Text style={styles.recordLabel}>Prescription:</Text>
          <Text style={styles.recordText}>{record.prescription}</Text>
        </View>
      )}
      
      {record.notes && (
        <View style={styles.recordSection}>
          <Text style={styles.recordLabel}>Notes:</Text>
          <Text style={styles.recordText}>{record.notes}</Text>
        </View>
      )}
      
      {(record.blood_pressure || record.heart_rate || record.temperature) && (
        <View style={styles.vitalsContainer}>
          <Text style={styles.vitalsTitle}>Vitals:</Text>
          <View style={styles.vitalsRow}>
            {record.blood_pressure && (
              <Text style={styles.vitalText}>BP: {record.blood_pressure}</Text>
            )}
            {record.heart_rate && (
              <Text style={styles.vitalText}>HR: {record.heart_rate}</Text>
            )}
            {record.temperature && (
              <Text style={styles.vitalText}>Temp: {record.temperature}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patients</Text>
        <Text style={styles.patientCount}>{patients.length} patients</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView 
        style={styles.patientsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchPatients();
              setRefreshing(false);
            }}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try adjusting your search' : 'No patients have been assigned to you yet'}
            </Text>
          </View>
        ) : (
          patients.map(renderPatientCard)
        )}
      </ScrollView>

      {/* Patient Details Modal */}
      <Modal
        visible={showPatientDetails}
        animationType="slide"
        onRequestClose={() => setShowPatientDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPatientDetails(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Patient Details</Text>
            <TouchableOpacity onPress={handleEditPatient}>
              <Ionicons name="create" size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {selectedPatient && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Personal Information</Text>
                <Text style={styles.detailText}>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </Text>
                <Text style={styles.detailText}>{selectedPatient.email}</Text>
                <Text style={styles.detailText}>{selectedPatient.phone}</Text>
                {selectedPatient.date_of_birth && (
                  <Text style={styles.detailText}>{calculateAge(selectedPatient.date_of_birth)}</Text>
                )}
                {selectedPatient.gender && (
                  <Text style={styles.detailText}>Gender: {selectedPatient.gender}</Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Medical Information</Text>
                {selectedPatient.medical_history && (
                  <Text style={styles.detailText}>
                    Medical History: {selectedPatient.medical_history}
                  </Text>
                )}
                {selectedPatient.allergies && (
                  <Text style={styles.detailText}>Allergies: {selectedPatient.allergies}</Text>
                )}
                {selectedPatient.medications && (
                  <Text style={styles.detailText}>Current Medications: {selectedPatient.medications}</Text>
                )}
              </View>

              {(selectedPatient.emergency_contact_name || selectedPatient.emergency_contact_phone) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Emergency Contact</Text>
                  {selectedPatient.emergency_contact_name && (
                    <Text style={styles.detailText}>{selectedPatient.emergency_contact_name}</Text>
                  )}
                  {selectedPatient.emergency_contact_phone && (
                    <Text style={styles.detailText}>{selectedPatient.emergency_contact_phone}</Text>
                  )}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Visit Statistics</Text>
                <Text style={styles.detailText}>Total Appointments: {selectedPatient.appointmentCount}</Text>
                <Text style={styles.detailText}>Upcoming: {selectedPatient.upcomingAppointments}</Text>
                {selectedPatient.lastAppointment && (
                  <Text style={styles.detailText}>
                    Last Visit: {formatDate(selectedPatient.lastAppointment)}
                  </Text>
                )}
                {selectedPatient.totalAmountSpent && (
                  <Text style={styles.detailText}>
                    Total Spent: ₱{selectedPatient.totalAmountSpent.toFixed(2)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.medicalRecordsButton}
                onPress={handleViewMedicalRecords}
              >
                <Ionicons name="folder-open" size={20} color="white" />
                <Text style={styles.medicalRecordsButtonText}>View Medical Records</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.appointmentsButton}
                onPress={() => onAppointmentPress?.(selectedPatient.id)}
              >
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.appointmentsButtonText}>View Appointments</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Edit Patient Record</Text>
            
            <Text style={styles.inputLabel}>Medical History</Text>
            <TextInput
              style={[styles.editInput, styles.textArea]}
              placeholder="Enter medical history..."
              value={editForm.medical_history}
              onChangeText={(text) => setEditForm({ ...editForm, medical_history: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Allergies</Text>
            <TextInput
              style={[styles.editInput, styles.textArea]}
              placeholder="Enter known allergies..."
              value={editForm.allergies}
              onChangeText={(text) => setEditForm({ ...editForm, allergies: text })}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Current Medications</Text>
            <TextInput
              style={[styles.editInput, styles.textArea]}
              placeholder="Enter current medications..."
              value={editForm.medications}
              onChangeText={(text) => setEditForm({ ...editForm, medications: text })}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Emergency Contact Name</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Enter emergency contact name..."
              value={editForm.emergency_contact_name}
              onChangeText={(text) => setEditForm({ ...editForm, emergency_contact_name: text })}
            />

            <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Enter emergency contact phone..."
              value={editForm.emergency_contact_phone}
              onChangeText={(text) => setEditForm({ ...editForm, emergency_contact_phone: text })}
            />

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSavePatient}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Medical Records Modal */}
      <Modal
        visible={showMedicalRecords}
        animationType="slide"
        onRequestClose={() => setShowMedicalRecords(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMedicalRecords(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Medical Records</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.medicalRecordsList}>
            {medicalRecords.length === 0 ? (
              <View style={styles.emptyRecordsContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyRecordsTitle}>No medical records</Text>
                <Text style={styles.emptyRecordsSubtitle}>No medical records found for this patient</Text>
              </View>
            ) : (
              medicalRecords.map(renderMedicalRecord)
            )}
          </ScrollView>
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
  patientCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  patientsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientAge: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastVisit: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalSpent: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 2,
  },
  medicalInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  allergyInfo: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  medicalRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicalRecordsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  appointmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
  },
  appointmentsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: width - 32,
    maxWidth: 400,
    maxHeight: '80%',
  },
  editModalTitle: {
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
  editInput: {
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
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editModalButton: {
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
  medicalRecordsList: {
    flex: 1,
    padding: 16,
  },
  medicalRecordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  recordAppointment: {
    fontSize: 12,
    color: '#6B7280',
  },
  recordSection: {
    marginBottom: 12,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recordText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  vitalsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  vitalsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 16,
    marginBottom: 2,
  },
  emptyRecordsContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyRecordsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyRecordsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
