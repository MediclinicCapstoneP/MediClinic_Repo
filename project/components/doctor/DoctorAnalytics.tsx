import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorAnalyticsService, AnalyticsData, ReportData } from '../../services/doctorAnalyticsService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export const DoctorAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportData['type']>('appointments');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDoctorId();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchAnalyticsData();
    }
  }, [doctorId, selectedTimeRange]);

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

  const fetchAnalyticsData = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const timeRange = getTimeRange(selectedTimeRange);
      const { data, error } = await doctorAnalyticsService.getComprehensiveAnalytics(doctorId, timeRange);

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRange = (range: string) => {
    const now = new Date();
    let from: Date;

    switch (range) {
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        from = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        from = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        from = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        from = new Date(now.setMonth(now.getMonth() - 1));
    }

    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  };

  const handleGenerateReport = async () => {
    if (!doctorId || !analyticsData) return;

    try {
      const timeRange = getTimeRange(selectedTimeRange);
      const { data, error } = await doctorAnalyticsService.generateReport(
        doctorId,
        selectedReportType,
        timeRange
      );

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setReportData(data);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const renderTimeRangeSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.timeRangeContainer}
    >
      {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            selectedTimeRange === range && styles.activeTimeRangeButton
          ]}
          onPress={() => setSelectedTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            selectedTimeRange === range && styles.activeTimeRangeButtonText
          ]}>
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverviewCard = () => {
    if (!analyticsData) return null;

    const { appointments, patients, revenue } = analyticsData;

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Ionicons name="calendar" size={24} color="#2563EB" />
            <Text style={styles.overviewValue}>{appointments.total}</Text>
            <Text style={styles.overviewLabel}>Total Appointments</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="people" size={24} color="#10B981" />
            <Text style={styles.overviewValue}>{patients.total}</Text>
            <Text style={styles.overviewLabel}>Total Patients</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="cash" size={24} color="#F59E0B" />
            <Text style={styles.overviewValue}>{formatCurrency(revenue.total)}</Text>
            <Text style={styles.overviewLabel}>Total Revenue</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="trending-up" size={24} color="#8B5CF6" />
            <Text style={styles.overviewValue}>{formatCurrency(revenue.averagePerAppointment)}</Text>
            <Text style={styles.overviewLabel}>Avg per Appointment</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAppointmentsCard = () => {
    if (!analyticsData) return null;

    const { appointments } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appointments</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appointments.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appointments.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appointments.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appointments.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>Completed: {appointments.completed}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statusText}>Cancelled: {appointments.cancelled}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPatientsCard = () => {
    if (!analyticsData) return null;

    const { patients } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patients</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patients.newThisMonth}</Text>
            <Text style={styles.statLabel}>New This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patients.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patients.returning}</Text>
            <Text style={styles.statLabel}>Returning</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patients.averageAge}</Text>
            <Text style={styles.statLabel}>Avg Age</Text>
          </View>
        </View>

        <View style={styles.genderRow}>
          <Text style={styles.genderLabel}>Gender Distribution:</Text>
          <View style={styles.genderBar}>
            <View style={[styles.genderSegment, { flex: patients.genderDistribution.male, backgroundColor: '#3B82F6' }]} />
            <View style={[styles.genderSegment, { flex: patients.genderDistribution.female, backgroundColor: '#EC4899' }]} />
            <View style={[styles.genderSegment, { flex: patients.genderDistribution.other, backgroundColor: '#6B7280' }]} />
          </View>
          <View style={styles.genderLabels}>
            <Text style={styles.genderLabel}>M: {patients.genderDistribution.male}</Text>
            <Text style={styles.genderLabel}>F: {patients.genderDistribution.female}</Text>
            <Text style={styles.genderLabel}>O: {patients.genderDistribution.other}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPrescriptionsCard = () => {
    if (!analyticsData) return null;

    const { prescriptions } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prescriptions</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{prescriptions.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{prescriptions.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{prescriptions.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{prescriptions.refills}</Text>
            <Text style={styles.statLabel}>Refills</Text>
          </View>
        </View>

        {prescriptions.topMedications.length > 0 && (
          <View style={styles.topItemsContainer}>
            <Text style={styles.topItemsTitle}>Top Medications</Text>
            {prescriptions.topMedications.slice(0, 3).map((med, index) => (
              <View key={index} style={styles.topItem}>
                <Text style={styles.topItemName}>{med.medication}</Text>
                <Text style={styles.topItemCount}>{med.count} prescriptions</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMedicalRecordsCard = () => {
    if (!analyticsData) return null;

    const { medicalRecords } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medical Records</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{medicalRecords.total}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{medicalRecords.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{medicalRecords.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{medicalRecords.followUpRequired}</Text>
            <Text style={styles.statLabel}>Follow-ups</Text>
          </View>
        </View>

        {medicalRecords.commonDiagnoses.length > 0 && (
          <View style={styles.topItemsContainer}>
            <Text style={styles.topItemsTitle}>Common Diagnoses</Text>
            {medicalRecords.commonDiagnoses.slice(0, 3).map((diagnosis, index) => (
              <View key={index} style={styles.topItem}>
                <Text style={styles.topItemName}>{diagnosis.diagnosis}</Text>
                <Text style={styles.topItemCount}>{diagnosis.count} cases</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRevenueCard = () => {
    if (!analyticsData) return null;

    const { revenue } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenue</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(revenue.total)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(revenue.thisMonth)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(revenue.thisWeek)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(revenue.today)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {revenue.monthlyTrend.length > 0 && (
          <View style={styles.trendContainer}>
            <Text style={styles.trendTitle}>Monthly Trend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {revenue.monthlyTrend.slice(-6).map((month, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendMonth}>
                    {new Date(month.month).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                  <Text style={styles.trendValue}>{formatCurrency(month.revenue)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderScheduleCard = () => {
    if (!analyticsData) return null;

    const { schedule } = analyticsData;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Schedule Analytics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatPercentage(schedule.utilizationRate)}</Text>
            <Text style={styles.statLabel}>Utilization</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{schedule.bookedSlots}</Text>
            <Text style={styles.statLabel}>Booked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{schedule.cancelledSlots}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{schedule.availableSlots}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {schedule.peakHours.length > 0 && (
          <View style={styles.peakHoursContainer}>
            <Text style={styles.peakHoursTitle}>Peak Hours</Text>
            <View style={styles.peakHoursGrid}>
              {schedule.peakHours.slice(0, 4).map((hour, index) => (
                <View key={index} style={styles.peakHourItem}>
                  <Text style={styles.peakHourTime}>{hour.hour}:00</Text>
                  <Text style={styles.peakHourCount}>{hour.appointments} appointments</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderReportModal = () => {
    if (!reportData) return null;

    return (
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report: {reportData.type.replace('_', ' ').toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.reportSummary}>
              <Text style={styles.summaryLabel}>Total: {reportData.summary.total}</Text>
              <Text style={styles.summaryLabel}>Average: {reportData.summary.average.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Trend: {reportData.summary.trend}</Text>
              <Text style={styles.summaryLabel}>Change: {reportData.summary.percentageChange}%</Text>
            </View>

            <ScrollView style={styles.reportData}>
              <Text style={styles.dataTitle}>Data ({reportData.data.length} items)</Text>
              {reportData.data.slice(0, 10).map((item, index) => (
                <View key={index} style={styles.dataItem}>
                  <Text style={styles.dataText}>{JSON.stringify(item, null, 2)}</Text>
                </View>
              ))}
              {reportData.data.length > 10 && (
                <Text style={styles.moreDataText}>... and {reportData.data.length - 10} more items</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="document-text" size={20} color="white" />
          <Text style={styles.reportButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      {renderTimeRangeSelector()}

      <ScrollView style={styles.content}>
        {renderOverviewCard()}
        {renderAppointmentsCard()}
        {renderPatientsCard()}
        {renderPrescriptionsCard()}
        {renderMedicalRecordsCard()}
        {renderRevenueCard()}
        {renderScheduleCard()}
      </ScrollView>

      {/* Report Type Selection Modal */}
      <Modal
        visible={showReportModal && !reportData}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            
            <Text style={styles.inputLabel}>Select Report Type</Text>
            <View style={styles.reportTypeContainer}>
              {(['appointments', 'patients', 'revenue', 'prescriptions', 'medical_records'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reportTypeButton,
                    selectedReportType === type && styles.selectedReportTypeButton
                  ]}
                  onPress={() => setSelectedReportType(type)}
                >
                  <Text style={[
                    styles.reportTypeButtonText,
                    selectedReportType === type && styles.selectedReportTypeButtonText
                  ]}>
                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.generateButton]}
                onPress={handleGenerateReport}
              >
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Display Modal */}
      {renderReportModal()}
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  timeRangeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTimeRangeButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
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
  cardTitle: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
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
    color: '#6B7280',
  },
  genderRow: {
    marginTop: 12,
  },
  genderLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  genderBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  genderSegment: {
    height: '100%',
  },
  genderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topItemsContainer: {
    marginTop: 12,
  },
  topItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  topItemCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendContainer: {
    marginTop: 12,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  trendItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  trendMonth: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  peakHoursContainer: {
    marginTop: 12,
  },
  peakHoursTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  peakHoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  peakHourItem: {
    width: '48%',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  peakHourTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  peakHourCount: {
    fontSize: 12,
    color: '#6B7280',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reportTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedReportTypeButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  reportTypeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  selectedReportTypeButtonText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  generateButton: {
    backgroundColor: '#2563EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  reportSummary: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  reportData: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dataItem: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  moreDataText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
