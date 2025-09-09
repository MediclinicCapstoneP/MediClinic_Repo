import { supabase } from '../../../supabaseClient';

export interface ClinicStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  thisMonthAppointments: number;
  averageRating: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'review' | 'doctor';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface PatientRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string[];
  allergies?: string[];
  created_at: string;
  updated_at: string;
  lastVisit?: string;
  nextAppointment?: string;
  status: 'active' | 'inactive';
  primaryDoctor?: string;
}

class ClinicDashboardService {
  /**
   * Get comprehensive clinic statistics
   */
  async getClinicStats(clinicId: string): Promise<{ success: boolean; stats?: ClinicStats; error?: string }> {
    try {
      // Get total patients who have appointments with this clinic
      const { data: patientsData, error: patientsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('clinic_id', clinicId)
        .not('patient_id', 'is', null);

      if (patientsError) throw patientsError;

      const uniquePatients = new Set(patientsData?.map(a => a.patient_id) || []);
      const totalPatients = uniquePatients.size;

      // Get total doctors for this clinic
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id')
        .eq('clinic_id', clinicId);

      if (doctorsError) throw doctorsError;

      const totalDoctors = doctorsData?.length || 0;

      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData, error: todayError } = await supabase
        .from('appointments')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', today);

      if (todayError) throw todayError;

      const todayAppointments = todayData?.length || 0;

      // Get this month's appointments
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const { data: monthData, error: monthError } = await supabase
        .from('appointments')
        .select('id, payment_amount')
        .eq('clinic_id', clinicId)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0])
        .lte('appointment_date', endOfMonth.toISOString().split('T')[0]);

      if (monthError) throw monthError;

      const thisMonthAppointments = monthData?.length || 0;

      // Calculate total revenue from this month's appointments
      const totalRevenue = monthData?.reduce((sum, appointment) => {
        return sum + (appointment.payment_amount || 0);
      }, 0) || 0;

      // Get average rating from reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('clinic_id', clinicId);

      if (reviewsError) throw reviewsError;

      const averageRating = reviewsData?.length 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0;

      const stats: ClinicStats = {
        totalPatients,
        totalDoctors,
        todayAppointments,
        thisMonthAppointments,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching clinic stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch clinic statistics' 
      };
    }
  }

  /**
   * Get recent activity for the clinic dashboard
   */
  async getRecentActivity(clinicId: string, limit: number = 10): Promise<{ success: boolean; activities?: RecentActivity[]; error?: string }> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          created_at,
          appointment_date,
          appointment_time,
          status,
          patients (first_name, last_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (appointmentsError) throw appointmentsError;

      // Add appointment activities
      appointmentsData?.forEach(appointment => {
        const patientName = appointment.patients 
          ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
          : 'Unknown Patient';
        
        activities.push({
          id: `appointment-${appointment.id}`,
          type: 'appointment',
          title: 'New Appointment',
          description: `${patientName} - ${appointment.appointment_date} at ${appointment.appointment_time}`,
          time: this.getRelativeTime(appointment.created_at),
          icon: 'Calendar',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        });
      });

      // Get recent patient registrations (patients who made their first appointment)
      const { data: newPatientsData, error: newPatientsError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          created_at,
          patients (first_name, last_name, created_at)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (newPatientsError) throw newPatientsError;

      // Add new patient activities
      newPatientsData?.forEach(appointment => {
        if (appointment.patients) {
          const patientName = `${appointment.patients.first_name} ${appointment.patients.last_name}`;
          
          activities.push({
            id: `patient-${appointment.patient_id}`,
            type: 'patient',
            title: 'New Patient',
            description: `${patientName} - First appointment booked`,
            time: this.getRelativeTime(appointment.created_at),
            icon: 'UserCheck',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          });
        }
      });

      // Get recent reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          created_at,
          rating,
          patients (first_name, last_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reviewsError) throw reviewsError;

      // Add review activities
      reviewsData?.forEach(review => {
        const patientName = review.patients 
          ? `${review.patients.first_name} ${review.patients.last_name}`
          : 'Anonymous';
        
        activities.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'New Review',
          description: `${review.rating}-star rating from ${patientName}`,
          time: this.getRelativeTime(review.created_at),
          icon: 'Star',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        });
      });

      // Sort all activities by time and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

      return { success: true, activities: sortedActivities };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recent activity' 
      };
    }
  }

  /**
   * Get patients who have appointments with this clinic
   */
  async getClinicPatients(clinicId: string): Promise<{ success: boolean; patients?: PatientRecord[]; error?: string }> {
    try {
      // Get all patients who have appointments with this clinic
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          appointment_date,
          appointment_time,
          status,
          created_at,
          patients (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            medical_history,
            allergies,
            created_at,
            updated_at
          ),
          doctors (full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Group appointments by patient and get patient info
      const patientMap = new Map<string, PatientRecord>();

      appointmentsData?.forEach(appointment => {
        if (!appointment.patients) return;

        const patient = appointment.patients;
        const patientId = patient.id;

        if (!patientMap.has(patientId)) {
          // Calculate age from date_of_birth
          let age = 0;
          if (patient.date_of_birth) {
            const birthDate = new Date(patient.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }

          patientMap.set(patientId, {
            id: patientId,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone || undefined,
            date_of_birth: patient.date_of_birth || undefined,
            gender: patient.gender || undefined,
            address: patient.address || undefined,
            emergency_contact_name: patient.emergency_contact_name || undefined,
            emergency_contact_phone: patient.emergency_contact_phone || undefined,
            medical_history: patient.medical_history || [],
            allergies: patient.allergies || [],
            created_at: patient.created_at,
            updated_at: patient.updated_at,
            status: 'active' as const,
            primaryDoctor: appointment.doctors?.full_name || undefined
          });
        }

        // Update last visit and next appointment
        const existingPatient = patientMap.get(patientId)!;
        const appointmentDate = appointment.appointment_date;
        const today = new Date().toISOString().split('T')[0];

        // Update last visit (most recent past appointment)
        if (appointmentDate <= today && appointment.status === 'completed') {
          if (!existingPatient.lastVisit || appointmentDate > existingPatient.lastVisit) {
            existingPatient.lastVisit = appointmentDate;
          }
        }

        // Update next appointment (earliest future appointment)
        if (appointmentDate > today && (appointment.status === 'scheduled' || appointment.status === 'confirmed')) {
          if (!existingPatient.nextAppointment || appointmentDate < existingPatient.nextAppointment) {
            existingPatient.nextAppointment = appointmentDate;
          }
        }
      });

      const patients = Array.from(patientMap.values());

      return { success: true, patients };
    } catch (error) {
      console.error('Error fetching clinic patients:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch clinic patients' 
      };
    }
  }

  /**
   * Helper function to get relative time
   */
  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}

export const clinicDashboardService = new ClinicDashboardService();
