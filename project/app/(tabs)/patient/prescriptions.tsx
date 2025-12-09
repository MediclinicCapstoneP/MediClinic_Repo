import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Pill,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  Plus,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { SkeletonPrescriptionCard } from '../../../components/SkeletonLoader';
import { patientPrescriptionService, PatientPrescriptionRecord } from '../../../services/patientPrescriptionService';

type PrescriptionStatus = 'active' | 'completed' | 'discontinued' | 'expired';

interface PrescriptionViewModel {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
  prescribed_date: string;
  expiry_date?: string | null;
  doctor_name: string;
  clinic_name: string;
  status: PrescriptionStatus;
  refills_remaining: number;
  notes?: string | null;
  raw: PatientPrescriptionRecord;
}

function normalizeStatus(status?: string | null): PrescriptionStatus {
  const normalized = status?.toLowerCase();

  switch (normalized) {
    case 'active':
    case 'in_progress':
      return 'active';
    case 'completed':
    case 'fulfilled':
      return 'completed';
    case 'discontinued':
    case 'stopped':
      return 'discontinued';
    case 'expired':
      return 'expired';
    default:
      return 'active';
  }
}

function mapPrescriptionToViewModel(record: PatientPrescriptionRecord): PrescriptionViewModel {
  const status = normalizeStatus(record.status);
  const doctorName = record.doctor?.full_name || 'Unknown Doctor';
  const clinicName = record.doctor?.clinic?.clinic_name || record.appointment?.clinic?.clinic_name || 'Unknown Clinic';

  return {
    id: record.id,
    medication_name: record.medication_name,
    dosage: record.dosage ?? 'Not specified',
    frequency: record.frequency ?? 'Not specified',
    duration: record.duration ?? 'Not specified',
    instructions: record.instructions ?? null,
    prescribed_date: record.prescribed_at,
    expiry_date: null,
    doctor_name: doctorName,
    clinic_name: clinicName,
    status,
    refills_remaining: record.refills ?? 0,
    notes: record.instructions ?? null,
    raw: record,
  };
};

type FilterStatus = 'all' | PrescriptionStatus;

export default function PatientPrescriptionsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionViewModel[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionViewModel[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, selectedFilter, searchQuery]);

  const loadPrescriptions = async () => {
    if (!user?.profile?.data?.id) return;
    
    try {
      setLoading(true);
      const response = await patientPrescriptionService.getPrescriptions({
        patientId: user.profile.data.id,
        limit: 100,
      });

      if (!response.success || !response.prescriptions) {
        setPrescriptions([]);
        return;
      }

      const mapped = response.prescriptions
        .map(mapPrescriptionToViewModel)
        .sort((a, b) => new Date(b.prescribed_date).getTime() - new Date(a.prescribed_date).getTime());

      setPrescriptions(mapped);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(prescription =>
        prescription.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.clinic_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPrescriptions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPrescriptions();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadPrescription = (prescription: PrescriptionViewModel) => {
    Alert.alert(
      'Download Prescription',
      `Download prescription for ${prescription.medication_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => console.log('Downloading prescription:', prescription.id) },
      ]
    );
  };

  const handleRefillRequest = (prescription: PrescriptionViewModel) => {
    if (prescription.refills_remaining > 0) {
      Alert.alert(
        'Request Refill',
        `Request refill for ${prescription.medication_name}? (${prescription.refills_remaining} refills remaining)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request', onPress: () => console.log('Requesting refill:', prescription.id) },
        ]
      );
    } else {
      Alert.alert('No Refills Remaining', 'Please consult your doctor for a new prescription.');
    }
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'discontinued':
        return '#F97316';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'completed':
        return CheckCircle;
      case 'discontinued':
        return AlertCircle;
      case 'expired':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'discontinued', label: 'Discontinued' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <LinearGradient
      colors={['#eff6ff', '#ecfdf5', '#ecfeff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
              tintColor={'#2563EB'}
              title="Pull to refresh"
              titleColor={'#6B7280'}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Prescriptions</Text>
              <Text style={styles.subtitle}>Manage your medications</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medications, doctors..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filters */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.key && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.key && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Prescriptions List */}
          <View style={styles.prescriptionsContainer}>
            {loading ? (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <SkeletonPrescriptionCard key={item} />
                ))}
              </>
            ) : filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((prescription) => {
                const StatusIcon = getStatusIcon(prescription.status);
                return (
                  <TouchableOpacity
                    key={prescription.id}
                    style={styles.prescriptionCard}
                    onPress={() => {
                      // Navigate to prescription details if needed
                      console.log('Prescription details:', prescription.id);
                    }}
                  >
                    <View style={styles.prescriptionHeader}>
                      <View style={styles.medicationInfo}>
                        <View style={styles.medicationNameContainer}>
                          <Pill size={20} color="#2563EB" style={styles.medicationIcon} />
                          <Text style={styles.medicationName}>{prescription.medication_name}</Text>
                        </View>
                        <Text style={styles.dosage}>{prescription.dosage}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                        <StatusIcon size={16} color="#FFFFFF" />
                        <Text style={styles.statusText}>{prescription.status}</Text>
                      </View>
                    </View>

                    <View style={styles.prescriptionDetails}>
                      <View style={styles.detailRow}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{prescription.frequency} for {prescription.duration}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                          Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Doctor:</Text>
                        <Text style={styles.detailText}>{prescription.doctor_name}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Clinic:</Text>
                        <Text style={styles.detailText}>{prescription.clinic_name}</Text>
                      </View>
                      {prescription.notes && (
                        <View style={styles.notesContainer}>
                          <AlertCircle size={14} color="#F59E0B" />
                          <Text style={styles.notesText}>{prescription.notes}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.prescriptionFooter}>
                      <View style={styles.refillInfo}>
                        <Text style={styles.refillText}>
                          {prescription.refills_remaining} refills remaining
                        </Text>
                        {prescription.expiry_date && (
                          <Text style={styles.expiryText}>
                            Expires: {new Date(prescription.expiry_date).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDownloadPrescription(prescription)}
                        >
                          <Download size={16} color="#2563EB" />
                        </TouchableOpacity>
                        {prescription.status === 'active' && prescription.refills_remaining > 0 && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.refillButton]}
                            onPress={() => handleRefillRequest(prescription)}
                          >
                            <Plus size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Pill size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No prescriptions found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? "No prescriptions match your search" 
                    : selectedFilter === 'all'
                    ? "You don't have any prescriptions yet"
                    : `No ${selectedFilter} prescriptions found`}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  prescriptionsContainer: {
    flex: 1,
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationIcon: {
    marginRight: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  dosage: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 28,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 60,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  refillInfo: {
    flex: 1,
  },
  refillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  expiryText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillButton: {
    backgroundColor: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});
