import { supabase } from '../../../supabaseClient';

export interface ReviewWithPatient {
  id: string;
  rating: number;
  review_text?: string;
  service_quality?: number;
  facility_cleanliness?: number;
  staff_friendliness?: number;
  wait_time_satisfaction?: number;
  overall_experience?: number;
  would_recommend: boolean;
  is_verified: boolean;
  created_at: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  appointments?: {
    id: string;
    appointment_date: string;
    appointment_type: string;
  };
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  qualityMetrics: {
    serviceQuality: number;
    facilityCleanliness: number;
    staffFriendliness: number;
    waitTimeSatisfaction: number;
    overallExperience: number;
  };
  recommendationRate: number;
  verifiedReviewsCount: number;
  recentTrend: {
    period: string;
    averageRating: number;
    reviewCount: number;
  }[];
}

export interface ReviewSentiment {
  positive: number;
  neutral: number;
  negative: number;
}

class ReviewsService {
  /**
   * Get latest reviews for a clinic with patient information
   */
  async getLatestReviews(
    clinicId: string, 
    limit: number = 5
  ): Promise<{ success: boolean; reviews?: ReviewWithPatient[]; error?: string }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          review_text,
          service_quality,
          facility_cleanliness,
          staff_friendliness,
          wait_time_satisfaction,
          overall_experience,
          would_recommend,
          is_verified,
          created_at,
          patients:patient_id (
            id,
            first_name,
            last_name,
            email
          ),
          appointments:appointment_id (
            id,
            appointment_date,
            appointment_type
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { 
        success: true, 
        reviews: reviews || [] 
      };
    } catch (error) {
      console.error('Error fetching latest reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews'
      };
    }
  }

  /**
   * Get comprehensive review analytics for a clinic
   */
  async getReviewAnalytics(clinicId: string): Promise<{ success: boolean; analytics?: ReviewAnalytics; error?: string }> {
    try {
      // Get all reviews for the clinic
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          service_quality,
          facility_cleanliness,
          staff_friendliness,
          wait_time_satisfaction,
          overall_experience,
          would_recommend,
          is_verified,
          created_at
        `)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return {
          success: true,
          analytics: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: [],
            qualityMetrics: {
              serviceQuality: 0,
              facilityCleanliness: 0,
              staffFriendliness: 0,
              waitTimeSatisfaction: 0,
              overallExperience: 0,
            },
            recommendationRate: 0,
            verifiedReviewsCount: 0,
            recentTrend: []
          }
        };
      }

      // Calculate basic metrics
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Rating distribution
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingCounts[review.rating as keyof typeof ratingCounts]++;
        }
      });

      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: Math.round((count / totalReviews) * 100)
      }));

      // Quality metrics (only for reviews that have these fields)
      const qualityReviews = reviews.filter(r => 
        r.service_quality && r.facility_cleanliness && r.staff_friendliness && 
        r.wait_time_satisfaction && r.overall_experience
      );

      const qualityMetrics = qualityReviews.length > 0 ? {
        serviceQuality: qualityReviews.reduce((sum, r) => sum + (r.service_quality || 0), 0) / qualityReviews.length,
        facilityCleanliness: qualityReviews.reduce((sum, r) => sum + (r.facility_cleanliness || 0), 0) / qualityReviews.length,
        staffFriendliness: qualityReviews.reduce((sum, r) => sum + (r.staff_friendliness || 0), 0) / qualityReviews.length,
        waitTimeSatisfaction: qualityReviews.reduce((sum, r) => sum + (r.wait_time_satisfaction || 0), 0) / qualityReviews.length,
        overallExperience: qualityReviews.reduce((sum, r) => sum + (r.overall_experience || 0), 0) / qualityReviews.length,
      } : {
        serviceQuality: 0,
        facilityCleanliness: 0,
        staffFriendliness: 0,
        waitTimeSatisfaction: 0,
        overallExperience: 0,
      };

      // Recommendation rate
      const recommendingReviews = reviews.filter(r => r.would_recommend).length;
      const recommendationRate = Math.round((recommendingReviews / totalReviews) * 100);

      // Verified reviews count
      const verifiedReviewsCount = reviews.filter(r => r.is_verified).length;

      // Recent trend (last 6 months)
      const recentTrend = this.calculateRecentTrend(reviews);

      const analytics: ReviewAnalytics = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        qualityMetrics: {
          serviceQuality: Math.round(qualityMetrics.serviceQuality * 10) / 10,
          facilityCleanliness: Math.round(qualityMetrics.facilityCleanliness * 10) / 10,
          staffFriendliness: Math.round(qualityMetrics.staffFriendliness * 10) / 10,
          waitTimeSatisfaction: Math.round(qualityMetrics.waitTimeSatisfaction * 10) / 10,
          overallExperience: Math.round(qualityMetrics.overallExperience * 10) / 10,
        },
        recommendationRate,
        verifiedReviewsCount,
        recentTrend
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Error calculating review analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate review analytics'
      };
    }
  }

  /**
   * Get review sentiment analysis
   */
  async getReviewSentiment(clinicId: string): Promise<{ success: boolean; sentiment?: ReviewSentiment; error?: string }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('clinic_id', clinicId);

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return {
          success: true,
          sentiment: { positive: 0, neutral: 0, negative: 0 }
        };
      }

      let positive = 0;
      let neutral = 0;
      let negative = 0;

      reviews.forEach(review => {
        if (review.rating >= 4) {
          positive++;
        } else if (review.rating === 3) {
          neutral++;
        } else {
          negative++;
        }
      });

      return {
        success: true,
        sentiment: { positive, neutral, negative }
      };
    } catch (error) {
      console.error('Error calculating review sentiment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate review sentiment'
      };
    }
  }

  /**
   * Get reviews by doctor within a clinic
   */
  async getReviewsByDoctor(
    clinicId: string,
    doctorId?: string
  ): Promise<{ success: boolean; reviews?: ReviewWithPatient[]; error?: string }> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          review_text,
          service_quality,
          facility_cleanliness,
          staff_friendliness,
          wait_time_satisfaction,
          overall_experience,
          would_recommend,
          is_verified,
          created_at,
          patients:patient_id (
            id,
            first_name,
            last_name,
            email
          ),
          appointments:appointment_id (
            id,
            appointment_date,
            appointment_type
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data: reviews, error } = await query;

      if (error) throw error;

      return { success: true, reviews: reviews || [] };
    } catch (error) {
      console.error('Error fetching reviews by doctor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews by doctor'
      };
    }
  }

  /**
   * Calculate recent trend for the last 6 months
   */
  private calculateRecentTrend(reviews: any[]) {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        monthName: date.toLocaleString('default', { month: 'short' }),
        reviews: []
      });
    }

    // Group reviews by month
    reviews.forEach(review => {
      const reviewDate = new Date(review.created_at);
      const monthIndex = months.findIndex(m => 
        m.year === reviewDate.getFullYear() && m.month === reviewDate.getMonth()
      );
      if (monthIndex !== -1) {
        months[monthIndex].reviews.push(review);
      }
    });

    // Calculate averages for each month
    return months.map(month => ({
      period: month.monthName,
      averageRating: month.reviews.length > 0 
        ? Math.round((month.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / month.reviews.length) * 10) / 10
        : 0,
      reviewCount: month.reviews.length
    }));
  }

  /**
   * Get review statistics comparison with previous period
   */
  async getReviewComparison(
    clinicId: string,
    days: number = 30
  ): Promise<{ 
    success: boolean; 
    comparison?: {
      current: { average: number; count: number };
      previous: { average: number; count: number };
      change: { rating: number; count: number };
    }; 
    error?: string 
  }> {
    try {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

      // Get current period reviews
      const { data: currentReviews, error: currentError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('clinic_id', clinicId)
        .gte('created_at', currentPeriodStart.toISOString());

      if (currentError) throw currentError;

      // Get previous period reviews
      const { data: previousReviews, error: previousError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('clinic_id', clinicId)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', currentPeriodStart.toISOString());

      if (previousError) throw previousError;

      const currentAvg = currentReviews && currentReviews.length > 0
        ? currentReviews.reduce((sum, r) => sum + r.rating, 0) / currentReviews.length
        : 0;

      const previousAvg = previousReviews && previousReviews.length > 0
        ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
        : 0;

      const comparison = {
        current: {
          average: Math.round(currentAvg * 10) / 10,
          count: currentReviews?.length || 0
        },
        previous: {
          average: Math.round(previousAvg * 10) / 10,
          count: previousReviews?.length || 0
        },
        change: {
          rating: Math.round((currentAvg - previousAvg) * 10) / 10,
          count: (currentReviews?.length || 0) - (previousReviews?.length || 0)
        }
      };

      return { success: true, comparison };
    } catch (error) {
      console.error('Error calculating review comparison:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate review comparison'
      };
    }
  }
}

export const reviewsService = new ReviewsService();
