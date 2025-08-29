/// Review Service Implementation
///
/// This file provides review services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:supabase_flutter/supabase_flutter.dart (replaced with MockSupabase classes)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with MockSupabase

import '../models/patient_profile.dart';
import '../models/clinic_profile.dart';
import '../models/appointment.dart';

/// Mock Postgrest Query Builder for reviews
class MockReviewQueryBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  final List<String> _selectColumns = [];
  String? _orderColumn;
  bool _ascending = true;
  int? _limitValue;
  int? _rangeStart;
  int? _rangeEnd;
  String? _orCondition;
  String? _gteColumn;
  dynamic _gteValue;

  MockReviewQueryBuilder(this.tableName);

  MockReviewQueryBuilder select([String? columns]) {
    if (columns != null) {
      _selectColumns.clear();
      _selectColumns.addAll(columns.split(',').map((c) => c.trim()));
    }
    return this;
  }

  MockReviewQueryBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockReviewQueryBuilder gte(String column, dynamic value) {
    _gteColumn = column;
    _gteValue = value;
    return this;
  }

  MockReviewQueryBuilder or(String condition) {
    _orCondition = condition;
    return this;
  }

  MockReviewQueryBuilder order(String column, {bool ascending = true}) {
    _orderColumn = column;
    _ascending = ascending;
    return this;
  }

  MockReviewQueryBuilder limit(int count) {
    _limitValue = count;
    return this;
  }

  MockReviewQueryBuilder range(int start, int end) {
    _rangeStart = start;
    _rangeEnd = end;
    return this;
  }

  Future<List<Map<String, dynamic>>> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockReviews] Query on $tableName with filters: $_filters');

    // Generate mock review data
    final mockData = _generateMockReviews();

    // Apply filters
    var filteredData = mockData.where((item) {
      return _filters.entries.every((filter) {
        return item[filter.key] == filter.value;
      });
    }).toList();

    // Apply gte filter
    if (_gteColumn != null && _gteValue != null) {
      filteredData = filteredData.where((item) {
        final value = item[_gteColumn!];
        if (value is num && _gteValue is num) {
          return value >= _gteValue;
        }
        return true;
      }).toList();
    }

    // Apply ordering
    if (_orderColumn != null) {
      filteredData.sort((a, b) {
        final valueA = a[_orderColumn!];
        final valueB = b[_orderColumn!];
        final comparison = valueA.toString().compareTo(valueB.toString());
        return _ascending ? comparison : -comparison;
      });
    }

    // Apply range/limit
    if (_rangeStart != null && _rangeEnd != null) {
      final start = _rangeStart!;
      final end = (_rangeEnd! + 1).clamp(0, filteredData.length);
      filteredData = filteredData.sublist(
        start.clamp(0, filteredData.length),
        end,
      );
    } else if (_limitValue != null) {
      filteredData = filteredData.take(_limitValue!).toList();
    }

    return filteredData;
  }

  Future<Map<String, dynamic>?> maybeSingle() async {
    final results = await call();
    return results.isNotEmpty ? results.first : null;
  }

  Future<Map<String, dynamic>> single() async {
    final results = await call();
    if (results.isEmpty) {
      throw Exception('No results found');
    }
    return results.first;
  }

  List<Map<String, dynamic>> _generateMockReviews() {
    final now = DateTime.now();

    return [
      {
        'id': 'review-1',
        'patient_id': 'patient-1',
        'appointment_id': 'appointment-1',
        'clinic_id': 'clinic-1',
        'doctor_id': 'doctor-1',
        'overall_rating': 4.5,
        'staff_rating': 4.0,
        'cleanliness_rating': 5.0,
        'communication_rating': 4.5,
        'value_rating': 4.0,
        'review_title': 'Great experience',
        'review_text':
            'The staff was very professional and the clinic was clean.',
        'is_anonymous': false,
        'is_verified': true,
        'is_published': true,
        'helpful_votes': 5,
        'total_votes': 6,
        'clinic_response': null,
        'clinic_response_date': null,
        'created_at': now.subtract(const Duration(days: 7)).toIso8601String(),
        'updated_at': now.subtract(const Duration(days: 7)).toIso8601String(),
        'patient': {'first_name': 'John', 'last_name': 'Doe'},
        'clinic': {'clinic_name': 'City Medical Center'},
        'appointment': {
          'appointment_date': now
              .subtract(const Duration(days: 10))
              .toIso8601String(),
          'appointment_type': 'General Consultation',
        },
      },
      {
        'id': 'review-2',
        'patient_id': 'patient-2',
        'appointment_id': 'appointment-2',
        'clinic_id': 'clinic-1',
        'doctor_id': 'doctor-2',
        'overall_rating': 3.5,
        'staff_rating': 3.0,
        'cleanliness_rating': 4.0,
        'communication_rating': 3.5,
        'value_rating': 3.5,
        'review_title': 'Average service',
        'review_text': 'Service was okay but could be better.',
        'is_anonymous': true,
        'is_verified': true,
        'is_published': true,
        'helpful_votes': 2,
        'total_votes': 4,
        'clinic_response':
            'Thank you for your feedback. We will work to improve our service.',
        'clinic_response_date': now
            .subtract(const Duration(days: 2))
            .toIso8601String(),
        'created_at': now.subtract(const Duration(days: 3)).toIso8601String(),
        'updated_at': now.subtract(const Duration(days: 3)).toIso8601String(),
        'patient': {'first_name': 'Anonymous', 'last_name': 'User'},
        'clinic': {'clinic_name': 'City Medical Center'},
        'appointment': {
          'appointment_date': now
              .subtract(const Duration(days: 5))
              .toIso8601String(),
          'appointment_type': 'Follow-up',
        },
      },
    ];
  }
}

/// Mock Postgrest Insert Builder
class MockReviewInsertBuilder {
  final String tableName;
  final dynamic insertData;

  MockReviewInsertBuilder(this.tableName, this.insertData);

  MockReviewQueryBuilder select([String? columns]) {
    return MockReviewQueryBuilder(tableName);
  }

  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockReviews] INSERT into $tableName: $insertData');

    // Return inserted data with generated ID
    final result = Map<String, dynamic>.from(
      insertData as Map<String, dynamic>,
    );
    result['id'] = 'review-${DateTime.now().millisecondsSinceEpoch}';
    result['created_at'] = DateTime.now().toIso8601String();
    result['updated_at'] = DateTime.now().toIso8601String();

    return result;
  }
}

/// Mock Postgrest Update Builder
class MockReviewUpdateBuilder {
  final String tableName;
  final Map<String, dynamic> updateData;
  final Map<String, dynamic> _filters = {};

  MockReviewUpdateBuilder(this.tableName, this.updateData);

  MockReviewUpdateBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockReviewQueryBuilder select([String? columns]) {
    return MockReviewQueryBuilder(tableName);
  }

  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print(
      '[MockReviews] UPDATE $tableName with filters $_filters: $updateData',
    );

    // Return updated data
    final result = Map<String, dynamic>.from(updateData);
    result['id'] = _filters['id'] ?? 'review-updated';
    result['updated_at'] = DateTime.now().toIso8601String();

    return result;
  }
}

/// Mock Postgrest Delete Builder
class MockReviewDeleteBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};

  MockReviewDeleteBuilder(this.tableName);

  MockReviewDeleteBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockReviews] DELETE from $tableName with filters: $_filters');
  }
}

/// Mock RPC Builder
class MockRpcBuilder {
  final String functionName;
  final Map<String, dynamic> params;

  MockRpcBuilder(this.functionName, this.params);

  Future<dynamic> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockReviews] RPC call $functionName with params: $params');

    // Mock specific RPC responses
    if (functionName == 'vote_on_review') {
      return {'success': true};
    }

    return null;
  }
}

/// Mock Supabase Client for reviews
class SupabaseClient {
  MockReviewQueryBuilder from(String table) {
    return MockReviewQueryBuilder(table);
  }

  MockReviewInsertBuilder insert(String table, dynamic data) {
    return MockReviewInsertBuilder(table, data);
  }

  MockReviewUpdateBuilder update(String table, Map<String, dynamic> data) {
    return MockReviewUpdateBuilder(table, data);
  }

  MockReviewDeleteBuilder delete(String table) {
    return MockReviewDeleteBuilder(table);
  }

  MockRpcBuilder rpc(String functionName, {Map<String, dynamic>? params}) {
    return MockRpcBuilder(functionName, params ?? {});
  }
}

/// Mock Supabase singleton
class Supabase {
  static final Supabase _instance = Supabase._internal();
  static Supabase get instance => _instance;

  Supabase._internal();

  final SupabaseClient _client = SupabaseClient();
  SupabaseClient get client => _client;
}

// Review models
class Review {
  final String id;
  final String patientId;
  final String appointmentId;
  final String clinicId;
  final String? doctorId;
  final double overallRating;
  final double? staffRating;
  final double? cleanlinessRating;
  final double? communicationRating;
  final double? valueRating;
  final String? reviewTitle;
  final String? reviewText;
  final bool isAnonymous;
  final bool isVerified;
  final bool isPublished;
  final int helpfulVotes;
  final int totalVotes;
  final String? clinicResponse;
  final DateTime? clinicResponseDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Optional related data
  final PatientProfile? patient;
  final ClinicProfile? clinic;
  final Map<String, dynamic>? doctor;
  final Appointment? appointment;

  Review({
    required this.id,
    required this.patientId,
    required this.appointmentId,
    required this.clinicId,
    this.doctorId,
    required this.overallRating,
    this.staffRating,
    this.cleanlinessRating,
    this.communicationRating,
    this.valueRating,
    this.reviewTitle,
    this.reviewText,
    this.isAnonymous = false,
    this.isVerified = false,
    this.isPublished = true,
    this.helpfulVotes = 0,
    this.totalVotes = 0,
    this.clinicResponse,
    this.clinicResponseDate,
    required this.createdAt,
    required this.updatedAt,
    this.patient,
    this.clinic,
    this.doctor,
    this.appointment,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      patientId: json['patient_id'] as String,
      appointmentId: json['appointment_id'] as String,
      clinicId: json['clinic_id'] as String,
      doctorId: json['doctor_id'] as String?,
      overallRating: (json['overall_rating'] as num).toDouble(),
      staffRating: json['staff_rating'] != null
          ? (json['staff_rating'] as num).toDouble()
          : null,
      cleanlinessRating: json['cleanliness_rating'] != null
          ? (json['cleanliness_rating'] as num).toDouble()
          : null,
      communicationRating: json['communication_rating'] != null
          ? (json['communication_rating'] as num).toDouble()
          : null,
      valueRating: json['value_rating'] != null
          ? (json['value_rating'] as num).toDouble()
          : null,
      reviewTitle: json['review_title'] as String?,
      reviewText: json['review_text'] as String?,
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      isVerified: json['is_verified'] as bool? ?? false,
      isPublished: json['is_published'] as bool? ?? true,
      helpfulVotes: json['helpful_votes'] as int? ?? 0,
      totalVotes: json['total_votes'] as int? ?? 0,
      clinicResponse: json['clinic_response'] as String?,
      clinicResponseDate: json['clinic_response_date'] != null
          ? DateTime.parse(json['clinic_response_date'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      patient: json['patient'] != null
          ? PatientProfile.fromJson(json['patient'])
          : null,
      clinic: json['clinic'] != null
          ? ClinicProfile.fromJson(json['clinic'])
          : null,
      doctor: json['doctor'] as Map<String, dynamic>?,
      appointment: json['appointment'] != null
          ? Appointment.fromJson(json['appointment'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'appointment_id': appointmentId,
      'clinic_id': clinicId,
      'doctor_id': doctorId,
      'overall_rating': overallRating,
      'staff_rating': staffRating,
      'cleanliness_rating': cleanlinessRating,
      'communication_rating': communicationRating,
      'value_rating': valueRating,
      'review_title': reviewTitle,
      'review_text': reviewText,
      'is_anonymous': isAnonymous,
      'is_verified': isVerified,
      'is_published': isPublished,
      'helpful_votes': helpfulVotes,
      'total_votes': totalVotes,
      'clinic_response': clinicResponse,
      'clinic_response_date': clinicResponseDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class ClinicRating {
  final String clinicId;
  final String clinicName;
  final int totalReviews;
  final double averageRating;
  final double averageStaffRating;
  final double averageCleanlinessRating;
  final double averageCommunicationRating;
  final double averageValueRating;
  final int fiveStarCount;
  final int fourStarCount;
  final int threeStarCount;
  final int twoStarCount;
  final int oneStarCount;
  final DateTime latestReviewDate;

  ClinicRating({
    required this.clinicId,
    required this.clinicName,
    required this.totalReviews,
    required this.averageRating,
    required this.averageStaffRating,
    required this.averageCleanlinessRating,
    required this.averageCommunicationRating,
    required this.averageValueRating,
    required this.fiveStarCount,
    required this.fourStarCount,
    required this.threeStarCount,
    required this.twoStarCount,
    required this.oneStarCount,
    required this.latestReviewDate,
  });

  factory ClinicRating.fromJson(Map<String, dynamic> json) {
    return ClinicRating(
      clinicId: json['clinic_id'] as String,
      clinicName: json['clinic_name'] as String,
      totalReviews: json['total_reviews'] as int? ?? 0,
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0.0,
      averageStaffRating:
          (json['average_staff_rating'] as num?)?.toDouble() ?? 0.0,
      averageCleanlinessRating:
          (json['average_cleanliness_rating'] as num?)?.toDouble() ?? 0.0,
      averageCommunicationRating:
          (json['average_communication_rating'] as num?)?.toDouble() ?? 0.0,
      averageValueRating:
          (json['average_value_rating'] as num?)?.toDouble() ?? 0.0,
      fiveStarCount: json['five_star_count'] as int? ?? 0,
      fourStarCount: json['four_star_count'] as int? ?? 0,
      threeStarCount: json['three_star_count'] as int? ?? 0,
      twoStarCount: json['two_star_count'] as int? ?? 0,
      oneStarCount: json['one_star_count'] as int? ?? 0,
      latestReviewDate: DateTime.parse(json['latest_review_date'] as String),
    );
  }
}

// Review service
class ReviewService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Create a new review for an appointment
  Future<Review> createReview({
    required String patientId,
    required String appointmentId,
    required String clinicId,
    String? doctorId,
    required double overallRating,
    double? staffRating,
    double? cleanlinessRating,
    double? communicationRating,
    double? valueRating,
    String? reviewTitle,
    String? reviewText,
    bool isAnonymous = false,
  }) async {
    // Validate rating values
    _validateRating(overallRating, 'Overall rating');
    if (staffRating != null) _validateRating(staffRating, 'Staff rating');
    if (cleanlinessRating != null)
      _validateRating(cleanlinessRating, 'Cleanliness rating');
    if (communicationRating != null)
      _validateRating(communicationRating, 'Communication rating');
    if (valueRating != null) _validateRating(valueRating, 'Value rating');

    try {
      // Check if review already exists for this appointment
      final existingReview = await _supabase
          .from('reviews')
          .select('id')
          .eq('appointment_id', appointmentId)
          .eq('patient_id', patientId)
          .maybeSingle();

      if (existingReview != null) {
        throw Exception('A review already exists for this appointment');
      }

      final data = {
        'patient_id': patientId,
        'appointment_id': appointmentId,
        'clinic_id': clinicId,
        'doctor_id': doctorId,
        'overall_rating': overallRating,
        'staff_rating': staffRating,
        'cleanliness_rating': cleanlinessRating,
        'communication_rating': communicationRating,
        'value_rating': valueRating,
        'review_title': reviewTitle,
        'review_text': reviewText,
        'is_anonymous': isAnonymous,
        'is_verified': true, // Always verified since tied to actual appointment
        'is_published': true,
      };

      final response = await _supabase
          .insert('reviews', data)
          .select()
          .single();

      return Review.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create review: ${e.toString()}');
    }
  }

  /// Update an existing review
  Future<Review> updateReview(
    String reviewId, {
    double? overallRating,
    double? staffRating,
    double? cleanlinessRating,
    double? communicationRating,
    double? valueRating,
    String? reviewTitle,
    String? reviewText,
    bool? isAnonymous,
  }) async {
    // Validate rating values
    if (overallRating != null) _validateRating(overallRating, 'Overall rating');
    if (staffRating != null) _validateRating(staffRating, 'Staff rating');
    if (cleanlinessRating != null)
      _validateRating(cleanlinessRating, 'Cleanliness rating');
    if (communicationRating != null)
      _validateRating(communicationRating, 'Communication rating');
    if (valueRating != null) _validateRating(valueRating, 'Value rating');

    try {
      final data = <String, dynamic>{};
      if (overallRating != null) data['overall_rating'] = overallRating;
      if (staffRating != null) data['staff_rating'] = staffRating;
      if (cleanlinessRating != null)
        data['cleanliness_rating'] = cleanlinessRating;
      if (communicationRating != null)
        data['communication_rating'] = communicationRating;
      if (valueRating != null) data['value_rating'] = valueRating;
      if (reviewTitle != null) data['review_title'] = reviewTitle;
      if (reviewText != null) data['review_text'] = reviewText;
      if (isAnonymous != null) data['is_anonymous'] = isAnonymous;

      final response = await _supabase
          .update('reviews', data)
          .eq('id', reviewId)
          .select()
          .single();

      return Review.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update review: ${e.toString()}');
    }
  }

  /// Get review by appointment ID
  Future<Review?> getReviewByAppointment(
    String appointmentId,
    String patientId,
  ) async {
    try {
      final response = await _supabase
          .from('reviews')
          .select('*')
          .eq('appointment_id', appointmentId)
          .eq('patient_id', patientId)
          .maybeSingle();

      if (response == null) return null;
      return Review.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch review: ${e.toString()}');
    }
  }

  /// Get reviews for a clinic with pagination
  Future<List<Review>> getClinicReviews(
    String clinicId, {
    int? limit,
    int? offset,
    double? minRating,
    bool includeDetails = false,
  }) async {
    try {
      var query = _supabase
          .from('reviews')
          .select(
            includeDetails
                ? '''
            *,
            patient:patients(first_name, last_name),
            clinic:clinics(clinic_name),
            appointment:appointments(appointment_date, appointment_type)
          '''
                : '*',
          )
          .eq('clinic_id', clinicId)
          .eq('is_published', true)
          .order('created_at', ascending: false);

      if (minRating != null) {
        query = query.gte('overall_rating', minRating);
      }

      if (limit != null) {
        query = query.limit(limit);
      }

      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }

      final response = await query.call();
      return response.map((data) => Review.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch clinic reviews: ${e.toString()}');
    }
  }

  /// Get reviews by a specific patient
  Future<List<Review>> getPatientReviews(
    String patientId, {
    int? limit,
    int? offset,
    bool includeDetails = false,
  }) async {
    try {
      var query = _supabase
          .from('reviews')
          .select(
            includeDetails
                ? '''
            *,
            clinic:clinics(clinic_name),
            appointment:appointments(appointment_date, appointment_type)
          '''
                : '*',
          )
          .eq('patient_id', patientId)
          .order('created_at', ascending: false);

      if (limit != null) {
        query = query.limit(limit);
      }

      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }

      final response = await query.call();
      return response.map((data) => Review.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch patient reviews: ${e.toString()}');
    }
  }

  /// Get clinic rating summary
  Future<ClinicRating> getClinicRating(String clinicId) async {
    try {
      final response = await _supabase
          .from('clinic_ratings')
          .select('*')
          .eq('clinic_id', clinicId)
          .maybeSingle();

      if (response != null) {
        return ClinicRating.fromJson(response);
      }

      // If no ratings found, return default
      final clinic = await _supabase
          .from('clinics')
          .select('clinic_name')
          .eq('id', clinicId)
          .single();

      return ClinicRating(
        clinicId: clinicId,
        clinicName: clinic['clinic_name'] as String? ?? 'Unknown Clinic',
        totalReviews: 0,
        averageRating: 0.0,
        averageStaffRating: 0.0,
        averageCleanlinessRating: 0.0,
        averageCommunicationRating: 0.0,
        averageValueRating: 0.0,
        fiveStarCount: 0,
        fourStarCount: 0,
        threeStarCount: 0,
        twoStarCount: 0,
        oneStarCount: 0,
        latestReviewDate: DateTime.now(),
      );
    } catch (e) {
      throw Exception('Failed to fetch clinic rating: ${e.toString()}');
    }
  }

  /// Delete a review
  Future<void> deleteReview(String reviewId) async {
    try {
      await _supabase.delete('reviews').eq('id', reviewId).call();
    } catch (e) {
      throw Exception('Failed to delete review: ${e.toString()}');
    }
  }

  /// Check if patient can review an appointment
  Future<Map<String, dynamic>> canReviewAppointment(
    String appointmentId,
    String patientId,
  ) async {
    try {
      // Check if appointment exists and is completed
      final appointment = await _supabase
          .from('appointments')
          .select('status, patient_id')
          .eq('id', appointmentId)
          .maybeSingle();

      if (appointment == null) {
        return {'canReview': false, 'reason': 'Appointment not found'};
      }

      if (appointment['patient_id'] != patientId) {
        return {
          'canReview': false,
          'reason': 'You can only review your own appointments',
        };
      }

      if (appointment['status'] != 'completed') {
        return {
          'canReview': false,
          'reason': 'You can only review completed appointments',
        };
      }

      // Check if review already exists
      final existingReview = await _supabase
          .from('reviews')
          .select('id')
          .eq('appointment_id', appointmentId)
          .eq('patient_id', patientId)
          .maybeSingle();

      if (existingReview != null) {
        return {
          'canReview': false,
          'reason': 'You have already reviewed this appointment',
        };
      }

      return {'canReview': true};
    } catch (e) {
      return {
        'canReview': false,
        'error': 'Failed to check review eligibility: ${e.toString()}',
      };
    }
  }

  /// Vote on review helpfulness
  Future<void> voteOnReview(String reviewId, bool isHelpful) async {
    try {
      // This is a simplified version - in a real app, you'd track who voted
      final increment = isHelpful ? 1 : 0;

      await _supabase
          .rpc(
            'vote_on_review',
            params: {'review_id': reviewId, 'is_helpful': increment},
          )
          .call();
    } catch (e) {
      throw Exception('Failed to vote on review: ${e.toString()}');
    }
  }

  /// Get recent reviews across all clinics
  Future<List<Review>> getRecentReviews({int limit = 10}) async {
    try {
      final response = await _supabase
          .from('reviews')
          .select('''
            *,
            patient:patients(first_name, last_name),
            clinic:clinics(clinic_name),
            appointment:appointments(appointment_date, appointment_type)
          ''')
          .eq('is_published', true)
          .order('created_at', ascending: false)
          .limit(limit);

      final responseData = await response.call();
      return responseData.map((data) => Review.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch recent reviews: ${e.toString()}');
    }
  }

  /// Search reviews by text
  Future<List<Review>> searchReviews(
    String query, {
    String? clinicId,
    double? minRating,
    int? limit,
  }) async {
    try {
      var supabaseQuery = _supabase
          .from('reviews')
          .select('''
            *,
            patient:patients(first_name, last_name),
            clinic:clinics(clinic_name),
            appointment:appointments(appointment_date, appointment_type)
          ''')
          .eq('is_published', true)
          .or('review_title.ilike.%$query%,review_text.ilike.%$query%')
          .order('created_at', ascending: false);

      if (clinicId != null) {
        supabaseQuery = supabaseQuery.eq('clinic_id', clinicId);
      }

      if (minRating != null) {
        supabaseQuery = supabaseQuery.gte('overall_rating', minRating);
      }

      if (limit != null) {
        supabaseQuery = supabaseQuery.limit(limit);
      }

      final responseData = await supabaseQuery.call();
      return responseData.map((data) => Review.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to search reviews: ${e.toString()}');
    }
  }

  /// Validate rating value
  void _validateRating(double rating, String name) {
    if (rating < 1 || rating > 5) {
      throw ArgumentError('$name must be between 1 and 5');
    }
  }
}
