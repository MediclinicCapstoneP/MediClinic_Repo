import { supabase } from '../supabase';

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
  };
  appointment?: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CreateReviewParams {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  rating: number;
  comment: string;
}

export interface GetReviewsParams {
  doctor_id?: string;
  patient_id?: string;
  clinic_id?: string;
  appointment_id?: string;
  limit?: number;
  offset?: number;
}

export class ReviewService {
  async createReview(params: CreateReviewParams) {
    try {
      // Check if review already exists for this appointment
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', params.appointment_id)
        .single();

      if (existingReview) {
        return { success: false, error: 'Review already exists for this appointment' };
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([params])
        .select(`
          *,
          patient:patients(id, full_name, avatar_url),
          doctor:doctors(id, full_name, specialization),
          appointment:appointments(id, appointment_date, appointment_time, appointment_type)
        `)
        .single();

      if (error) {
        console.error('Error creating review:', error);
        return { success: false, error: error.message };
      }

      // Update doctor's overall rating
      await this.updateDoctorRating(params.doctor_id);

      return {
        success: true,
        review: data as Review,
      };
    } catch (error) {
      console.error('Error in createReview:', error);
      return { success: false, error: 'Failed to create review' };
    }
  }

  async getReviews(params: GetReviewsParams) {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(id, full_name, avatar_url),
          doctor:doctors(id, full_name, specialization),
          appointment:appointments(id, appointment_date, appointment_time, appointment_type)
        `)
        .order('created_at', { ascending: false });

      if (params.doctor_id) {
        query = query.eq('doctor_id', params.doctor_id);
      }

      if (params.patient_id) {
        query = query.eq('patient_id', params.patient_id);
      }

      if (params.clinic_id) {
        query = query.eq('clinic_id', params.clinic_id);
      }

      if (params.appointment_id) {
        query = query.eq('appointment_id', params.appointment_id);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        reviews: data as Review[],
      };
    } catch (error) {
      console.error('Error in getReviews:', error);
      return { success: false, error: 'Failed to fetch reviews' };
    }
  }

  async getReviewStats(doctorId: string): Promise<{ success: boolean; stats?: ReviewStats; error?: string }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      if (error) {
        console.error('Error fetching review stats:', error);
        return { success: false, error: error.message };
      }

      if (!reviews || reviews.length === 0) {
        return {
          success: true,
          stats: {
            average_rating: 0,
            total_reviews: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        };
      }

      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        success: true,
        stats: {
          average_rating: Number(averageRating.toFixed(1)),
          total_reviews: totalReviews,
          rating_distribution: ratingDistribution,
        },
      };
    } catch (error) {
      console.error('Error in getReviewStats:', error);
      return { success: false, error: 'Failed to fetch review stats' };
    }
  }

  async updateReview(reviewId: string, rating: number, comment: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select(`
          *,
          patient:patients(id, full_name, avatar_url),
          doctor:doctors(id, full_name, specialization),
          appointment:appointments(id, appointment_date, appointment_time, appointment_type)
        `)
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return { success: false, error: error.message };
      }

      // Update doctor's overall rating
      await this.updateDoctorRating(data.doctor_id);

      return {
        success: true,
        review: data as Review,
      };
    } catch (error) {
      console.error('Error in updateReview:', error);
      return { success: false, error: 'Failed to update review' };
    }
  }

  async deleteReview(reviewId: string) {
    try {
      // Get the review first to update doctor rating after deletion
      const { data: review } = await supabase
        .from('reviews')
        .select('doctor_id')
        .eq('id', reviewId)
        .single();

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        return { success: false, error: error.message };
      }

      // Update doctor's overall rating if review existed
      if (review) {
        await this.updateDoctorRating(review.doctor_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteReview:', error);
      return { success: false, error: 'Failed to delete review' };
    }
  }

  async checkCanReview(appointmentId: string, patientId: string) {
    try {
      // Check if appointment exists and is completed
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, status, patient_id')
        .eq('id', appointmentId)
        .eq('patient_id', patientId)
        .single();

      if (appointmentError || !appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      if (appointment.status !== 'completed') {
        return { success: false, error: 'Can only review completed appointments' };
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (existingReview) {
        return { success: false, error: 'Review already submitted for this appointment' };
      }

      return { success: true, canReview: true };
    } catch (error) {
      console.error('Error in checkCanReview:', error);
      return { success: false, error: 'Failed to check review eligibility' };
    }
  }

  private async updateDoctorRating(doctorId: string) {
    try {
      const statsResult = await this.getReviewStats(doctorId);
      if (statsResult.success && statsResult.stats) {
        await supabase
          .from('doctors')
          .update({
            rating: statsResult.stats.average_rating,
            total_reviews: statsResult.stats.total_reviews,
            updated_at: new Date().toISOString(),
          })
          .eq('id', doctorId);
      }
    } catch (error) {
      console.error('Error updating doctor rating:', error);
    }
  }

  async getReviewByAppointment(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          patient:patients(id, full_name, avatar_url),
          doctor:doctors(id, full_name, specialization),
          appointment:appointments(id, appointment_date, appointment_time, appointment_type)
        `)
        .eq('appointment_id', appointmentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching review by appointment:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        review: data as Review | null,
      };
    } catch (error) {
      console.error('Error in getReviewByAppointment:', error);
      return { success: false, error: 'Failed to fetch review' };
    }
  }
}

export const reviewService = new ReviewService();
