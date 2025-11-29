import { supabase } from '../lib/supabase';
import { DoctorAppointment } from './doctorAppointmentService';

export interface PatientRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientWithStats extends PatientRecord {
  appointmentCount: number;
  lastAppointment?: string;
  totalAmountSpent?: number;
  upcomingAppointments: number;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  follow_up_date?: string;
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

class DoctorPatientService {
  async getPatients(
    doctorId: string,
    searchTerm?: string
  ): Promise<{ success: boolean; data: PatientWithStats[]; error?: string }> {
    try {
      let query = supabase
        .from('patients')
        .select(`
          *,
          appointments!inner(
            id,
            appointment_date,
            status,
            total_amount,
            doctor_id
          )
        `)
        .eq('appointments.doctor_id', doctorId);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data to add stats
      const patientsWithStats: PatientWithStats[] = (data || []).map((patient: any) => {
        const appointments = patient.appointments || [];
        const completedAppointments = appointments.filter((apt: any) => apt.status === 'completed');
        const upcomingAppointments = appointments.filter((apt: any) => 
          ['scheduled', 'confirmed', 'payment_confirmed'].includes(apt.status)
        );

        return {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
          phone: patient.phone,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          address: patient.address,
          emergency_contact_name: patient.emergency_contact_name,
          emergency_contact_phone: patient.emergency_contact_phone,
          medical_history: patient.medical_history,
          allergies: patient.allergies,
          medications: patient.medications,
          created_at: patient.created_at,
          updated_at: patient.updated_at,
          appointmentCount: appointments.length,
          lastAppointment: completedAppointments.length > 0 
            ? completedAppointments[0].appointment_date 
            : undefined,
          totalAmountSpent: completedAppointments.reduce((sum: number, apt: any) => sum + (apt.total_amount || 0), 0),
          upcomingAppointments: upcomingAppointments.length
        };
      });

      // Remove duplicates and sort
      const uniquePatients = patientsWithStats.filter((patient, index, self) =>
        index === self.findIndex(p => p.id === patient.id)
      ).sort((a, b) => b.lastAppointment ? a.lastAppointment ? 0 : -1 : a.lastAppointment ? 1 : 0);

      return { success: true, data: uniquePatients };
    } catch (error) {
      console.error('Error fetching patients:', error);
      return { success: false, data: [], error: 'Failed to fetch patients' };
    }
  }

  async getPatientDetails(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; data: PatientRecord | null; error?: string }> {
    try {
      // Verify that this doctor has seen this patient before
      const { data: appointmentCheck, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .limit(1);

      if (checkError) throw checkError;
      if (!appointmentCheck || appointmentCheck.length === 0) {
        return { success: false, data: null, error: 'Patient not found or no appointments with this doctor' };
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return { success: false, data: null, error: 'Failed to fetch patient details' };
    }
  }

  async updatePatientRecord(
    patientId: string,
    updates: Partial<PatientRecord>,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify doctor has seen this patient
      const { data: appointmentCheck } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .limit(1);

      if (!appointmentCheck || appointmentCheck.length === 0) {
        return { success: false, error: 'No authorization to update this patient record' };
      }

      const { error } = await supabase
        .from('patients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating patient record:', error);
      return { success: false, error: 'Failed to update patient record' };
    }
  }

  async createMedicalRecord(
    medicalRecord: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          ...medicalRecord,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating medical record:', error);
      return { success: false, error: 'Failed to create medical record' };
    }
  }

  async getMedicalRecords(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; data: MedicalRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return { success: false, data: [], error: 'Failed to fetch medical records' };
    }
  }

  async updateMedicalRecord(
    recordId: string,
    updates: Partial<MedicalRecord>,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('medical_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .eq('doctor_id', doctorId); // Ensure doctor can only update their own records

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating medical record:', error);
      return { success: false, error: 'Failed to update medical record' };
    }
  }

  async getPatientVitals(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; data: MedicalRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          blood_pressure,
          heart_rate,
          temperature,
          weight,
          height,
          created_at,
          appointment:appointments(appointment_date)
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .not('blood_pressure', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20); // Get last 20 records with vitals

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      return { success: false, data: [], error: 'Failed to fetch patient vitals' };
    }
  }

  async searchPatientsByName(
    doctorId: string,
    searchQuery: string
  ): Promise<{ success: boolean; data: PatientRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient:patients(*)
        `)
        .eq('doctor_id', doctorId)
        .or(`patient.first_name.ilike.%${searchQuery}%,patient.last_name.ilike.%${searchQuery}%`);

      if (error) throw error;

      // Extract unique patients
      const uniquePatients = data?.reduce((acc: any[], curr: any) => {
        const patient = curr.patient;
        if (patient && !acc.find((p: any) => p.id === patient.id)) {
          acc.push(patient);
        }
        return acc;
      }, []) || [];

      return { success: true, data: uniquePatients };
    } catch (error) {
      console.error('Error searching patients:', error);
      return { success: false, data: [], error: 'Failed to search patients' };
    }
  }

  async getPatientStats(
    doctorId: string,
    patientId: string
  ): Promise<{ 
    success: boolean; 
    data: {
      totalAppointments: number;
      completedAppointments: number;
      totalSpent: number;
      firstVisit: string;
      lastVisit: string;
      upcomingAppointments: number;
    }; 
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, status, total_amount')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const appointments = data || [];
      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const upcomingAppointments = appointments.filter(apt => 
        ['scheduled', 'confirmed', 'payment_confirmed'].includes(apt.status)
      );

      const stats = {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        totalSpent: completedAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0),
        firstVisit: appointments.length > 0 ? appointments[0].appointment_date : '',
        lastVisit: appointments.length > 0 ? appointments[appointments.length - 1].appointment_date : '',
        upcomingAppointments: upcomingAppointments.length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      return { 
        success: false, 
        data: {
          totalAppointments: 0,
          completedAppointments: 0,
          totalSpent: 0,
          firstVisit: '',
          lastVisit: '',
          upcomingAppointments: 0
        }, 
        error: 'Failed to fetch patient stats' 
      };
    }
  }
}

export const doctorPatientService = new DoctorPatientService();
