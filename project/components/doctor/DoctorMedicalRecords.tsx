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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorMedicalRecordService, MedicalRecord, MedicalRecordCreate, ConsultationNote } from '../../services/doctorMedicalRecordService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface DoctorMedicalRecordsProps {
  patientId?: string;
  onPatientSelect?: (patientId: string) => void;
}

export const DoctorMedicalRecords: React.FC<DoctorMedicalRecordsProps> = ({
  patientId,
  onPatientSelect
}) => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'notes'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    recordsThisMonth: 0,
    recordsThisWeek: 0,
    uniquePatients: 0,
    commonDiagnoses: [] as { diagnosis: string; count: number }[],
    followUpRequired: 0
  });

  // Form states
  const [recordForm, setRecordForm] = useState<MedicalRecordCreate>({
    patient_id: patientId || '',
    doctor_id: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: '',
    follow_up_required: false,
    follow_up_date: '',
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    weight: undefined,
    height: undefined,
    allergies: '',
    chronic_conditions: '',
    medications: '',
    family_history: '',
    social_history: ''
  });

  const [noteForm, setNoteForm] = useState({
    patient_id: patientId || '',
    doctor_id: '',
    appointment_id: '',
    note_type: 'general' as const,
    title: '',
    content: '',
    is_private: false
  });

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchData();
      fetchStats();
    }
  }, [doctorId, patientId, searchTerm]);

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
      setRecordForm(prev => ({ ...prev, doctor_id: data.id }));
      setNoteForm(prev => ({ ...prev, doctor_id: data.id }));
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  };

  const fetchData = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const filters = {
        patientId: patientId || undefined
      };

      const [recordsResult, notesResult] = await Promise.all([
        doctorMedicalRecordService.getMedicalRecords(doctorId, filters),
        doctorMedicalRecordService.getConsultationNotes(doctorId, filters)
      ]);

      if (recordsResult.error) {
        Alert.alert('Error', recordsResult.error);
        return;
      }

      if (notesResult.error) {
        Alert.alert('Error', notesResult.error);
        return;
      }

      setMedicalRecords(recordsResult.data);
      setConsultationNotes(notesResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await doctorMedicalRecordService.getMedicalRecordStats(doctorId);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateMedicalRecord = async () => {
    if (!doctorId) return;

    // Validate required fields
    if (!recordForm.diagnosis.trim() || !recordForm.symptoms.trim() || !recordForm.treatment.trim()) {
      Alert.alert('Validation Error', 'Diagnosis, symptoms, and treatment are required');
      return;
    }

    try {
      const { success, data, error } = await doctorMedicalRecordService.createMedicalRecord(recordForm);

      if (!success) {
        Alert.alert('Error', error || 'Failed to create medical record');
        return;
      }

      Alert.alert('Success', 'Medical record created successfully');
      setShowCreateRecordModal(false);
      resetRecordForm();
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error creating medical record:', error);
      Alert.alert('Error', 'Failed to create medical record');
    }
  };

  const handleUpdateMedicalRecord = async () => {
    if (!selectedRecord || !doctorId) return;

    try {
      const { success, data, error } = await doctorMedicalRecordService.updateMedicalRecord(
        selectedRecord.id,
        recordForm,
        doctorId
      );

      if (!success) {
        Alert.alert('Error', error || 'Failed to update medical record');
        return;
      }

      Alert.alert('Success', 'Medical record updated successfully');
      setShowEditRecordModal(false);
      setSelectedRecord(null);
      resetRecordForm();
      fetchData();
    } catch (error) {
      console.error('Error updating medical record:', error);
      Alert.alert('Error', 'Failed to update medical record');
    }
  };

  const handleCreateConsultationNote = async () => {
    if (!doctorId) return;

    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      Alert.alert('Validation Error', 'Title and content are required');
      return;
    }

    try {
      const { success, data, error } = await doctorMedicalRecordService.createConsultationNote(noteForm);

      if (!success) {
        Alert.alert('Error', error || 'Failed to create consultation note');
        return;
      }

      Alert.alert('Success', 'Consultation note created successfully');
      setShowCreateNoteModal(false);
      resetNoteForm();
      fetchData();
    } catch (error) {
      console.error('Error creating consultation note:', error);
      Alert.alert('Error', 'Failed to create consultation note');
    }
  };

  const handleDeleteMedicalRecord = (record: MedicalRecord) => {
    if (!doctorId) return;

    Alert.alert(
      'Delete Medical Record',
      'Are you sure you want to delete this medical record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await doctorMedicalRecordService.deleteMedicalRecord(
                record.id,
                doctorId
              );

              if (!success) {
                Alert.alert('Error', error || 'Failed to delete medical record');
                return;
              }

              Alert.alert('Success', 'Medical record deleted');
              fetchData();
              fetchStats();
            } catch (error) {
              console.error('Error deleting medical record:', error);
              Alert.alert('Error', 'Failed to delete medical record');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setRecordForm({
      patient_id: record.patient_id,
      doctor_id: record.doctor_id,
      appointment_id: record.appointment_id,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms,
      treatment: record.treatment,
      prescription: record.prescription || '',
      notes: record.notes || '',
      follow_up_required: record.follow_up_required,
      follow_up_date: record.follow_up_date || '',
      blood_pressure: record.blood_pressure || '',
      heart_rate: record.heart_rate || '',
      temperature: record.temperature || '',
      weight: record.weight,
      height: record.height,
      allergies: record.allergies || '',
      chronic_conditions: record.chronic_conditions || '',
      medications: record.medications || '',
      family_history: record.family_history || '',
      social_history: record.social_history || ''
    });
    setShowEditRecordModal(true);
  };

  const resetRecordForm = () => {
    setRecordForm({
      patient_id: patientId || '',
      doctor_id: doctorId || '',
      appointment_id: '',
      diagnosis: '',
      symptoms: '',
      treatment: '',
      prescription: '',
      notes: '',
      follow_up_required: false,
      follow_up_date: '',
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      weight: undefined,
      height: undefined,
      allergies: '',
      chronic_conditions: '',
      medications: '',
      family_history: '',
      social_history: ''
    });
  };

  const resetNoteForm = () => {
    setNoteForm({
      patient_id: patientId || '',
      doctor_id: doctorId || '',
      appointment_id: '',
      note_type: 'general',
      title: '',
      content: '',
      is_private: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMedicalRecordCard = (record: MedicalRecord) => (
    <View key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordDate}>{formatDate(record.created_at)}</Text>
          <Text style={styles.patientName}>
            {record.patient.first_name} {record.patient.last_name}
          </Text>
        </View>
        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(record)}
          >
            <Ionicons name="create" size={16} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMedicalRecord(record)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recordContent}>
        <View style={styles.recordSection}>
          <Text style={styles.sectionLabel}>Diagnosis</Text>
          <Text style={styles.sectionContent}>{record.diagnosis}</Text>
        </View>

        <View style={styles.recordSection}>
          <Text style={styles.sectionLabel}>Symptoms</Text>
          <Text style={styles.sectionContent}>{record.symptoms}</Text>
        </View>

        <View style={styles.recordSection}>
          <Text style={styles.sectionLabel}>Treatment</Text>
          <Text style={styles.sectionContent}>{record.treatment}</Text>
        </View>

        {record.prescription && (
          <View style={styles.recordSection}>
            <Text style={styles.sectionLabel}>Prescription</Text>
            <Text style={styles.sectionContent}>{record.prescription}</Text>
          </View>
        )}

        {record.notes && (
          <View style={styles.recordSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.sectionContent}>{record.notes}</Text>
          </View>
        )}

        {(record.blood_pressure || record.heart_rate || record.temperature) && (
          <View style={styles.vitalsContainer}>
            <Text style={styles.sectionLabel}>Vitals</Text>
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

        {record.follow_up_required && (
          <View style={styles.followUpContainer}>
            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.followUpText}>
              Follow-up required: {record.follow_up_date || 'Date to be set'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderConsultationNoteCard = (note: ConsultationNote) => (
    <View key={note.id} style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteType}>{note.note_type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        {note.is_private && (
          <Ionicons name="lock-closed" size={16} color="#6B7280" />
        )}
      </View>

      <Text style={styles.noteContent}>{note.content}</Text>
      
      <Text style={styles.notePatient}>
        Patient: {note.patient.first_name} {note.patient.last_name}
      </Text>
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Medical Records Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalRecords}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.recordsThisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.uniquePatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.followUpRequired}</Text>
          <Text style={styles.statLabel}>Follow-ups</Text>
        </View>
      </View>
      
      {stats.commonDiagnoses.length > 0 && (
        <View style={styles.commonDiagnosesContainer}>
          <Text style={styles.commonDiagnosesTitle}>Common Diagnoses</Text>
          {stats.commonDiagnoses.map((diagnosis, index) => (
            <View key={index} style={styles.commonDiagnosisItem}>
              <Text style={styles.commonDiagnosisName}>{diagnosis.diagnosis}</Text>
              <Text style={styles.commonDiagnosisCount}>{diagnosis.count} cases</Text>
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
        <Text style={styles.loadingText}>Loading medical records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateRecordModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.noteButton]}
            onPress={() => setShowCreateNoteModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {!patientId && renderStatsCard()}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'records' && styles.activeTabButton]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'records' && styles.activeTabButtonText]}>
            Medical Records
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notes' && styles.activeTabButton]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'notes' && styles.activeTabButtonText]}>
            Consultation Notes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'records' && (
          <>
            {medicalRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No medical records found</Text>
                <Text style={styles.emptySubtitle}>Start by creating a new medical record</Text>
              </View>
            ) : (
              medicalRecords.map(renderMedicalRecordCard)
            )}
          </>
        )}

        {activeTab === 'notes' && (
          <>
            {consultationNotes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="create-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No consultation notes found</Text>
                <Text style={styles.emptySubtitle}>Add your first consultation note</Text>
              </View>
            ) : (
              consultationNotes.map(renderConsultationNoteCard)
            )}
          </>
        )}
      </ScrollView>

      {/* Create Medical Record Modal */}
      <Modal
        visible={showCreateRecordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} nestedScrollEnabled={false}>
            <Text style={styles.modalTitle}>New Medical Record</Text>
            
            <Text style={styles.inputLabel}>Diagnosis *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter diagnosis..."
              value={recordForm.diagnosis}
              onChangeText={(text) => setRecordForm({ ...recordForm, diagnosis: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Symptoms *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter symptoms..."
              value={recordForm.symptoms}
              onChangeText={(text) => setRecordForm({ ...recordForm, symptoms: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Treatment *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter treatment plan..."
              value={recordForm.treatment}
              onChangeText={(text) => setRecordForm({ ...recordForm, treatment: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Prescription</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter prescription..."
              value={recordForm.prescription}
              onChangeText={(text) => setRecordForm({ ...recordForm, prescription: text })}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes..."
              value={recordForm.notes}
              onChangeText={(text) => setRecordForm({ ...recordForm, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.vitalsSection}>
              <Text style={styles.sectionTitle}>Vitals</Text>
              <View style={styles.vitalsRow}>
                <View style={styles.vitalInput}>
                  <Text style={styles.inputLabel}>Blood Pressure</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="120/80"
                    value={recordForm.blood_pressure}
                    onChangeText={(text) => setRecordForm({ ...recordForm, blood_pressure: text })}
                  />
                </View>
                <View style={styles.vitalInput}>
                  <Text style={styles.inputLabel}>Heart Rate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="72"
                    value={recordForm.heart_rate}
                    onChangeText={(text) => setRecordForm({ ...recordForm, heart_rate: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.vitalsRow}>
                <View style={styles.vitalInput}>
                  <Text style={styles.inputLabel}>Temperature</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="37.0"
                    value={recordForm.temperature}
                    onChangeText={(text) => setRecordForm({ ...recordForm, temperature: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.vitalInput}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="70"
                    value={recordForm.weight?.toString() || ''}
                    onChangeText={(text) => setRecordForm({ ...recordForm, weight: parseFloat(text) || undefined })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateRecordModal(false);
                  resetRecordForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateMedicalRecord}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Medical Record Modal */}
      <Modal
        visible={showEditRecordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} nestedScrollEnabled={false}>
            <Text style={styles.modalTitle}>Edit Medical Record</Text>
            
            <Text style={styles.inputLabel}>Diagnosis *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recordForm.diagnosis}
              onChangeText={(text) => setRecordForm({ ...recordForm, diagnosis: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Symptoms *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recordForm.symptoms}
              onChangeText={(text) => setRecordForm({ ...recordForm, symptoms: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Treatment *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recordForm.treatment}
              onChangeText={(text) => setRecordForm({ ...recordForm, treatment: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Prescription</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recordForm.prescription}
              onChangeText={(text) => setRecordForm({ ...recordForm, prescription: text })}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recordForm.notes}
              onChangeText={(text) => setRecordForm({ ...recordForm, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditRecordModal(false);
                  setSelectedRecord(null);
                  resetRecordForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateMedicalRecord}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Consultation Note Modal */}
      <Modal
        visible={showCreateNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Consultation Note</Text>
            
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter note title..."
              value={noteForm.title}
              onChangeText={(text) => setNoteForm({ ...noteForm, title: text })}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.noteTypeContainer}>
              {['general', 'diagnosis', 'treatment', 'follow_up', 'prescription', 'vitals'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.noteTypeButton,
                    noteForm.note_type === type && styles.selectedNoteTypeButton
                  ]}
                  onPress={() => setNoteForm({ ...noteForm, note_type: type as any })}
                >
                  <Text style={[
                    styles.noteTypeButtonText,
                    noteForm.note_type === type && styles.selectedNoteTypeButtonText
                  ]}>
                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter note content..."
              value={noteForm.content}
              onChangeText={(text) => setNoteForm({ ...noteForm, content: text })}
              multiline
              numberOfLines={5}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateNoteModal(false);
                  resetNoteForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateConsultationNote}
              >
                <Text style={styles.saveButtonText}>Create</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteButton: {
    backgroundColor: '#8B5CF6',
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
  commonDiagnosesContainer: {
    marginTop: 8,
  },
  commonDiagnosesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  commonDiagnosisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  commonDiagnosisName: {
    fontSize: 14,
    color: '#374151',
  },
  commonDiagnosisCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  recordContent: {
    gap: 12,
  },
  recordSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  sectionContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  vitalsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalText: {
    fontSize: 12,
    color: '#6B7280',
  },
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  followUpText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 4,
  },
  noteCard: {
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteInfo: {
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  noteType: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  noteContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  notePatient: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
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
  vitalsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  vitalInput: {
    flex: 1,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  noteTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedNoteTypeButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  noteTypeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  selectedNoteTypeButtonText: {
    color: 'white',
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
});
