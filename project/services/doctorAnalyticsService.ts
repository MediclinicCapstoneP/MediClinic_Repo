import { supabase } from '../lib/supabase';

export interface AnalyticsData {
  appointments: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    completed: number;
    cancelled: number;
    noShow: number;
    averageDuration: number;
    revenue: number;
    upcoming: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    active: number;
    returning: number;
    averageAge: number;
    genderDistribution: { male: number; female: number; other: number };
  };
  prescriptions: {
    total: number;
    thisMonth: number;
    active: number;
    completed: number;
    refills: number;
    topMedications: { medication: string; count: number }[];
  };
  medicalRecords: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    commonDiagnoses: { diagnosis: string; count: number }[];
    followUpRequired: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    averagePerAppointment: number;
    monthlyTrend: { month: string; revenue: number }[];
  };
  schedule: {
    utilizationRate: number;
    availableSlots: number;
    bookedSlots: number;
    cancelledSlots: number;
    peakHours: { hour: number; appointments: number }[];
  };
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface ReportData {
  type: 'appointments' | 'patients' | 'revenue' | 'prescriptions' | 'medical_records';
  data: any[];
  summary: {
    total: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
  metadata: {
    generatedAt: string;
    timeRange: TimeRange;
    filters?: any;
  };
}

class DoctorAnalyticsService {
  async getComprehensiveAnalytics(
    doctorId: string,
    timeRange?: TimeRange
  ): Promise<{ success: boolean; data: AnalyticsData; error?: string }> {
    try {
      const defaultTimeRange = timeRange || {
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
        to: new Date().toISOString()
      };

      const [
        appointmentsData,
        patientsData,
        prescriptionsData,
        medicalRecordsData,
        revenueData,
        scheduleData
      ] = await Promise.all([
        this.getAppointmentAnalytics(doctorId, defaultTimeRange),
        this.getPatientAnalytics(doctorId, defaultTimeRange),
        this.getPrescriptionAnalytics(doctorId, defaultTimeRange),
        this.getMedicalRecordAnalytics(doctorId, defaultTimeRange),
        this.getRevenueAnalytics(doctorId, defaultTimeRange),
        this.getScheduleAnalytics(doctorId, defaultTimeRange)
      ]);

      return {
        success: true,
        data: {
          appointments: appointmentsData,
          patients: patientsData,
          prescriptions: prescriptionsData,
          medicalRecords: medicalRecordsData,
          revenue: revenueData,
          schedule: scheduleData
        }
      };
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      return {
        success: false,
        data: this.getEmptyAnalyticsData(),
        error: 'Failed to fetch analytics data'
      };
    }
  }

  async getAppointmentAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['appointments']> {
    try {
      // Get appointment counts
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, appointment_date, appointment_time, total_amount, created_at')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', timeRange.from)
        .lte('appointment_date', timeRange.to);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const today = now.toISOString().slice(0, 10);

      const total = appointments?.length || 0;
      const thisMonth = appointments?.filter(apt => apt.appointment_date.startsWith(currentMonth)).length || 0;
      const thisWeek = appointments?.filter(apt => apt.appointment_date >= currentWeekStart.toISOString().slice(0, 10)).length || 0;
      const todayCount = appointments?.filter(apt => apt.appointment_date === today).length || 0;

      const completed = appointments?.filter(apt => apt.status === 'completed').length || 0;
      const cancelled = appointments?.filter(apt => apt.status === 'cancelled').length || 0;
      const noShow = appointments?.filter(apt => apt.status === 'no_show').length || 0;
      const upcoming = appointments?.filter(apt => ['scheduled', 'confirmed', 'payment_confirmed'].includes(apt.status)).length || 0;

      const revenue = appointments?.reduce((sum, apt) => sum + (apt.total_amount || 0), 0) || 0;
      const averageDuration = 30; // Default 30 minutes, could be calculated from actual data

      return {
        total,
        thisMonth,
        thisWeek,
        today: todayCount,
        completed,
        cancelled,
        noShow,
        averageDuration,
        revenue,
        upcoming
      };
    } catch (error) {
      console.error('Error fetching appointment analytics:', error);
      return this.getEmptyAppointmentAnalytics();
    }
  }

  async getPatientAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['patients']> {
    try {
      // Get patients through appointments
      const { data: patientData, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          appointment_date,
          patients!inner(
            first_name,
            last_name,
            date_of_birth,
            gender
          )
        `)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', timeRange.from)
        .lte('appointment_date', timeRange.to);

      if (error) throw error;

      const uniquePatients = new Map();
      patientData?.forEach(apt => {
        if (!uniquePatients.has(apt.patient_id)) {
          uniquePatients.set(apt.patient_id, {
            ...apt.patients,
            firstAppointment: apt.appointment_date,
            appointmentCount: 1
          });
        } else {
          const patient = uniquePatients.get(apt.patient_id);
          patient.appointmentCount++;
        }
      });

      const patients = Array.from(uniquePatients.values());
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));

      const total = patients.length;
      const newThisMonth = patients.filter(p => p.firstAppointment.startsWith(currentMonth)).length;
      const newThisWeek = patients.filter(p => p.firstAppointment >= currentWeekStart.toISOString().slice(0, 10)).length;
      const active = patients.filter(p => p.appointmentCount > 1).length;
      const returning = patients.filter(p => p.appointmentCount > 2).length;

      // Calculate average age
      const ages = patients
        .map(p => p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : null)
        .filter(age => age !== null && age > 0 && age < 120);
      const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

      // Gender distribution
      const genderDistribution = patients.reduce((acc, p) => {
        const gender = (p.gender || 'other').toLowerCase();
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, { male: 0, female: 0, other: 0 });

      return {
        total,
        newThisMonth,
        newThisWeek,
        active,
        returning,
        averageAge,
        genderDistribution
      };
    } catch (error) {
      console.error('Error fetching patient analytics:', error);
      return this.getEmptyPatientAnalytics();
    }
  }

  async getPrescriptionAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['prescriptions']> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('medication_name, status, prescribed_at, refills')
        .eq('doctor_id', doctorId)
        .gte('prescribed_at', timeRange.from)
        .lte('prescribed_at', timeRange.to);

      if (error) throw error;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const total = prescriptions?.length || 0;
      const thisMonth = prescriptions?.filter(p => p.prescribed_at.startsWith(currentMonth)).length || 0;
      const active = prescriptions?.filter(p => p.status === 'active').length || 0;
      const completed = prescriptions?.filter(p => p.status === 'completed').length || 0;
      const refills = prescriptions?.reduce((sum, p) => sum + (p.refills || 0), 0) || 0;

      // Top medications
      const medicationCounts: { [key: string]: number } = {};
      prescriptions?.forEach(p => {
        medicationCounts[p.medication_name] = (medicationCounts[p.medication_name] || 0) + 1;
      });

      const topMedications = Object.entries(medicationCounts)
        .map(([medication, count]) => ({ medication, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total,
        thisMonth,
        active,
        completed,
        refills,
        topMedications
      };
    } catch (error) {
      console.error('Error fetching prescription analytics:', error);
      return this.getEmptyPrescriptionAnalytics();
    }
  }

  async getMedicalRecordAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['medicalRecords']> {
    try {
      const { data: records, error } = await supabase
        .from('medical_records')
        .select('diagnosis, created_at, follow_up_required')
        .eq('doctor_id', doctorId)
        .gte('created_at', timeRange.from)
        .lte('created_at', timeRange.to);

      if (error) throw error;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

      const total = records?.length || 0;
      const thisMonth = records?.filter(r => r.created_at.startsWith(currentMonth)).length || 0;
      const thisWeek = records?.filter(r => r.created_at >= currentWeekStart.toISOString().slice(0, 10)).length || 0;
      const followUpRequired = records?.filter(r => r.follow_up_required).length || 0;

      // Common diagnoses
      const diagnosisCounts: { [key: string]: number } = {};
      records?.forEach(r => {
        diagnosisCounts[r.diagnosis] = (diagnosisCounts[r.diagnosis] || 0) + 1;
      });

      const commonDiagnoses = Object.entries(diagnosisCounts)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total,
        thisMonth,
        thisWeek,
        commonDiagnoses,
        followUpRequired
      };
    } catch (error) {
      console.error('Error fetching medical record analytics:', error);
      return this.getEmptyMedicalRecordAnalytics();
    }
  }

  async getRevenueAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['revenue']> {
    try {
      const { data: transactions, error } = await supabase
        .from('appointments')
        .select('total_amount, appointment_date, status')
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .gte('appointment_date', timeRange.from)
        .lte('appointment_date', timeRange.to);

      if (error) throw error;

      const completedAppointments = transactions || [];
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      const today = now.toISOString().slice(0, 10);

      const total = completedAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
      const thisMonth = completedAppointments.filter(apt => apt.appointment_date.startsWith(currentMonth))
        .reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
      const thisWeek = completedAppointments.filter(apt => apt.appointment_date >= currentWeekStart.toISOString().slice(0, 10))
        .reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
      const todayRevenue = completedAppointments.filter(apt => apt.appointment_date === today)
        .reduce((sum, apt) => sum + (apt.total_amount || 0), 0);

      const averagePerAppointment = completedAppointments.length > 0 ? total / completedAppointments.length : 0;

      // Monthly trend
      const monthlyRevenue: { [key: string]: number } = {};
      completedAppointments.forEach(apt => {
        const month = apt.appointment_date.slice(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (apt.total_amount || 0);
      });

      const monthlyTrend = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        total,
        thisMonth,
        thisWeek,
        today: todayRevenue,
        averagePerAppointment,
        monthlyTrend
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return this.getEmptyRevenueAnalytics();
    }
  }

  async getScheduleAnalytics(
    doctorId: string,
    timeRange: TimeRange
  ): Promise<AnalyticsData['schedule']> {
    try {
      // Get time slots and appointments
      const [timeSlotsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('doctor_time_slots')
          .select('day_of_week, start_time, end_time, max_appointments')
          .eq('doctor_id', doctorId)
          .eq('is_available', true),
        supabase
          .from('appointments')
          .select('appointment_date, appointment_time, status')
          .eq('doctor_id', doctorId)
          .gte('appointment_date', timeRange.from)
          .lte('appointment_date', timeRange.to)
      ]);

      if (timeSlotsResult.error) throw timeSlotsResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;

      const timeSlots = timeSlotsResult.data || [];
      const appointments = appointmentsResult.data || [];

      // Calculate available slots (simplified)
      const availableSlots = timeSlots.length * 4; // Assume 4 slots per time slot
      const bookedSlots = appointments.filter(apt => ['scheduled', 'confirmed', 'payment_confirmed', 'completed'].includes(apt.status)).length;
      const cancelledSlots = appointments.filter(apt => apt.status === 'cancelled').length;
      const utilizationRate = availableSlots > 0 ? (bookedSlots / availableSlots) * 100 : 0;

      // Peak hours
      const hourCounts: { [key: number]: number } = {};
      appointments.forEach(apt => {
        const hour = parseInt(apt.appointment_time.split(':')[0]);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .map(([hour, appointments]) => ({ hour: parseInt(hour), appointments }))
        .sort((a, b) => b.appointments - a.appointments)
        .slice(0, 6);

      return {
        utilizationRate,
        availableSlots,
        bookedSlots,
        cancelledSlots,
        peakHours
      };
    } catch (error) {
      console.error('Error fetching schedule analytics:', error);
      return this.getEmptyScheduleAnalytics();
    }
  }

  async generateReport(
    doctorId: string,
    reportType: ReportData['type'],
    timeRange: TimeRange,
    filters?: any
  ): Promise<{ success: boolean; data?: ReportData; error?: string }> {
    try {
      let data: any[] = [];
      let summary: ReportData['summary'];

      switch (reportType) {
        case 'appointments':
          const appointmentsResult = await this.getAppointmentsReportData(doctorId, timeRange, filters);
          data = appointmentsResult.data;
          summary = appointmentsResult.summary;
          break;

        case 'patients':
          const patientsResult = await this.getPatientsReportData(doctorId, timeRange, filters);
          data = patientsResult.data;
          summary = patientsResult.summary;
          break;

        case 'revenue':
          const revenueResult = await this.getRevenueReportData(doctorId, timeRange, filters);
          data = revenueResult.data;
          summary = revenueResult.summary;
          break;

        case 'prescriptions':
          const prescriptionsResult = await this.getPrescriptionsReportData(doctorId, timeRange, filters);
          data = prescriptionsResult.data;
          summary = prescriptionsResult.summary;
          break;

        case 'medical_records':
          const recordsResult = await this.getMedicalRecordsReportData(doctorId, timeRange, filters);
          data = recordsResult.data;
          summary = recordsResult.summary;
          break;

        default:
          throw new Error('Invalid report type');
      }

      return {
        success: true,
        data: {
          type: reportType,
          data,
          summary,
          metadata: {
            generatedAt: new Date().toISOString(),
            timeRange,
            filters
          }
        }
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  }

  private async getAppointmentsReportData(doctorId: string, timeRange: TimeRange, filters?: any) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, email, phone),
        clinic:clinics(clinic_name)
      `)
      .eq('doctor_id', doctorId)
      .gte('appointment_date', timeRange.from)
      .lte('appointment_date', timeRange.to);

    if (error) throw error;

    const total = data?.length || 0;
    const average = total / this.getDaysInRange(timeRange);
    const trend = 'stable'; // Would need previous period data for accurate trend
    const percentageChange = 0; // Would need previous period data

    return {
      data: data || [],
      summary: { total, average, trend, percentageChange }
    };
  }

  private async getPatientsReportData(doctorId: string, timeRange: TimeRange, filters?: any) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        appointment_date,
        patient:patients(first_name, last_name, email, phone, date_of_birth, gender)
      `)
      .eq('doctor_id', doctorId)
      .gte('appointment_date', timeRange.from)
      .lte('appointment_date', timeRange.to);

    if (error) throw error;

    // Get unique patients
    const uniquePatients = new Map();
    data?.forEach(apt => {
      if (!uniquePatients.has(apt.patient_id)) {
        uniquePatients.set(apt.patient_id, {
          ...apt.patient,
          firstAppointment: apt.appointment_date,
          appointmentCount: 1
        });
      } else {
        const patient = uniquePatients.get(apt.patient_id);
        patient.appointmentCount++;
      }
    });

    const patients = Array.from(uniquePatients.values());
    const total = patients.length;
    const average = total / this.getDaysInRange(timeRange);

    return {
      data: patients,
      summary: { total, average, trend: 'stable', percentageChange: 0 }
    };
  }

  private async getRevenueReportData(doctorId: string, timeRange: TimeRange, filters?: any) {
    const { data, error } = await supabase
      .from('appointments')
      .select('total_amount, appointment_date, status')
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .gte('appointment_date', timeRange.from)
      .lte('appointment_date', timeRange.to);

    if (error) throw error;

    const completedAppointments = data || [];
    const total = completedAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
    const average = total / this.getDaysInRange(timeRange);

    return {
      data: completedAppointments,
      summary: { total, average, trend: 'stable', percentageChange: 0 }
    };
  }

  private async getPrescriptionsReportData(doctorId: string, timeRange: TimeRange, filters?: any) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patient:patients(first_name, last_name, email)
      `)
      .eq('doctor_id', doctorId)
      .gte('prescribed_at', timeRange.from)
      .lte('prescribed_at', timeRange.to);

    if (error) throw error;

    const total = data?.length || 0;
    const average = total / this.getDaysInRange(timeRange);

    return {
      data: data || [],
      summary: { total, average, trend: 'stable', percentageChange: 0 }
    };
  }

  private async getMedicalRecordsReportData(doctorId: string, timeRange: TimeRange, filters?: any) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, email)
      `)
      .eq('doctor_id', doctorId)
      .gte('created_at', timeRange.from)
      .lte('created_at', timeRange.to);

    if (error) throw error;

    const total = data?.length || 0;
    const average = total / this.getDaysInRange(timeRange);

    return {
      data: data || [],
      summary: { total, average, trend: 'stable', percentageChange: 0 }
    };
  }

  private getDaysInRange(timeRange: TimeRange): number {
    const start = new Date(timeRange.from);
    const end = new Date(timeRange.to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getEmptyAnalyticsData(): AnalyticsData {
    return {
      appointments: this.getEmptyAppointmentAnalytics(),
      patients: this.getEmptyPatientAnalytics(),
      prescriptions: this.getEmptyPrescriptionAnalytics(),
      medicalRecords: this.getEmptyMedicalRecordAnalytics(),
      revenue: this.getEmptyRevenueAnalytics(),
      schedule: this.getEmptyScheduleAnalytics()
    };
  }

  private getEmptyAppointmentAnalytics(): AnalyticsData['appointments'] {
    return {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      today: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      averageDuration: 0,
      revenue: 0,
      upcoming: 0
    };
  }

  private getEmptyPatientAnalytics(): AnalyticsData['patients'] {
    return {
      total: 0,
      newThisMonth: 0,
      newThisWeek: 0,
      active: 0,
      returning: 0,
      averageAge: 0,
      genderDistribution: { male: 0, female: 0, other: 0 }
    };
  }

  private getEmptyPrescriptionAnalytics(): AnalyticsData['prescriptions'] {
    return {
      total: 0,
      thisMonth: 0,
      active: 0,
      completed: 0,
      refills: 0,
      topMedications: []
    };
  }

  private getEmptyMedicalRecordAnalytics(): AnalyticsData['medicalRecords'] {
    return {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      commonDiagnoses: [],
      followUpRequired: 0
    };
  }

  private getEmptyRevenueAnalytics(): AnalyticsData['revenue'] {
    return {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      today: 0,
      averagePerAppointment: 0,
      monthlyTrend: []
    };
  }

  private getEmptyScheduleAnalytics(): AnalyticsData['schedule'] {
    return {
      utilizationRate: 0,
      availableSlots: 0,
      bookedSlots: 0,
      cancelledSlots: 0,
      peakHours: []
    };
  }
}

export const doctorAnalyticsService = new DoctorAnalyticsService();
