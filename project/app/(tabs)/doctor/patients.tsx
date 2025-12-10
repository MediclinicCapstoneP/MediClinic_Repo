import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PatientMedicalHistory } from '@/lib/supabase';
import { SkeletonBox, SkeletonStatCard, SkeletonPatientCard } from '@/components/SkeletonLoader';
import { doctorPatientService, PatientWithStats } from '@/services/doctorPatientService';
import { patientHistoryService } from '@/services/patientHistoryService';
import { DoctorMedicalRecords } from '@/components/doctor/DoctorMedicalRecords';
import { CreatePrescriptionModal } from '@/components/doctor/CreatePrescriptionModal';

type DoctorPatientSummary = {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  totalRecords: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  lastVisitLabel?: string;
  nextAppointmentLabel?: string;
};

type TimelineEntry = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: string;
  timestamp: number;
};

const UPCOMING_STATUSES = new Set(['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

const INITIAL_SUMMARY: DoctorPatientSummary = {
  totalAppointments: 0,
  completedAppointments: 0,
  upcomingAppointments: 0,
  cancelledAppointments: 0,
  totalRecords: 0,
  totalPrescriptions: 0,
  activePrescriptions: 0,
};

export default function PatientsScreen() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientMedicalHistory | null>(null);
  const [historySummary, setHistorySummary] = useState<DoctorPatientSummary>(INITIAL_SUMMARY);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.trim().toLowerCase();
    return patients.filter((patient) =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(query) ||
      (patient.email ?? '').toLowerCase().includes(query) ||
      (patient.phone ?? '').toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const overviewStats = useMemo(() => {
    const totalPatients = patients.length;
    const upcomingVisits = patients.reduce((sum, patient) => sum + (patient.upcomingAppointments || 0), 0);
    const seenRecently = patients.filter((patient) => {
      if (!patient.lastAppointment) return false;
      const appointmentDate = new Date(patient.lastAppointment);
      const now = new Date();
      const diffDays = (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length;

    return [
      { label: 'Total Patients', value: totalPatients },
      { label: 'Upcoming Visits', value: upcomingVisits },
      { label: 'Seen in 30 days', value: seenRecently },
    ];
  }, [patients]);

  const loadPatients = useCallback(async (id: string) => {
    try {
      const { success, data, error } = await doctorPatientService.getPatients(id);
      if (!success) {
        throw new Error(error || 'Failed to load patients');
      }
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'We could not load your patients right now.');
    }
  }, []);

  const loadDoctorContext = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Doctor profile not found');

      setDoctorId(data.id);
      await loadPatients(data.id);
    } catch (error) {
      console.error('Error loading doctor context:', error);
      Alert.alert('Error', 'Unable to load your doctor profile.');
    } finally {
      setLoading(false);
    }
  }, [loadPatients, user]);

  const loadPatientHistory = useCallback(async (patientId: string) => {
    if (!doctorId) return;

    setHistoryLoading(true);
    setHistoryError(null);
    setHistorySummary(INITIAL_SUMMARY);
    setTimeline([]);

    try {
      const response = await patientHistoryService.getPatientHistory(patientId);

      if (!response.success || !response.history) {
        setHistoryError(response.error ?? 'Unable to load patient history.');
        setPatientHistory(null);
        return;
      }

      const filtered = filterHistoryForDoctor(response.history, doctorId);
      setPatientHistory(filtered);
      setHistorySummary(buildDoctorSummary(filtered));
      setTimeline(buildTimelineEntries(filtered));
    } catch (error) {
      console.error('Error loading patient history:', error);
      setHistoryError('Unable to load patient history right now.');
      setPatientHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (user) {
      loadDoctorContext();
    }
  }, [loadDoctorContext, user]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory(selectedPatient.id);
    }
  }, [loadPatientHistory, selectedPatient]);

  const onRefresh = useCallback(async () => {
    if (!doctorId) return;
    setRefreshing(true);
    try {
      await loadPatients(doctorId);
    } finally {
      setRefreshing(false);
    }
  }, [doctorId, loadPatients]);

  const handlePatientPress = useCallback((patient: PatientWithStats) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  }, []);

  const closePatientDetails = useCallback(() => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setPatientHistory(null);
    setHistorySummary(INITIAL_SUMMARY);
    setTimeline([]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.header}>
          {loading ? (
            <>
              <SkeletonBox width={140} height={26} style={{ marginBottom: 8 }} />
              <SkeletonBox width={220} height={16} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Patient Roster</Text>
              <Text style={styles.subtitle}>Monitor care progress and take action quickly</Text>
            </>
          )}
        </View>

        <View style={styles.searchContainer}>
          {loading ? (
            <SkeletonBox width="100%" height={50} borderRadius={14} />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients by name, email, or phone"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.statsContainer}>
          {loading ? (
            [1, 2, 3].map((item) => <SkeletonStatCard key={item} />)
          ) : (
            overviewStats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Assigned Patients</Text>
          <Text style={styles.listMeta}>{filteredPatients.length} of {patients.length}</Text>
        </View>

        <View style={styles.patientsList}>
          {loading ? (
            [1, 2, 3, 4].map((item) => <SkeletonPatientCard key={item} />)
          ) : filteredPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color="#CBD5F5" />
              <Text style={styles.emptyTitle}>No patients yet</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search keyword or reset the filters.'
                  : 'Patients will appear here once appointments are confirmed.'}
              </Text>
            </View>
          ) : (
            filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => handlePatientPress(patient)}
                activeOpacity={0.85}
              >
                <View style={styles.patientHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(patient.first_name, patient.last_name)}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {patient.first_name} {patient.last_name}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="mail" size={14} color="#64748B" />
                      <Text style={styles.metaText}>{patient.email || 'No email on file'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="call" size={14} color="#64748B" />
                      <Text style={styles.metaText}>{patient.phone || 'No phone on file'}</Text>
                    </View>
                  </View>
                  <View style={styles.patientTags}>
                    {patient.upcomingAppointments > 0 && (
                      <View style={styles.tag}>
                        <Ionicons name="calendar" size={12} color="#3B82F6" />
                        <Text style={styles.tagText}>{patient.upcomingAppointments} upcoming</Text>
                      </View>
                    )}
                    {patient.lastAppointment && (
                      <View style={[styles.tag, styles.neutralTag]}>
                        <Ionicons name="time" size={12} color="#6B7280" />
                        <Text style={styles.tagText}>Last {formatShortDate(patient.lastAppointment)}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.patientFooter}>
                  {patient.medical_history && (
                    <View style={styles.footerPill}>
                      <Ionicons name="medkit" size={12} color="#2563EB" />
                      <Text style={styles.footerText} numberOfLines={1}>
                        {patient.medical_history}
                      </Text>
                    </View>
                  )}
                  {patient.allergies && (
                    <View style={[styles.footerPill, styles.alertPill]}>
                      <Ionicons name="alert-circle" size={12} color="#DC2626" />
                      <Text style={[styles.footerText, styles.alertText]} numberOfLines={1}>
                        Allergies: {patient.allergies}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <ModalPanel
        visible={showPatientDetails}
        onClose={closePatientDetails}
        title="Patient Overview"
      >
        {selectedPatient ? (
          historyLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Fetching medical history…</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={[styles.avatar, styles.detailAvatar]}>
                  <Text style={styles.avatarText}>
                    {getInitials(selectedPatient.first_name, selectedPatient.last_name)}
                  </Text>
                </View>
                <View style={styles.detailHeaderInfo}>
                  <Text style={styles.detailName}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </Text>
                  <Text style={styles.detailSubtext}>{selectedPatient.email || 'No email on file'}</Text>
                  <Text style={styles.detailSubtext}>{selectedPatient.phone || 'No phone on file'}</Text>
                  {selectedPatient.date_of_birth && (
                    <Text style={styles.detailSubtle}>DOB: {formatLongDate(selectedPatient.date_of_birth)}</Text>
                  )}
                </View>
              </View>

              {historyError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={16} color="#B91C1C" />
                  <Text style={styles.errorText}>{historyError}</Text>
                </View>
              )}

              <View style={styles.summaryGrid}>
                <SummaryCard label="Appointments" value={historySummary.totalAppointments} detail={`${historySummary.completedAppointments} completed`} icon="calendar" />
                <SummaryCard label="Upcoming" value={historySummary.upcomingAppointments} detail={historySummary.nextAppointmentLabel || 'No upcoming visits'} icon="time" accent="#3B82F6" />
                <SummaryCard label="Records" value={historySummary.totalRecords} detail="Doctor-authored" icon="folder" accent="#2563EB" />
                <SummaryCard label="Prescriptions" value={historySummary.totalPrescriptions} detail={`${historySummary.activePrescriptions} active`} icon="medkit" accent="#10B981" />
              </View>

              {patientHistory?.summary && (
                <View style={styles.highlightSection}>
                  <Text style={styles.sectionTitle}>Care Highlights</Text>
                  <View style={styles.highlightRow}>
                    {renderHighlightChips('Chronic conditions', patientHistory.summary.chronic_conditions)}
                    {renderHighlightChips('Current medications', patientHistory.summary.current_medications)}
                  </View>
                </View>
              )}

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {timeline.length > 0 && (
                  <Text style={styles.sectionMeta}>last {timeline.length} items</Text>
                )}
              </View>

              {timeline.length === 0 ? (
                <View style={styles.emptyTimeline}>
                  <Ionicons name="trending-up" size={32} color="#CBD5F5" />
                  <Text style={styles.emptyTimelineTitle}>No recent items yet</Text>
                  <Text style={styles.emptyTimelineSubtitle}>Actions you complete for this patient will appear here.</Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {timeline.map((item) => (
                    <View key={item.id} style={styles.timelineCard}>
                      <View style={styles.timelineIcon}>
                        <Ionicons name={item.icon} size={16} color="#2563EB" />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                        <Text style={styles.timelineMeta}>{item.meta}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setShowMedicalRecords(true)}
                >
                  <Ionicons name="folder-open" size={18} color="#2563EB" />
                  <Text style={[styles.modalButtonText, styles.secondaryButtonText]}>Medical records workspace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.prescriptionButton]}
                  onPress={() => setShowPrescriptionModal(true)}
                >
                  <Ionicons name="medical" size={18} color="white" />
                  <Text style={styles.modalPrimaryText}>Create Prescription</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButtonRounded]}
                  onPress={() => setShowMedicalRecords(true)}
                >
                  <Ionicons name="create" size={18} color="white" />
                  <Text style={styles.modalPrimaryText}>Add consultation note</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Select a patient to view details.</Text>
          </View>
        )}
      </ModalPanel>

      <ModalPanel
        visible={showMedicalRecords}
        onClose={() => setShowMedicalRecords(false)}
        title="Medical Records"
        fullHeight
      >
        {selectedPatient ? (
          <DoctorMedicalRecords patientId={selectedPatient.id} />
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Select a patient to manage records.</Text>
          </View>
        )}
      </ModalPanel>

      {/* Create Prescription Modal */}
      {selectedPatient && (
        <CreatePrescriptionModal
          visible={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          onSuccess={() => {
            if (selectedPatient) {
              loadPatientHistory(selectedPatient.id);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

type ModalPanelProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullHeight?: boolean;
};

const ModalPanel: React.FC<ModalPanelProps> = ({ visible, onClose, title, children, fullHeight }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <SafeAreaView style={[styles.modalOverlay, fullHeight && styles.modalOverlayFull]}>
      <View style={[styles.modalShell, fullHeight && styles.modalShellFull]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.modalBody}>{children}</View>
      </View>
    </SafeAreaView>
  </Modal>
);

type SummaryCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: string;
  accent?: string;
};

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, detail, icon, accent = '#0F172A' }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIcon, { backgroundColor: `${accent}12` }]}>
      <Ionicons name={icon} size={18} color={accent} />
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={[styles.summaryLabel, { color: accent }]}>{label}</Text>
    <Text style={styles.summaryMeta}>{detail}</Text>
  </View>
);

const filterHistoryForDoctor = (history: PatientMedicalHistory, doctorId: string): PatientMedicalHistory => {
  const filterByDoctorId = <T extends { doctor_id?: string | null }>(items?: T[] | null) =>
    (items ?? []).filter((item) => item.doctor_id === doctorId);

  return {
    ...history,
    appointments: (history.appointments || []).filter((appointment) => appointment.doctor_id === doctorId),
    medical_records: filterByDoctorId(history.medical_records as any),
    prescriptions: filterByDoctorId(history.prescriptions as any),
    lab_results: filterByDoctorId(history.lab_results as any),
    vaccinations: filterByDoctorId(history.vaccinations as any),
  } as PatientMedicalHistory;
};

const buildDoctorSummary = (history: PatientMedicalHistory): DoctorPatientSummary => {
  const appointments = history.appointments || [];
  const prescriptions = (history.prescriptions as any[]) || [];
  const medicalRecords = history.medical_records || [];

  const completed = appointments.filter((apt) => apt.status === 'completed');
  const upcoming = appointments.filter((apt) => apt.status && UPCOMING_STATUSES.has(apt.status));
  const cancelled = appointments.filter((apt) => apt.status === 'cancelled');

  const lastVisit = completed
    .map((apt) => apt.appointment_date)
    .filter(Boolean)
    .sort((a, b) => (a! < b! ? 1 : -1))[0];

  const nextAppointment = upcoming
    .slice()
    .sort((a, b) => (a.appointment_date < b.appointment_date ? -1 : 1))[0];

  return {
    totalAppointments: appointments.length,
    completedAppointments: completed.length,
    upcomingAppointments: upcoming.length,
    cancelledAppointments: cancelled.length,
    totalRecords: medicalRecords.length,
    totalPrescriptions: prescriptions.length,
    activePrescriptions: prescriptions.filter((rx) => (rx.status ?? '').toLowerCase() === 'active').length,
    lastVisitLabel: lastVisit ? formatLongDate(lastVisit) : undefined,
    nextAppointmentLabel: nextAppointment
      ? `${formatLongDate(nextAppointment.appointment_date)}${nextAppointment.appointment_time ? ` • ${formatTime(nextAppointment.appointment_time)}` : ''}`
      : undefined,
  };
};

const buildTimelineEntries = (history: PatientMedicalHistory): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];

  (history.appointments || []).forEach((appointment) => {
    entries.push({
      id: `appointment-${appointment.id}`,
      title: `Appointment – ${capitalizeWords(appointment.appointment_type || 'Consultation')}`,
      subtitle: `${appointment.clinic?.clinic_name || 'Clinic'} • ${capitalizeWords(appointment.status || 'scheduled')}`,
      meta: `${formatLongDate(appointment.appointment_date)}${appointment.appointment_time ? ` • ${formatTime(appointment.appointment_time)}` : ''}`,
      icon: 'calendar',
      timestamp: getTimestamp(appointment.appointment_date, appointment.appointment_time),
    });
  });

  (history.medical_records || []).forEach((record: any) => {
    entries.push({
      id: `record-${record.id}`,
      title: record.title || `Medical record • ${capitalizeWords(record.record_type || 'consultation')}`,
      subtitle: record.diagnosis || record.description || 'Consultation details recorded',
      meta: formatLongDate(record.visit_date || record.created_at),
      icon: 'document-text',
      timestamp: new Date(record.visit_date || record.created_at).getTime(),
    });
  });

  ((history.prescriptions as any[]) || []).forEach((prescription: any) => {
    const medicationName = prescription.medication_name || prescription.title || 'Prescription';
    entries.push({
      id: `prescription-${prescription.id}`,
      title: `Prescription – ${medicationName}`,
      subtitle: prescription.dosage || prescription.instructions || 'Medication plan issued',
      meta: formatLongDate(prescription.prescribed_date || prescription.created_at),
      icon: 'medkit',
      timestamp: new Date(prescription.prescribed_date || prescription.created_at).getTime(),
    });
  });

  return entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);
};

const getInitials = (first?: string | null, last?: string | null) => {
  const firstInitial = (first || '').trim().charAt(0).toUpperCase();
  const lastInitial = (last || '').trim().charAt(0).toUpperCase();
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials || 'PT';
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatLongDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const [hour, minute] = value.split(':');
  if (hour === undefined || minute === undefined) return value;
  const date = new Date();
  date.setHours(Number(hour), Number(minute));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getTimestamp = (date?: string | null, time?: string | null) => {
  if (!date) return 0;
  const dateTime = time ? `${date}T${time}` : date;
  const parsed = new Date(dateTime);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const capitalizeWords = (value: string) =>
  value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const renderHighlightChips = (label: string, items?: string[] | null) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.highlightBlock}>
      <Text style={styles.highlightLabel}>{label}</Text>
      <View style={styles.highlightChips}>
        {items.slice(0, 4).map((item) => (
          <View key={item} style={styles.highlightChip}>
            <Text style={styles.highlightText}>{item}</Text>
          </View>
        ))}
        {items.length > 4 && (
          <View style={[styles.highlightChip, styles.highlightChipMuted]}>
            <Text style={[styles.highlightText, styles.highlightMuted]}>+{items.length - 4} more</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  clearButton: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  listMeta: {
    fontSize: 13,
    color: '#94A3B8',
  },
  patientsList: {
    marginBottom: 36,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    flexShrink: 1,
  },
  patientTags: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  neutralTag: {
    backgroundColor: '#F1F5F9',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1E293B',
  },
  patientFooter: {
    marginTop: 14,
    gap: 8,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#1E293B',
    flexShrink: 1,
  },
  alertPill: {
    backgroundColor: '#FEF2F2',
  },
  alertText: {
    color: '#B91C1C',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalOverlayFull: {
    paddingHorizontal: 0,
  },
  modalShell: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  modalShellFull: {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseButton: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  detailSubtle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  highlightSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  highlightRow: {
    gap: 16,
    marginTop: 12,
  },
  highlightBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  highlightLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  highlightChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
  },
  highlightChipMuted: {
    backgroundColor: '#E2E8F0',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  highlightMuted: {
    color: '#475569',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTimelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyTimelineSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  timelineList: {
    gap: 10,
    marginBottom: 24,
  },
  timelineCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#475569',
  },
  timelineMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
  },
  secondaryButtonText: {
    color: '#2563EB',
  },
  primaryButtonRounded: {
    backgroundColor: '#2563EB',
  },
  prescriptionButton: {
    backgroundColor: '#10B981',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
});
