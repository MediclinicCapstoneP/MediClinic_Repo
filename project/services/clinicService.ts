import { supabase } from '@/lib/supabase';
import { ClinicWithDetails, Clinic } from '@/lib/supabase';

export interface ClinicFilters {
  search?: string;
  city?: string;
  state?: string;
  specialties?: string[];
  services?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  rating?: number;
  page?: number;
  limit?: number;
}

export interface NearbyClinicResult {
  clinic: ClinicWithDetails;
  distance: number; // in kilometers
}

class ClinicService {
  /**
   * Get clinics with filters and pagination
   */
  async getClinics(filters: ClinicFilters = {}): Promise<{
    success: boolean;
    clinics?: ClinicWithDetails[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('clinics')
        .select(`
          *,
          services:clinic_services (
            id, service_name, service_type, base_price, duration_minutes
          ),
          doctors (
            id, full_name, specialization, rating, profile_picture_url
          ),
          reviews (
            id, rating, review_text, created_at
          )
        `, { count: 'exact' });

      // Only show approved clinics
      query = query.eq('status', 'approved');

      // Apply text search filter
      if (filters.search) {
        query = query.or(`clinic_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply location filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.ilike('state', `%${filters.state}%`);
      }

      // Apply specialty filters
      if (filters.specialties && filters.specialties.length > 0) {
        query = query.or(
          `specialties.cs.{${filters.specialties.join(',')}},custom_specialties.cs.{${filters.specialties.join(',')}}`
        );
      }

      // Apply service filters
      if (filters.services && filters.services.length > 0) {
        query = query.or(
          `services.cs.{${filters.services.join(',')}},custom_services.cs.{${filters.services.join(',')}}`
        );
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data: clinics, error, count } = await query;

      if (error) {
        console.error('Error fetching clinics:', error);
        return {
          success: false,
          error: 'Failed to fetch clinics',
        };
      }

      // Calculate average ratings and enhance clinic data
      const enhancedClinics: ClinicWithDetails[] = (clinics || []).map(clinic => {
        const reviews = clinic.reviews || [];
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
          : 0;

        return {
          ...clinic,
          average_rating: averageRating,
          total_reviews: reviews.length,
        };
      });

      // Apply proximity filter if location provided
      let filteredClinics = enhancedClinics;
      if (filters.latitude && filters.longitude && filters.radius) {
        filteredClinics = this.filterClinicsByProximity(
          enhancedClinics,
          filters.latitude,
          filters.longitude,
          filters.radius
        );
      }

      // Apply rating filter
      if (filters.rating) {
        filteredClinics = filteredClinics.filter(clinic => 
          (clinic.average_rating || 0) >= filters.rating!
        );
      }

      return {
        success: true,
        clinics: filteredClinics,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getClinics:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get nearby clinics based on user location
   */
  async getNearbyClinic(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<{
    success: boolean;
    clinics?: NearbyClinicResult[];
    error?: string;
  }> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select(`
          *,
          services:clinic_services (
            id, service_name, service_type, base_price, duration_minutes
          ),
          doctors (
            id, full_name, specialization, rating, profile_picture_url
          ),
          reviews (
            id, rating, review_text, created_at
          )
        `)
        .eq('status', 'approved')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching nearby clinics:', error);
        return {
          success: false,
          error: 'Failed to fetch nearby clinics',
        };
      }

      // Calculate distances and filter by radius
      const nearbyResults: NearbyClinicResult[] = [];

      for (const clinic of clinics || []) {
        if (clinic.latitude && clinic.longitude) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            clinic.latitude,
            clinic.longitude
          );

          if (distance <= radius) {
            const reviews = clinic.reviews || [];
            const averageRating = reviews.length > 0 
              ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
              : 0;

            nearbyResults.push({
              clinic: {
                ...clinic,
                average_rating: averageRating,
                total_reviews: reviews.length,
              },
              distance,
            });
          }
        }
      }

      // Sort by distance
      nearbyResults.sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        clinics: nearbyResults,
      };
    } catch (error) {
      console.error('Error in getNearbyClinic:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get clinic by ID with full details
   */
  async getClinicById(id: string): Promise<{
    success: boolean;
    clinic?: ClinicWithDetails;
    error?: string;
  }> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select(`
          *,
          services:clinic_services (
            id, service_name, service_type, description, 
            base_price, duration_minutes, is_active
          ),
          doctors (
            id, full_name, specialization, years_experience,
            email, phone, rating, total_patients, 
            profile_picture_url, status
          ),
          reviews (
            id, rating, review_text, service_quality,
            facility_cleanliness, staff_friendliness,
            wait_time_satisfaction, overall_experience,
            would_recommend, is_verified, created_at,
            patients:patient_id (first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching clinic:', error);
        return {
          success: false,
          error: 'Clinic not found',
        };
      }

      if (!clinic) {
        return {
          success: false,
          error: 'Clinic not found',
        };
      }

      // Calculate metrics
      const reviews = clinic.reviews || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
        : 0;

      const enhancedClinic: ClinicWithDetails = {
        ...clinic,
        average_rating: averageRating,
        total_reviews: reviews.length,
      };

      return {
        success: true,
        clinic: enhancedClinic,
      };
    } catch (error) {
      console.error('Error in getClinicById:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Search clinics by text
   */
  async searchClinics(searchText: string, limit: number = 10): Promise<{
    success: boolean;
    clinics?: ClinicWithDetails[];
    error?: string;
  }> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select(`
          *,
          services:clinic_services (
            id, service_name, service_type, base_price, duration_minutes
          ),
          doctors (
            id, full_name, specialization, profile_picture_url
          ),
          reviews (
            id, rating
          )
        `)
        .eq('status', 'approved')
        .or(`clinic_name.ilike.%${searchText}%,description.ilike.%${searchText}%,city.ilike.%${searchText}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching clinics:', error);
        return {
          success: false,
          error: 'Search failed',
        };
      }

      // Enhance with ratings
      const enhancedClinics: ClinicWithDetails[] = (clinics || []).map(clinic => {
        const reviews = clinic.reviews || [];
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
          : 0;

        return {
          ...clinic,
          average_rating: averageRating,
          total_reviews: reviews.length,
        };
      });

      return {
        success: true,
        clinics: enhancedClinics,
      };
    } catch (error) {
      console.error('Error in searchClinics:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get popular specialties
   */
  async getPopularSpecialties(): Promise<{
    success: boolean;
    specialties?: string[];
    error?: string;
  }> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('specialties, custom_specialties')
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching specialties:', error);
        return {
          success: false,
          error: 'Failed to fetch specialties',
        };
      }

      // Count specialty occurrences
      const specialtyCount: { [key: string]: number } = {};

      for (const clinic of clinics || []) {
        // Count standard specialties
        if (clinic.specialties) {
          for (const specialty of clinic.specialties) {
            specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
          }
        }

        // Count custom specialties
        if (clinic.custom_specialties) {
          for (const specialty of clinic.custom_specialties) {
            specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
          }
        }
      }

      // Sort by popularity and get top 10
      const sortedSpecialties = Object.entries(specialtyCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([specialty]) => specialty);

      return {
        success: true,
        specialties: sortedSpecialties,
      };
    } catch (error) {
      console.error('Error in getPopularSpecialties:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get clinic operating hours for a specific date
   */
  getClinicOperatingHours(clinic: Clinic, date: string): {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  } {
    if (!clinic.operating_hours) {
      return { isOpen: false };
    }

    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dayHours = clinic.operating_hours[dayName];
    
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return { isOpen: false };
    }

    return {
      isOpen: true,
      openTime: dayHours.open,
      closeTime: dayHours.close,
    };
  }

  /**
   * Private helper methods
   */
  private filterClinicsByProximity(
    clinics: ClinicWithDetails[],
    latitude: number,
    longitude: number,
    radius: number
  ): ClinicWithDetails[] {
    return clinics.filter(clinic => {
      if (!clinic.latitude || !clinic.longitude) {
        return false;
      }

      const distance = this.calculateDistance(
        latitude,
        longitude,
        clinic.latitude,
        clinic.longitude
      );

      return distance <= radius;
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const clinicService = new ClinicService();
