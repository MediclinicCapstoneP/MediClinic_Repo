/// Clinic Service Implementation
/// Handles clinic-specific operations and data management
///
/// This file provides clinic management services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:supabase_flutter/supabase_flutter.dart (replaced with DatabaseService)
///
/// The service relies on DatabaseService for database operations, maintaining
/// API compatibility for future migration back to real packages.

// Custom implementations to replace unavailable packages
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with DatabaseService
import '../models/clinic_profile.dart';
import '../interfaces/auth_service_interface.dart';
import '../interfaces/clinical_service_interface.dart' as clinical;
import 'database_service.dart';
import 'error_service.dart';

/// Clinic service for managing clinic operations
class ClinicService implements clinical.IClinicService {
  final DatabaseService _db = DatabaseService();
  final ErrorHandlingService _errorService = ErrorHandlingService();

  @override
  Future<ServiceResult<ClinicProfile>> getClinic(String clinicId) async {
    try {
      final result = await _db.selectSingle(
        'clinic_profiles',
        select: '''
          *,
          profiles!clinic_profiles_user_id_fkey(email)
        ''',
        filters: {'id': clinicId},
      );

      if (result.success && result.data != null) {
        final clinic = ClinicProfile.fromJson(result.data!);
        return ServiceResult.success(clinic);
      } else {
        return ServiceResult.failure('Clinic not found', 'CLINIC_NOT_FOUND');
      }
    } catch (e) {
      _errorService.logError(e, context: 'getClinic');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  @override
  Future<ServiceResult<ClinicProfile>> getClinicByUserId(String userId) async {
    try {
      final result = await _db.selectSingle(
        'clinic_profiles',
        select: '''
          *,
          profiles!clinic_profiles_user_id_fkey(email)
        ''',
        filters: {'user_id': userId},
      );

      if (result.success && result.data != null) {
        final clinic = ClinicProfile.fromJson(result.data!);
        return ServiceResult.success(clinic);
      } else {
        return ServiceResult.failure(
          'Clinic profile not found for user',
          'CLINIC_PROFILE_NOT_FOUND',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'getClinicByUserId');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  @override
  Future<ServiceResult<ClinicProfile>> createClinic(
    Map<String, dynamic> data,
  ) async {
    try {
      // Add timestamps
      data['created_at'] = DateTime.now().toIso8601String();
      data['updated_at'] = DateTime.now().toIso8601String();
      data['status'] = 'pending'; // Default status

      final result = await _db.insert('clinic_profiles', data);

      if (result.success && result.data != null) {
        final clinic = ClinicProfile.fromJson(result.data!);
        return ServiceResult.success(clinic);
      } else {
        return ServiceResult.failure(
          'Failed to create clinic profile',
          'CLINIC_CREATE_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'createClinic');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  @override
  Future<ServiceResult<ClinicProfile>> updateClinic(
    String clinicId,
    Map<String, dynamic> data,
  ) async {
    try {
      // Add update timestamp
      data['updated_at'] = DateTime.now().toIso8601String();

      final result = await _db.update('clinic_profiles', data, {
        'id': clinicId,
      });

      if (result.success && result.data != null) {
        final clinic = ClinicProfile.fromJson(result.data!);
        return ServiceResult.success(clinic);
      } else {
        return ServiceResult.failure(
          'Failed to update clinic profile',
          'CLINIC_UPDATE_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'updateClinic');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  @override
  Future<ServiceResult<void>> deleteClinic(String clinicId) async {
    try {
      final result = await _db.delete('clinic_profiles', {'id': clinicId});

      if (result.success) {
        return ServiceResult.success(null);
      } else {
        return ServiceResult.failure(
          'Failed to delete clinic profile',
          'CLINIC_DELETE_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'deleteClinic');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  @override
  Future<ServiceResult<List<ClinicProfile>>> searchClinics(
    clinical.ClinicSearchCriteria criteria,
  ) async {
    try {
      // Build query parameters
      final filters = <String, dynamic>{};

      if (criteria.verified != null) {
        filters['status'] = criteria.verified! ? 'approved' : 'pending';
      }

      String? orderBy;
      if (criteria.coordinates != null) {
        // TODO: Implement distance-based ordering using PostGIS
        // For now, just order by name
        orderBy = 'clinic_name';
      } else {
        orderBy = 'clinic_name';
      }

      var result = await _db.select(
        'clinic_profiles',
        select: '''
          *,
          profiles!clinic_profiles_user_id_fkey(email)
        ''',
        filters: filters.isNotEmpty ? filters : null,
        orderBy: orderBy,
        limit: 50, // Reasonable limit for search results
      );

      if (result.success && result.data != null) {
        var clinics = result.data!
            .map((json) => ClinicProfile.fromJson(json))
            .toList();

        // Apply additional filters
        if (criteria.name != null && criteria.name!.isNotEmpty) {
          final searchTerm = criteria.name!.toLowerCase();
          clinics = clinics
              .where(
                (clinic) =>
                    clinic.clinicName.toLowerCase().contains(searchTerm) ||
                    clinic.description?.toLowerCase().contains(searchTerm) ==
                        true,
              )
              .toList();
        }

        if (criteria.specialty != null && criteria.specialty!.isNotEmpty) {
          clinics = clinics
              .where(
                (clinic) => clinic.specialties.any(
                  (specialty) => specialty.toLowerCase().contains(
                    criteria.specialty!.toLowerCase(),
                  ),
                ),
              )
              .toList();
        }

        if (criteria.location != null && criteria.location!.isNotEmpty) {
          final location = criteria.location!.toLowerCase();
          clinics = clinics
              .where(
                (clinic) =>
                    clinic.city?.toLowerCase().contains(location) == true ||
                    clinic.state?.toLowerCase().contains(location) == true ||
                    clinic.address?.toLowerCase().contains(location) == true,
              )
              .toList();
        }

        // TODO: Implement distance filtering if coordinates are provided
        if (criteria.coordinates != null && criteria.radius != null) {
          // Filter by distance using Haversine formula or similar
          // This would require the latitude and longitude to be set in clinic profiles
        }

        return ServiceResult.success(clinics);
      } else {
        return ServiceResult.failure(
          'Failed to search clinics',
          'CLINIC_SEARCH_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'searchClinics');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  /// Get clinics by specialty
  Future<ServiceResult<List<ClinicProfile>>> getClinicsBySpecialty(
    String specialty,
  ) async {
    try {
      final result = await _db.rpc<List<dynamic>>(
        'search_clinics_by_specialty',
        params: {'specialty_name': specialty},
      );

      if (result.success && result.data != null) {
        final clinics = result.data!
            .map((json) => ClinicProfile.fromJson(json as Map<String, dynamic>))
            .toList();
        return ServiceResult.success(clinics);
      } else {
        return ServiceResult.failure(
          'Failed to get clinics by specialty',
          'SPECIALTY_SEARCH_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'getClinicsBySpecialty');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  /// Get nearby clinics (requires coordinates)
  Future<ServiceResult<List<ClinicProfile>>> getNearbyClinic(
    double latitude,
    double longitude,
    double radiusKm,
  ) async {
    try {
      final result = await _db.rpc<List<dynamic>>(
        'get_nearby_clinics',
        params: {
          'user_lat': latitude,
          'user_lng': longitude,
          'radius_km': radiusKm,
        },
      );

      if (result.success && result.data != null) {
        final clinics = result.data!
            .map((json) => ClinicProfile.fromJson(json as Map<String, dynamic>))
            .toList();
        return ServiceResult.success(clinics);
      } else {
        return ServiceResult.failure(
          'Failed to get nearby clinics',
          'NEARBY_SEARCH_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'getNearbyClinic');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  /// Get clinic statistics
  Future<ServiceResult<ClinicStatistics>> getClinicStatistics(
    String clinicId,
  ) async {
    try {
      final result = await _db.rpc<Map<String, dynamic>>(
        'get_clinic_statistics',
        params: {'clinic_id': clinicId},
      );

      if (result.success && result.data != null) {
        final stats = ClinicStatistics.fromJson(result.data!);
        return ServiceResult.success(stats);
      } else {
        return ServiceResult.failure(
          'Failed to get clinic statistics',
          'STATS_FETCH_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'getClinicStatistics');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }

  /// Update clinic status (for admin use)
  Future<ServiceResult<ClinicProfile>> updateClinicStatus(
    String clinicId,
    ClinicStatus status,
  ) async {
    try {
      final result = await _db.update(
        'clinic_profiles',
        {
          'status': status.toString(),
          'updated_at': DateTime.now().toIso8601String(),
        },
        {'id': clinicId},
      );

      if (result.success && result.data != null) {
        final clinic = ClinicProfile.fromJson(result.data!);
        return ServiceResult.success(clinic);
      } else {
        return ServiceResult.failure(
          'Failed to update clinic status',
          'STATUS_UPDATE_FAILED',
        );
      }
    } catch (e) {
      _errorService.logError(e, context: 'updateClinicStatus');
      return ServiceResult.failure(
        _errorService.getErrorMessage(e),
        _errorService.getErrorCode(e),
      );
    }
  }
}

/// Clinic statistics helper class
class ClinicStatistics {
  final int totalAppointments;
  final int completedAppointments;
  final int pendingAppointments;
  final int cancelledAppointments;
  final double averageRating;
  final int totalReviews;
  final int totalPatients;

  const ClinicStatistics({
    required this.totalAppointments,
    required this.completedAppointments,
    required this.pendingAppointments,
    required this.cancelledAppointments,
    required this.averageRating,
    required this.totalReviews,
    required this.totalPatients,
  });

  factory ClinicStatistics.fromJson(Map<String, dynamic> json) {
    return ClinicStatistics(
      totalAppointments: json['total_appointments'] as int? ?? 0,
      completedAppointments: json['completed_appointments'] as int? ?? 0,
      pendingAppointments: json['pending_appointments'] as int? ?? 0,
      cancelledAppointments: json['cancelled_appointments'] as int? ?? 0,
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0.0,
      totalReviews: json['total_reviews'] as int? ?? 0,
      totalPatients: json['total_patients'] as int? ?? 0,
    );
  }

  double get completionRate {
    if (totalAppointments == 0) return 0.0;
    return (completedAppointments / totalAppointments) * 100;
  }

  double get cancellationRate {
    if (totalAppointments == 0) return 0.0;
    return (cancelledAppointments / totalAppointments) * 100;
  }
}
