import { clinicService, type ClinicProfile } from '../features/auth/utils/clinicService';
import { doctorService, type DoctorProfile } from '../features/auth/utils/doctorService';

// Interface for clinics with services and pricing
interface ClinicWithServices extends ClinicProfile {
  services_with_pricing?: any[];
}

export interface SearchResult {
  type: 'clinic' | 'doctor' | 'service';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  clinicId?: string;
  clinicName?: string;
  data: ClinicProfile | DoctorProfile | string;
  relevanceScore?: number; // For sorting results
}

class SearchService {
  private clinics: ClinicWithServices[] = [];
  private doctors: DoctorProfile[] = [];
  private allServices: string[] = [];
  private initialized = false;

  // Initialize data cache
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Fetch clinics
      const clinicResult = await clinicService.getPublicClinics();
      if (clinicResult.success && clinicResult.clinics) {
        this.clinics = clinicResult.clinics as ClinicWithServices[];
      }

      // Fetch doctors
      const doctorResult = await doctorService.getAllActiveDoctors();
      if (doctorResult.success && doctorResult.doctors) {
        this.doctors = doctorResult.doctors;
      }

      // Extract all services
      this.extractAllServices();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing search service:', error);
    }
  }

  // Extract all unique services from clinics
  private extractAllServices(): void {
    const services = new Set<string>();
    
    this.clinics.forEach(clinic => {
      // Add various service fields
      [
        ...(clinic.services || []),
        ...(clinic.custom_services || []),
        ...(clinic.specialties || []),
        ...(clinic.custom_specialties || []),
        ...(clinic.services_with_pricing?.map((s: any) => s.service_name) || [])
      ].forEach(service => {
        if (service && service.trim()) {
          services.add(service.trim());
        }
      });
    });

    this.allServices = Array.from(services).sort();
  }

  // Calculate relevance score for search results
  private calculateRelevanceScore(query: string, title: string, subtitle?: string, description?: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const subtitleLower = subtitle?.toLowerCase() || '';
    const descriptionLower = description?.toLowerCase() || '';

    let score = 0;

    // Exact match in title
    if (titleLower === queryLower) score += 100;
    // Title starts with query
    else if (titleLower.startsWith(queryLower)) score += 80;
    // Title contains query
    else if (titleLower.includes(queryLower)) score += 60;

    // Exact match in subtitle
    if (subtitleLower === queryLower) score += 50;
    // Subtitle contains query
    else if (subtitleLower.includes(queryLower)) score += 30;

    // Description contains query
    if (descriptionLower.includes(queryLower)) score += 20;

    // Word boundary matches
    const words = queryLower.split(' ');
    words.forEach(word => {
      if (word.length > 2) { // Only consider words longer than 2 characters
        if (titleLower.includes(` ${word} `) || titleLower.startsWith(`${word} `) || titleLower.endsWith(` ${word}`)) {
          score += 15;
        }
        if (subtitleLower.includes(` ${word} `) || subtitleLower.startsWith(`${word} `) || subtitleLower.endsWith(` ${word}`)) {
          score += 10;
        }
      }
    });

    return score;
  }

  // Search clinics
  private searchClinics(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    this.clinics.forEach(clinic => {
      let relevanceScore = 0;
      let matches = false;

      // Check various fields for matches
      if (clinic.clinic_name.toLowerCase().includes(queryLower)) {
        matches = true;
        relevanceScore += this.calculateRelevanceScore(
          query, 
          clinic.clinic_name,
          clinic.city,
          clinic.description
        );
      }

      if (clinic.description?.toLowerCase().includes(queryLower)) {
        matches = true;
        relevanceScore += this.calculateRelevanceScore(
          query,
          clinic.description,
          clinic.clinic_name,
          clinic.city
        );
      }

      if (clinic.address?.toLowerCase().includes(queryLower) || 
          clinic.city?.toLowerCase().includes(queryLower)) {
        matches = true;
        relevanceScore += 30;
      }

      if (matches) {
        results.push({
          type: 'clinic',
          id: clinic.id,
          title: clinic.clinic_name,
          subtitle: clinic.city,
          description: clinic.description || 'Medical Clinic',
          data: clinic,
          relevanceScore
        });
      }
    });

    return results;
  }

  // Search doctors
  private searchDoctors(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    this.doctors.forEach(doctor => {
      let relevanceScore = 0;
      let matches = false;

      // Find clinic for this doctor
      const clinic = this.clinics.find(c => c.id === doctor.clinic_id);

      if (doctor.full_name.toLowerCase().includes(queryLower)) {
        matches = true;
        relevanceScore += this.calculateRelevanceScore(
          query,
          doctor.full_name,
          doctor.specialization,
          clinic?.clinic_name
        );
      }

      if (doctor.specialization?.toLowerCase().includes(queryLower)) {
        matches = true;
        relevanceScore += this.calculateRelevanceScore(
          query,
          doctor.specialization,
          doctor.full_name,
          clinic?.clinic_name
        );
      }

      if (matches) {
        results.push({
          type: 'doctor',
          id: doctor.id,
          title: doctor.full_name,
          subtitle: doctor.specialization || 'Doctor',
          description: clinic?.clinic_name || 'Medical Clinic',
          clinicId: doctor.clinic_id,
          clinicName: clinic?.clinic_name,
          data: doctor,
          relevanceScore
        });
      }
    });

    return results;
  }

  // Search services
  private searchServices(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    const matchingServices = this.allServices.filter(service => 
      service.toLowerCase().includes(queryLower)
    );

    matchingServices.forEach(service => {
      // Find clinics that offer this service
      const offeringClinics = this.clinics.filter(clinic => {
        const clinicServices = [
          ...(clinic.services || []),
          ...(clinic.custom_services || []),
          ...(clinic.specialties || []),
          ...(clinic.custom_specialties || []),
          ...(clinic.services_with_pricing?.map((s: any) => s.service_name) || [])
        ];
        return clinicServices.some(clinicService => 
          clinicService.toLowerCase() === service.toLowerCase()
        );
      });

      const relevanceScore = this.calculateRelevanceScore(query, service, undefined, 
        `${offeringClinics.length} clinics available`);

      results.push({
        type: 'service',
        id: service,
        title: service,
        subtitle: `${offeringClinics.length} clinic${offeringClinics.length !== 1 ? 's' : ''} available`,
        description: offeringClinics.slice(0, 3).map(c => c.clinic_name).join(', ') + 
                     (offeringClinics.length > 3 ? ` and ${offeringClinics.length - 3} more` : ''),
        data: service,
        relevanceScore
      });
    });

    return results;
  }

  // Main search method
  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Ensure data is initialized
    await this.initialize();

    const queryLower = query.trim();
    if (queryLower.length < 2) return []; // Minimum 2 characters for search

    const allResults: SearchResult[] = [];

    // Search all types
    allResults.push(...this.searchClinics(queryLower));
    allResults.push(...this.searchDoctors(queryLower));
    allResults.push(...this.searchServices(queryLower));

    // Sort by relevance score (descending)
    allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Limit results to prevent overwhelming UI
    return allResults.slice(0, 8);
  }

  // Get popular services (for suggestions)
  getPopularServices(limit: number = 10): string[] {
    return this.allServices.slice(0, limit);
  }

  // Get all available services
  getAllServices(): string[] {
    return this.allServices;
  }

  // Get clinics by service
  getClinicsByService(serviceName: string): ClinicProfile[] {
    return this.clinics.filter(clinic => {
      const clinicServices = [
        ...(clinic.services || []),
        ...(clinic.custom_services || []),
        ...(clinic.specialties || []),
        ...(clinic.custom_specialties || []),
        ...(clinic.services_with_pricing?.map((s: any) => s.service_name) || [])
      ];
      return clinicServices.some(clinicService => 
        clinicService.toLowerCase() === serviceName.toLowerCase()
      );
    });
  }

  // Get doctors by clinic
  getDoctorsByClinic(clinicId: string): DoctorProfile[] {
    return this.doctors.filter(doctor => doctor.clinic_id === clinicId);
  }

  // Clear cache (for refreshing data)
  clearCache(): void {
    this.clinics = [];
    this.doctors = [];
    this.allServices = [];
    this.initialized = false;
  }
}

export const searchService = new SearchService();
