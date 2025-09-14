import { supabase } from '../lib/supabase';

// Review interfaces
export interface Review {
  id: string;
  patient_id: string;
  appointment_id: string;
  clinic_id: string;
  doctor_id?: string;
  overall_rating: number;
  staff_rating?: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  review_title?: string;
  review_text?: string;
  is_anonymous: boolean;
  is_verified: boolean;
  is_published: boolean;
  helpful_votes: number;
  total_votes: number;
  clinic_response?: string;
  clinic_response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDetails extends Review {
  patient: {
    first_name: string;
    last_name: string;
  };
  clinic: {
    clinic_name: string;
  };
  doctor?: {
    full_name: string;
    specialization: string;
  };
  appointment: {
    appointment_date: string;
    appointment_type: string;
  };
}

export interface ClinicRating {
  clinic_id: string;
  clinic_name: string;
  total_reviews: number;
  average_rating: number;
  average_staff_rating: number;
  average_cleanliness_rating: number;
  average_communication_rating: number;
  average_value_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  latest_review_date: string;
}

export interface CreateReviewParams {
  patient_id: string;
  appointment_id: string;
  clinic_id: string;
  doctor_id?: string;
  overall_rating: number;
  staff_rating?: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  review_title?: string;
  review_text?: string;
  is_anonymous?: boolean;
}

export interface UpdateReviewParams {
  overall_rating?: number;
  staff_rating?: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  review_title?: string;
  review_text?: string;
  is_anonymous?: boolean;
}

export class ReviewService {
  /**
   * Create a new review for an appointment
   */
  static async createReview(params: CreateReviewParams): Promise<{ review?: Review; error?: string }> {
    try {
      // Validate rating values
      const validateRating = (rating: number | undefined, name: string) => {
        if (rating !== undefined && (rating < 1 || rating > 5)) {
          throw new Error(`${name} must be between 1 and 5`);
        }
      };

      validateRating(params.overall_rating, 'Overall rating');
      validateRating(params.staff_rating, 'Staff rating');
      validateRating(params.cleanliness_rating, 'Cleanliness rating');
      validateRating(params.communication_rating, 'Communication rating');
      validateRating(params.value_rating, 'Value rating');

      // Check if review already exists for this appointment
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', params.appointment_id)
        .eq('patient_id', params.patient_id)
        .single();

      if (existingReview) {
        return { error: 'A review already exists for this appointment' };
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          ...params,
          is_anonymous: params.is_anonymous || false,
          is_verified: true, // Always verified since tied to actual appointment
          is_published: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        return { error: error.message };
      }

      return { review: data };
    } catch (error) {
      console.error('Error in createReview:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create review' };
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(
    reviewId: string,
    params: UpdateReviewParams
  ): Promise<{ review?: Review; error?: string }> {
    try {
      // Validate rating values
      const validateRating = (rating: number | undefined, name: string) => {
        if (rating !== undefined && (rating < 1 || rating > 5)) {
          throw new Error(`${name} must be between 1 and 5`);
        }
      };

      if (params.overall_rating !== undefined) validateRating(params.overall_rating, 'Overall rating');
      if (params.staff_rating !== undefined) validateRating(params.staff_rating, 'Staff rating');
      if (params.cleanliness_rating !== undefined) validateRating(params.cleanliness_rating, 'Cleanliness rating');
      if (params.communication_rating !== undefined) validateRating(params.communication_rating, 'Communication rating');
      if (params.value_rating !== undefined) validateRating(params.value_rating, 'Value rating');

      const { data, error } = await supabase
        .from('reviews')
        .update(params)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return { error: error.message };
      }

      return { review: data };
    } catch (error) {
      console.error('Error in updateReview:', error);
      return { error: error instanceof Error ? error.message : 'Failed to update review' };
    }
  }

  /**
   * Get review by appointment ID
   */
  static async getReviewByAppointment(
    appointmentId: string,
    patientId: string
  ): Promise<{ review?: Review; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .eq('patient_id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No review found
          return { review: undefined };
        }
        console.error('Error fetching review:', error);
        return { error: error.message };
      }

      return { review: data };
    } catch (error) {
      console.error('Error in getReviewByAppointment:', error);
      return { error: 'Failed to fetch review' };
    }
  }

  /**
   * Get reviews for a clinic with pagination
   */
  static async getClinicReviews(
    clinicId: string,
    options?: {
      limit?: number;
      offset?: number;
      minRating?: number;
      includeDetails?: boolean;
    }
  ): Promise<{ reviews: ReviewWithDetails[] | Review[]; error?: string }> {
    try {
      let query = supabase
        .from('reviews')
        .select(options?.includeDetails ? `
          *,
          patient:patients(first_name, last_name),
          clinic:clinics(clinic_name),
          doctor:doctors(full_name, specialization),
          appointment:appointments(appointment_date, appointment_type)
        ` : '*')
        .eq('clinic_id', clinicId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (options?.minRating) {
        query = query.gte('overall_rating', options.minRating);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching clinic reviews:', error);
        return { reviews: [], error: error.message };
      }

      return { reviews: data || [] };
    } catch (error) {
      console.error('Error in getClinicReviews:', error);
      return { reviews: [], error: 'Failed to fetch clinic reviews' };
    }
  }

  /**
   * Get reviews by a specific patient
   */
  static async getPatientReviews(
    patientId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeDetails?: boolean;
    }
  ): Promise<{ reviews: ReviewWithDetails[] | Review[]; error?: string }> {
    try {
      let query = supabase
        .from('reviews')
        .select(options?.includeDetails ? `
          *,
          clinic:clinics(clinic_name),
          doctor:doctors(full_name, specialization),
          appointment:appointments(appointment_date, appointment_type)
        ` : '*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patient reviews:', error);
        return { reviews: [], error: error.message };
      }

      return { reviews: data || [] };
    } catch (error) {
      console.error('Error in getPatientReviews:', error);
      return { reviews: [], error: 'Failed to fetch patient reviews' };
    }
  }

  /**
   * Get clinic rating summary
   */
  static async getClinicRating(clinicId: string): Promise<{ rating?: ClinicRating; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinic_ratings')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No ratings found, return default
          const { data: clinic } = await supabase
            .from('clinics')
            .select('clinic_name')
            .eq('id', clinicId)
            .single();

          const defaultRating: ClinicRating = {
            clinic_id: clinicId,
            clinic_name: clinic?.clinic_name || 'Unknown Clinic',
            total_reviews: 0,
            average_rating: 0,
            average_staff_rating: 0,
            average_cleanliness_rating: 0,
            average_communication_rating: 0,
            average_value_rating: 0,
            five_star_count: 0,
            four_star_count: 0,
            three_star_count: 0,
            two_star_count: 0,
            one_star_count: 0,
            latest_review_date: new Date().toISOString()
          };

          return { rating: defaultRating };
        }
        console.error('Error fetching clinic rating:', error);
        return { error: error.message };
      }

      return { rating: data };
    } catch (error) {
      console.error('Error in getClinicRating:', error);
      return { error: 'Failed to fetch clinic rating' };
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteReview:', error);
      return { success: false, error: 'Failed to delete review' };
    }
  }

  /**
   * Check if patient can review an appointment
   */
  static async canReviewAppointment(
    appointmentId: string,
    patientId: string
  ): Promise<{ canReview: boolean; reason?: string; error?: string }> {
    try {
      // Check if appointment exists and is completed
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('status, patient_id')
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        return { canReview: false, error: appointmentError.message };
      }

      if (!appointment) {
        return { canReview: false, reason: 'Appointment not found' };
      }

      if (appointment.patient_id !== patientId) {
        return { canReview: false, reason: 'You can only review your own appointments' };
      }

      if (appointment.status !== 'completed') {
        return { canReview: false, reason: 'You can only review completed appointments' };
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('patient_id', patientId)
        .single();

      if (existingReview) {
        return { canReview: false, reason: 'You have already reviewed this appointment' };
      }

      return { canReview: true };
    } catch (error) {
      console.error('Error in canReviewAppointment:', error);
      return { canReview: false, error: 'Failed to check review eligibility' };
    }
  }

  /**
   * Vote on review helpfulness
   */
  static async voteOnReview(
    reviewId: string,
    isHelpful: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This is a simplified version - in a real app, you'd track who voted
      const increment = isHelpful ? 1 : 0;
      
      const { error } = await supabase
        .from('reviews')
        .update({
          helpful_votes: supabase.raw(`helpful_votes + ${increment}`),
          total_votes: supabase.raw('total_votes + 1')
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error voting on review:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in voteOnReview:', error);
      return { success: false, error: 'Failed to vote on review' };
    }
  }

  /**
   * Get recent reviews across all clinics
   */
  static async getRecentReviews(
    limit: number = 10
  ): Promise<{ reviews: ReviewWithDetails[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(first_name, last_name),
          clinic:clinics(clinic_name),
          doctor:doctors(full_name, specialization),
          appointment:appointments(appointment_date, appointment_type)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent reviews:', error);
        return { reviews: [], error: error.message };
      }

      return { reviews: data || [] };
    } catch (error) {
      console.error('Error in getRecentReviews:', error);
      return { reviews: [], error: 'Failed to fetch recent reviews' };
    }
  }

  /**
   * Search reviews by text
   */
  static async searchReviews(
    query: string,
    options?: {
      clinicId?: string;
      minRating?: number;
      limit?: number;
    }
  ): Promise<{ reviews: ReviewWithDetails[]; error?: string }> {
    try {
      let supabaseQuery = supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(first_name, last_name),
          clinic:clinics(clinic_name),
          doctor:doctors(full_name, specialization),
          appointment:appointments(appointment_date, appointment_type)
        `)
        .eq('is_published', true)
        .or(`review_title.ilike.%${query}%,review_text.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (options?.clinicId) {
        supabaseQuery = supabaseQuery.eq('clinic_id', options.clinicId);
      }

      if (options?.minRating) {
        supabaseQuery = supabaseQuery.gte('overall_rating', options.minRating);
      }

      if (options?.limit) {
        supabaseQuery = supabaseQuery.limit(options.limit);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error searching reviews:', error);
        return { reviews: [], error: error.message };
      }

      return { reviews: data || [] };
    } catch (error) {
      console.error('Error in searchReviews:', error);
      return { reviews: [], error: 'Failed to search reviews' };
    }
  }
}