import { supabase } from '../lib/supabase';

export interface DoctorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  experience_years: number;
  education: string;
  bio?: string;
  profile_image_url?: string;
  consultation_fee: number;
  clinic_id: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clinic?: {
    clinic_name: string;
    address: string;
    phone: string;
  };
}

export interface DoctorProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  education?: string;
  bio?: string;
  profile_image_url?: string;
  consultation_fee?: number;
}

export interface ProfileImageUpload {
  uri: string;
  type: string;
  name: string;
}

class DoctorProfileService {
  async getDoctorProfile(doctorId: string): Promise<{ success: boolean; data?: DoctorProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          clinic:clinics(clinic_name, address, phone)
        `)
        .eq('id', doctorId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      return { success: false, error: 'Failed to fetch doctor profile' };
    }
  }

  async updateDoctorProfile(
    doctorId: string,
    updates: DoctorProfileUpdate
  ): Promise<{ success: boolean; data?: DoctorProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId)
        .select(`
          *,
          clinic:clinics(clinic_name, address, phone)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return { success: false, error: 'Failed to update doctor profile' };
    }
  }

  async uploadProfileImage(
    doctorId: string,
    imageFile: ProfileImageUpload
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      // Generate unique file name
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `doctor-${doctorId}-${Date.now()}.${fileExt}`;
      const filePath = `doctor-profiles/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, {
          uri: imageFile.uri,
          type: imageFile.type,
          name: imageFile.name,
        } as any);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update doctor profile with new image URL
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (updateError) throw updateError;

      return { success: true, imageUrl: publicUrl };
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return { success: false, error: 'Failed to upload profile image' };
    }
  }

  async removeProfileImage(doctorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current profile to extract image URL
      const { data: doctor, error: fetchError } = await supabase
        .from('doctors')
        .select('profile_image_url')
        .eq('id', doctorId)
        .single();

      if (fetchError) throw fetchError;

      if (doctor?.profile_image_url) {
        // Extract file path from URL
        const urlParts = doctor.profile_image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `doctor-profiles/${fileName}`;

        // Remove from storage
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove image URL
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          profile_image_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error removing profile image:', error);
      return { success: false, error: 'Failed to remove profile image' };
    }
  }

  async changePassword(
    doctorId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify current password by getting user ID
      const { data: doctor, error: fetchError } = await supabase
        .from('doctors')
        .select('user_id')
        .eq('id', doctorId)
        .single();

      if (fetchError) throw fetchError;

      // Change password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  async getDoctorStats(doctorId: string): Promise<{ 
    success: boolean; 
    data: {
      totalAppointments: number;
      completedAppointments: number;
      totalPatients: number;
      averageRating: number;
      yearsOfExperience: number;
      totalRevenue: number;
      upcomingAppointments: number;
    }; 
    error?: string;
  }> {
    try {
      const [
        appointmentsResult,
        patientsResult,
        reviewsResult,
        doctorResult
      ] = await Promise.all([
        // Get appointment stats
        supabase
          .from('appointments')
          .select('status, total_amount')
          .eq('doctor_id', doctorId),
        
        // Get unique patients count
        supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', doctorId),
        
        // Get average rating
        supabase
          .from('reviews')
          .select('rating')
          .eq('doctor_id', doctorId),
        
        // Get doctor info
        supabase
          .from('doctors')
          .select('experience_years')
          .eq('id', doctorId)
          .single()
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (reviewsResult.error) throw reviewsResult.error;
      if (doctorResult.error) throw doctorResult.error;

      const appointments = appointmentsResult.data || [];
      const patients = patientsResult.data || [];
      const reviews = reviewsResult.data || [];
      const doctor = doctorResult.data;

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
      const totalPatients = new Set(patients.map(p => p.patient_id)).size;
      const totalRevenue = appointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.total_amount || 0), 0);
      const upcomingAppointments = appointments.filter(apt => 
        ['scheduled', 'confirmed', 'payment_confirmed'].includes(apt.status)
      ).length;

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      return {
        success: true,
        data: {
          totalAppointments,
          completedAppointments,
          totalPatients,
          averageRating,
          yearsOfExperience: doctor?.experience_years || 0,
          totalRevenue,
          upcomingAppointments
        }
      };
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      return {
        success: false,
        data: {
          totalAppointments: 0,
          completedAppointments: 0,
          totalPatients: 0,
          averageRating: 0,
          yearsOfExperience: 0,
          totalRevenue: 0,
          upcomingAppointments: 0
        },
        error: 'Failed to fetch doctor stats'
      };
    }
  }

  async getDoctorReviews(
    doctorId: string,
    limit: number = 20
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching doctor reviews:', error);
      return { success: false, data: [], error: 'Failed to fetch doctor reviews' };
    }
  }

  async updateAvailabilityStatus(
    doctorId: string,
    isAvailable: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          is_active: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating availability status:', error);
      return { success: false, error: 'Failed to update availability status' };
    }
  }

  async getSpecializations(): Promise<{ success: boolean; data: string[]; error?: string }> {
    try {
      // This is a static list - in a real app, this might come from a settings table
      const specializations = [
        'General Practice',
        'Internal Medicine',
        'Pediatrics',
        'Cardiology',
        'Dermatology',
        'Psychiatry',
        'Obstetrics & Gynecology',
        'Surgery',
        'Orthopedics',
        'Neurology',
        'Ophthalmology',
        'ENT (Ear, Nose, Throat)',
        'Radiology',
        'Pathology',
        'Anesthesiology',
        'Emergency Medicine',
        'Family Medicine',
        'Gastroenterology',
        'Endocrinology',
        'Nephrology',
        'Pulmonology',
        'Rheumatology',
        'Infectious Disease',
        'Oncology',
        'Urology',
        'Physical Medicine & Rehabilitation'
      ];

      return { success: true, data: specializations };
    } catch (error) {
      console.error('Error fetching specializations:', error);
      return { success: false, data: [], error: 'Failed to fetch specializations' };
    }
  }

  async validateProfileData(profile: DoctorProfileUpdate): Promise<{ 
    valid: boolean; 
    errors?: string[]; 
    warnings?: string[] 
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!profile.first_name?.trim()) {
      errors.push('First name is required');
    }

    if (!profile.last_name?.trim()) {
      errors.push('Last name is required');
    }

    if (!profile.phone?.trim()) {
      errors.push('Phone number is required');
    }

    if (!profile.specialization?.trim()) {
      errors.push('Specialization is required');
    }

    if (!profile.license_number?.trim()) {
      errors.push('License number is required');
    }

    if (profile.experience_years !== undefined && (profile.experience_years < 0 || profile.experience_years > 70)) {
      errors.push('Years of experience must be between 0 and 70');
    }

    if (profile.consultation_fee !== undefined && (profile.consultation_fee < 0 || profile.consultation_fee > 10000)) {
      errors.push('Consultation fee must be between 0 and 10000');
    }

    // Phone number format validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (profile.phone && !phoneRegex.test(profile.phone)) {
      errors.push('Invalid phone number format');
    }

    // Warnings
    if (profile.experience_years !== undefined && profile.experience_years < 1) {
      warnings.push('Less than 1 year of experience may affect patient trust');
    }

    if (profile.consultation_fee !== undefined && profile.consultation_fee > 2000) {
      warnings.push('High consultation fee may affect patient acquisition');
    }

    if (profile.bio && profile.bio.length > 500) {
      warnings.push('Bio is quite long, consider shortening it for better readability');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async exportDoctorProfile(doctorId: string): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const [profileResult, statsResult, reviewsResult] = await Promise.all([
        this.getDoctorProfile(doctorId),
        this.getDoctorStats(doctorId),
        this.getDoctorReviews(doctorId, 10)
      ]);

      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      const exportData = {
        profile: profileResult.data,
        stats: statsResult.success ? statsResult.data : null,
        recentReviews: reviewsResult.success ? reviewsResult.data : [],
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('Error exporting doctor profile:', error);
      return { success: false, error: 'Failed to export doctor profile' };
    }
  }
}

export const doctorProfileService = new DoctorProfileService();
