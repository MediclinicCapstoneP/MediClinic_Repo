import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentWithDetails } from '../../lib/supabase';
import { CreatePrescriptionModal } from './CreatePrescriptionModal';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface PatientDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: AppointmentWithDetails | null;
  onStatusUpdate?: () => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  visible,
  onClose,
  appointment,
  onStatusUpdate,
}) => {
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (visible && appointment?.patient_id) {
      fetchPatientDetails();
    }
  }, [visible, appointment]);

  const fetchPatientDetails = async () => {
    if (!appointment?.patient_id) return;

    setLoadingDetails(true);
    try {
      // Try to fetch patient details, but don't fail if patient doesn't exist
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', appointment.patient_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Only log non-"no rows" errors
        console.error('Error fetching patient details:', error);
      } else if (data) {
        setPatientDetails(data);
      } else {
        // Patient not found in patients table, but we have data from appointment
        // This is okay - we'll use the appointment.patient data
        setPatientDetails(null);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      // Don't set error state, just use appointment.patient data
      setPatientDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'payment_confirmed':
        return '#10B981';
      case 'scheduled':
      case 'assigned':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (!appointment) return null;

  const patient = appointment.patient || {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Appointment Info */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color="#2563EB" />
                  <Text style={styles.sectionTitle}>Appointment Information</Text>
                </View>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(appointment.appointment_date)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Time:</Text>
                    <Text style={styles.infoValue}>{formatTime(appointment.appointment_time)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>
                      {appointment.appointment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                        {appointment.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  {appointment.total_amount && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Amount:</Text>
                      <Text style={styles.infoValue}>₱{appointment.total_amount.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Patient Info */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={20} color="#2563EB" />
                  <Text style={styles.sectionTitle}>Patient Information</Text>
                </View>
                <View style={styles.infoCard}>
                  <View style={styles.patientHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {patient.first_name?.[0] || ''}{patient.last_name?.[0] || ''}
                      </Text>
                    </View>
                    <View style={styles.patientNameContainer}>
                      <Text style={styles.patientName}>
                        {patient.first_name} {patient.last_name}
                      </Text>
                    </View>
                  </View>

                  {loadingDetails ? (
                    <ActivityIndicator size="small" color="#2563EB" style={styles.loader} />
                  ) : (
                    <>
                      {patientDetails?.date_of_birth && (
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Date of Birth:</Text>
                          <Text style={styles.infoValue}>
                            {formatDate(patientDetails.date_of_birth)}
                          </Text>
                        </View>
                      )}
                      {patient.email && (
                        <View style={styles.infoRow}>
                          <Ionicons name="mail" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Email:</Text>
                          <Text style={styles.infoValue}>{patient.email}</Text>
                        </View>
                      )}
                      {patient.phone && (
                        <View style={styles.infoRow}>
                          <Ionicons name="call" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Phone:</Text>
                          <Text style={styles.infoValue}>{patient.phone}</Text>
                        </View>
                      )}
                      {patientDetails?.gender && (
                        <View style={styles.infoRow}>
                          <Ionicons name="person-outline" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Gender:</Text>
                          <Text style={styles.infoValue}>{patientDetails.gender}</Text>
                        </View>
                      )}
                      {patientDetails?.address && (
                        <View style={styles.infoRow}>
                          <Ionicons name="location" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Address:</Text>
                          <Text style={styles.infoValue}>{patientDetails.address}</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>

              {/* Medical Information */}
              {(patientDetails?.medical_history || patientDetails?.allergies || appointment.symptoms) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="medical" size={20} color="#2563EB" />
                    <Text style={styles.sectionTitle}>Medical Information</Text>
                  </View>
                  <View style={styles.infoCard}>
                    {appointment.symptoms && (
                      <View style={styles.medicalInfoItem}>
                        <Text style={styles.medicalLabel}>Symptoms:</Text>
                        <Text style={styles.medicalValue}>{appointment.symptoms}</Text>
                      </View>
                    )}
                    {patientDetails?.medical_history && (
                      <View style={styles.medicalInfoItem}>
                        <Text style={styles.medicalLabel}>Medical History:</Text>
                        <Text style={styles.medicalValue}>{patientDetails.medical_history}</Text>
                      </View>
                    )}
                    {patientDetails?.allergies && (
                      <View style={[styles.medicalInfoItem, styles.allergyItem]}>
                        <Ionicons name="warning" size={16} color="#EF4444" />
                        <View style={styles.allergyContent}>
                          <Text style={styles.medicalLabel}>Allergies:</Text>
                          <Text style={[styles.medicalValue, styles.allergyText]}>
                            {patientDetails.allergies}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Notes */}
              {appointment.notes && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text" size={20} color="#2563EB" />
                    <Text style={styles.sectionTitle}>Consultation Notes</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.notesText}>{appointment.notes}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {(appointment.status === 'in_progress' || appointment.status === 'completed' || appointment.status === 'assigned') && (
                <TouchableOpacity
                  style={styles.prescriptionButton}
                  onPress={() => setShowPrescriptionModal(true)}
                >
                  <Ionicons name="medical" size={20} color="white" />
                  <Text style={styles.prescriptionButtonText}>Create Prescription</Text>
                </TouchableOpacity>
              )}
              {appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'payment_confirmed' || appointment.status === 'assigned' ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={async () => {
                    try {
                      const { error } = await supabase
                        .from('appointments')
                        .update({ 
                          status: 'in_progress',
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', appointment.id);
                      
                      if (error) {
                        // Try doctor_appointments table
                        await supabase
                          .from('doctor_appointments')
                          .update({ 
                            status: 'in_progress',
                            updated_at: new Date().toISOString()
                          })
                          .eq('appointment_id', appointment.id);
                      }
                      
                      onClose();
                      if (onStatusUpdate) onStatusUpdate();
                    } catch (error) {
                      console.error('Error starting consultation:', error);
                    }
                  }}
                >
                  <Ionicons name="play" size={18} color="white" />
                  <Text style={styles.startButtonText}>Start Consultation</Text>
                </TouchableOpacity>
              ) : appointment.status === 'in_progress' ? (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={async () => {
                    try {
                      const { error } = await supabase
                        .from('appointments')
                        .update({ 
                          status: 'completed',
                          completed_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', appointment.id);
                      
                      if (error) {
                        // Try doctor_appointments table
                        await supabase
                          .from('doctor_appointments')
                          .update({ 
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          })
                          .eq('appointment_id', appointment.id);
                      }
                      
                      onClose();
                      if (onStatusUpdate) onStatusUpdate();
                    } catch (error) {
                      console.error('Error completing consultation:', error);
                    }
                  }}
                >
                  <Ionicons name="checkmark" size={18} color="white" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Prescription Modal */}
      {appointment && (
        <CreatePrescriptionModal
          visible={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          appointmentId={appointment.id}
          patientId={appointment.patient_id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          onSuccess={() => {
            setShowPrescriptionModal(false);
            if (onStatusUpdate) onStatusUpdate();
          }}
        />
      )}
    </>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  patientNameContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loader: {
    marginVertical: 20,
  },
  medicalInfoItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  medicalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  medicalValue: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  allergyItem: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  allergyContent: {
    flex: 1,
    marginLeft: 8,
  },
  allergyText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  prescriptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  prescriptionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

