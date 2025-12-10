import { useState, useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Pill,
  Activity,
  Stethoscope,
  Syringe,
  ChevronRight,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { patientHistoryService } from '../../../services/patientHistoryService';
import type {
  PatientMedicalHistory,
  HistoryTimelineItem,
  HistoryTimelineItemType,
  AppointmentWithDetails,
} from '../../../lib/supabase';
import { SkeletonBox, SkeletonStatCard, SkeletonAppointmentCard } from '../../../components/SkeletonLoader';

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';
type HistoryView = 'overview' | 'timeline' | 'appointments';

export default function PatientHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PatientMedicalHistory | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [view, setView] = useState<HistoryView>('overview');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user?.profile?.data?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await patientHistoryService.getPatientHistory(user.profile.data.id);
      if (!response.success || !response.history) {
        setError(response.error || 'Unable to load medical history.');
        setHistory(null);
        return;
      }
      setHistory(response.history);
    } catch (err) {
      console.error('[PatientHistoryScreen] Failed to load history:', err);
      setError('Failed to load medical history. Please try again later.');
      setHistory(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  const filteredAppointments = useMemo(() => {
    if (!history) return [];
    const appointments = history.appointments ?? [];
    switch (statusFilter) {
      case 'upcoming':
        return appointments.filter((apt) => UPCOMING_STATUSES.has(apt.status));
      case 'completed':
        return appointments.filter((apt) => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter((apt) => apt.status === 'cancelled');
      default:
        return appointments;
    }
  }, [history, statusFilter]);

  const summaryCards = useMemo(() => {
    if (!history) return [];
    const { summary } = history;
    return [
      {
        title: 'Total Appointments',
        value: summary.total_appointments,
        description: `${summary.completed_appointments} completed • ${summary.upcoming_appointments} upcoming`,
        icon: Calendar,
      },
      {
        title: 'Medical Records',
        value: summary.total_medical_records,
        description: `${summary.total_lab_results} lab results • ${summary.total_vaccinations} vaccinations`,
        icon: Stethoscope,
      },
      {
        title: 'Active Prescriptions',
        value: summary.active_prescriptions,
        description: `${summary.total_prescriptions} total prescriptions`,
        icon: Pill,
      },
      {
        title: 'Active Allergies',
        value: summary.active_allergies,
        description: `${summary.total_allergies} documented allergies`,
        icon: AlertCircle,
      },
    ];
  }, [history]);

  const timelineItems = useMemo(() => history?.timeline ?? [], [history]);

  const currentMedications = history?.summary.current_medications ?? [];
  const chronicConditions = history?.summary.chronic_conditions ?? [];
  const allergies = history?.allergies ?? [];
  const vaccinations = history?.vaccinations ?? [];

  const lastVisit = history?.summary.last_visit_date;
  const nextVisit = history?.summary.next_appointment_date;

  return (
    <LinearGradient colors={['#eff6ff', '#ecfdf5', '#ecfeff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Medical History</Text>
              <Text style={styles.subtitle}>Review appointments, records, and prescriptions in one place.</Text>
            </View>
          </View>

          <View style={styles.viewSwitch}>
            {VIEW_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.viewButton, view === option.value && styles.viewButtonActive]}
                onPress={() => setView(option.value)}
              >
                <Text style={[styles.viewButtonText, view === option.value && styles.viewButtonTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading ? (
            <OverviewSkeleton />
          ) : history ? (
            <>
              {view === 'overview' && (
                <OverviewSection
                  summaryCards={summaryCards}
                  lastVisit={lastVisit}
                  nextVisit={nextVisit}
                  chronicConditions={chronicConditions}
                  currentMedications={currentMedications}
                  allergies={allergies}
                  vaccinations={vaccinations}
                />
              )}

              {view === 'timeline' && <TimelineSection items={timelineItems} />}

              {view === 'appointments' && (
                <AppointmentsSection
                  appointments={filteredAppointments}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                />
              )}
            </>
          ) : (
            !loading && !error && (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No medical history yet</Text>
                <Text style={styles.emptySubtitle}>Book an appointment to start building your medical history.</Text>
                <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/(tabs)/patient/clinics')}>
                  <Text style={styles.bookButtonText}>Find Clinics</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const UPCOMING_STATUSES = new Set<AppointmentWithDetails['status']>([
  'scheduled',
  'confirmed',
  'payment_confirmed',
  'pending_payment',
  'in_progress',
]);

const VIEW_OPTIONS: { value: HistoryView; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'appointments', label: 'Appointments' },
];

const statusColorMap: Record<string, string> = {
  confirmed: '#10B981',
  payment_confirmed: '#10B981',
  scheduled: '#3B82F6',
  pending_payment: '#F59E0B',
  in_progress: '#6366F1',
  completed: '#6B7280',
  cancelled: '#EF4444',
  no_show: '#F97316',
  draft: '#6B7280',
  payment_failed: '#EF4444',
};

const statusIconMap: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  confirmed: CheckCircle2,
  payment_confirmed: CheckCircle2,
  scheduled: CalendarClock,
  pending_payment: CalendarClock,
  in_progress: Activity,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: XCircle,
  draft: CalendarClock,
  payment_failed: XCircle,
};

const timelineIconMap: Record<HistoryTimelineItemType, React.ComponentType<{ size?: number; color?: string }>> = {
  appointments: Calendar,
  medical_records: Stethoscope,
  prescriptions: Pill,
  lab_results: Activity,
  vaccinations: Syringe,
};

function getStatusColor(status: AppointmentWithDetails['status']) {
  return statusColorMap[status] ?? '#6B7280';
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return withTime
    ? date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function OverviewSkeleton() {
  return (
    <View style={{ paddingBottom: 32 }}>
      <View style={styles.summaryGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.summaryCard}>
            <SkeletonStatCard />
            <View style={{ marginTop: 12 }}>
              <SkeletonBox width="60%" height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox width="40%" height={16} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <SkeletonBox width="50%" height={18} style={{ marginBottom: 12 }} />
        {[1, 2, 3].map((item) => (
          <SkeletonBox key={item} width="100%" height={60} style={{ marginBottom: 12, borderRadius: 16 }} />
        ))}
      </View>
    </View>
  );
}

function OverviewSection({
  summaryCards,
  lastVisit,
  nextVisit,
  chronicConditions,
  currentMedications,
  allergies,
  vaccinations,
}: {
  summaryCards: Array<{ title: string; value: number; description: string; icon: React.ComponentType<{ size?: number; color?: string }>; }>;
  lastVisit?: string | null;
  nextVisit?: string | null;
  chronicConditions: string[];
  currentMedications: string[];
  allergies: Array<{ allergen: string; severity?: string | null; reaction?: string | null }>;
  vaccinations: Array<{ id: string; vaccine_name?: string | null; administered_at?: string | null; dose_number?: number | null }>;
}) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <View key={card.title} style={styles.summaryCard}>
            <View style={styles.summaryIconWrapper}>
              <card.icon size={20} color="#2563EB" />
            </View>
            <Text style={styles.summaryTitle}>{card.title}</Text>
            <Text style={styles.summaryValue}>{card.value}</Text>
            <Text style={styles.summaryDescription}>{card.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visits</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Last Visit</Text>
            <Text style={styles.infoValue}>{formatDate(lastVisit, true)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Next Appointment</Text>
            <Text style={styles.infoValue}>{formatDate(nextVisit, true)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chronic Conditions</Text>
        {chronicConditions.length > 0 ? (
          chronicConditions.map((condition) => (
            <View key={condition} style={styles.listItem}>
              <AlertCircle size={16} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.listItemText}>{condition}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>No chronic conditions documented.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        {currentMedications.length > 0 ? (
          currentMedications.map((medication) => (
            <View key={medication} style={styles.listItem}>
              <Pill size={16} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.listItemText}>{medication}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>No active medications recorded.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        {allergies.length > 0 ? (
          allergies.map((allergy) => (
            <View key={`${allergy.allergen}-${allergy.severity ?? 'unknown'}`} style={styles.allergyCard}>
              <AlertCircle size={18} color="#DC2626" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.allergyTitle}>{allergy.allergen}</Text>
                <Text style={styles.allergySubtitle}>
                  {(allergy.severity || 'Unknown severity') + (allergy.reaction ? ` • ${allergy.reaction}` : '')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>No allergies on file.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vaccinations</Text>
        {vaccinations.length > 0 ? (
          vaccinations.map((vaccination) => (
            <View key={vaccination.id} style={styles.vaccinationCard}>
              <Syringe size={18} color="#2563EB" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vaccinationTitle}>{vaccination.vaccine_name || 'Vaccine'}</Text>
                <Text style={styles.vaccinationSubtitle}>
                  {vaccination.dose_number ? `Dose ${vaccination.dose_number} • ` : ''}
                  {formatDate(vaccination.administered_at)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>No vaccination records available.</Text>
        )}
      </View>
    </View>
  );
}

function TimelineSection({ items }: { items: HistoryTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <View style={styles.emptySection}>
        <Text style={styles.emptyTitle}>No timeline events</Text>
        <Text style={styles.emptySubtitle}>New activity will appear here after appointments and updates.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.timelineList}>
        {items.map((item) => {
          const Icon = timelineIconMap[item.type] || Activity;
          return (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineIconWrapper}>
                <Icon size={16} color="#2563EB" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{formatDate(item.date, true)}</Text>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                {item.description && <Text style={styles.timelineDescription}>{item.description}</Text>}
                {item.metadata && (
                  <View style={styles.timelineMetadata}>
                    {Object.entries(item.metadata).map(([key, value]) =>
                      value ? (
                        <Text key={key} style={styles.timelineMetaItem}>
                          <Text style={styles.timelineMetaLabel}>{toLabel(key)}: </Text>
                          <Text style={styles.timelineMetaValue}>{String(value)}</Text>
                        </Text>
                      ) : null,
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AppointmentsSection({
  appointments,
  statusFilter,
  onStatusChange,
  loading,
}: {
  appointments: AppointmentWithDetails[];
  statusFilter: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Appointments</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, statusFilter === filter.key && styles.filterChipActive]}
            onPress={() => onStatusChange(filter.key)}
          >
            <Text style={[styles.filterText, statusFilter === filter.key && styles.filterTextActive]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View>
          {[1, 2, 3].map((item) => (
            <SkeletonAppointmentCard key={item} />
          ))}
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyTitle}>No appointments</Text>
          <Text style={styles.emptySubtitle}>Adjust your filters or book a new appointment.</Text>
        </View>
      ) : (
        appointments.map((appointment) => {
          const StatusIcon = statusIconMap[appointment.status] ?? CalendarClock;
          return (
            <TouchableOpacity
              key={appointment.id}
              style={styles.appointmentCard}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/patient/history/[id]',
                  params: { id: appointment.id },
                })
              }
            >
              <View style={styles.appointmentHeader}>
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>{appointment.clinic?.clinic_name || 'Clinic'}</Text>
                  <View style={styles.locationInfo}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.locationText}>
                      {appointment.clinic?.city || 'City'}, {appointment.clinic?.state || 'State'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <StatusIcon size={14} color="#FFFFFF" />
                  <Text style={styles.statusText}>{toLabel(appointment.status)}</Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{formatDate(appointment.appointment_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{appointment.appointment_time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailText}>{appointment.appointment_type}</Text>
                </View>
              </View>

              <View style={styles.appointmentFooter}>
                <View>
                  <Text style={styles.detailLabel}>Doctor</Text>
                  <Text style={styles.detailText}>{appointment.doctor?.full_name || 'TBD'}</Text>
                </View>
                <View style={styles.trailingAction}>
                  <Text style={styles.moreLabel}>Details</Text>
                  <ChevronRight size={16} color="#2563EB" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function toLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#1F2937',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  sectionContainer: {
    paddingBottom: 32,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  allergyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
  },
  allergySubtitle: {
    fontSize: 12,
    color: '#991B1B',
  },
  vaccinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  vaccinationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E7490',
  },
  vaccinationSubtitle: {
    fontSize: 12,
    color: '#0E7490',
  },
  timelineList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  timelineMetadata: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  timelineMetaItem: {
    fontSize: 12,
    color: '#4B5563',
  },
  timelineMetaLabel: {
    fontWeight: '600',
  },
  timelineMetaValue: {
    fontWeight: '400',
  },
  emptySection: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  appointmentsContainer: {
    paddingBottom: 48,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  appointmentDetails: {
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 6,
  },
  appointmentFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignাকৈ: 'center',
  },
  trailingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
