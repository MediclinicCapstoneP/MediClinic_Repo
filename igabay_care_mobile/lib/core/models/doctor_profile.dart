/// Doctor Profile Model
/// Represents a doctor's professional profile and information

import '../interfaces/clinical_service_interface.dart';

class DoctorProfile {
  final String id;
  final String userId;
  final String? clinicId;
  final String firstName;
  final String lastName;
  final String specialization;
  final String licenseNumber;
  final int yearsOfExperience;
  final List<String> education;
  final List<String> certifications;
  final double consultationFee;
  final List<String> languages;
  final String biography;
  final List<DoctorSchedule> schedule;
  final bool availability;
  final double rating;
  final int totalConsultations;
  final String? profilePictureUrl;
  final String? phoneNumber;
  final String? email;
  final DoctorStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const DoctorProfile({
    required this.id,
    required this.userId,
    this.clinicId,
    required this.firstName,
    required this.lastName,
    required this.specialization,
    required this.licenseNumber,
    required this.yearsOfExperience,
    this.education = const [],
    this.certifications = const [],
    required this.consultationFee,
    this.languages = const [],
    required this.biography,
    this.schedule = const [],
    this.availability = true,
    this.rating = 0.0,
    this.totalConsultations = 0,
    this.profilePictureUrl,
    this.phoneNumber,
    this.email,
    this.status = DoctorStatus.pending,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create from JSON
  factory DoctorProfile.fromJson(Map<String, dynamic> json) {
    return DoctorProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      clinicId: json['clinic_id'] as String?,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      specialization: json['specialization'] as String,
      licenseNumber: json['license_number'] as String,
      yearsOfExperience: json['years_of_experience'] as int,
      education:
          (json['education'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      certifications:
          (json['certifications'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      consultationFee: (json['consultation_fee'] as num).toDouble(),
      languages:
          (json['languages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      biography: json['biography'] as String? ?? '',
      schedule:
          (json['schedule'] as List<dynamic>?)
              ?.map((e) => DoctorSchedule.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      availability: json['availability'] as bool? ?? true,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      totalConsultations: json['total_consultations'] as int? ?? 0,
      profilePictureUrl: json['profile_picture_url'] as String?,
      phoneNumber: json['phone_number'] as String?,
      email: json['email'] as String?,
      status: DoctorStatus.fromString(json['status'] as String? ?? 'pending'),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'clinic_id': clinicId,
      'first_name': firstName,
      'last_name': lastName,
      'specialization': specialization,
      'license_number': licenseNumber,
      'years_of_experience': yearsOfExperience,
      'education': education,
      'certifications': certifications,
      'consultation_fee': consultationFee,
      'languages': languages,
      'biography': biography,
      'schedule': schedule.map((s) => s.toJson()).toList(),
      'availability': availability,
      'rating': rating,
      'total_consultations': totalConsultations,
      'profile_picture_url': profilePictureUrl,
      'phone_number': phoneNumber,
      'email': email,
      'status': status.value,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Copy with new values
  DoctorProfile copyWith({
    String? id,
    String? userId,
    String? clinicId,
    String? firstName,
    String? lastName,
    String? specialization,
    String? licenseNumber,
    int? yearsOfExperience,
    List<String>? education,
    List<String>? certifications,
    double? consultationFee,
    List<String>? languages,
    String? biography,
    List<DoctorSchedule>? schedule,
    bool? availability,
    double? rating,
    int? totalConsultations,
    String? profilePictureUrl,
    String? phoneNumber,
    String? email,
    DoctorStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return DoctorProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      clinicId: clinicId ?? this.clinicId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      specialization: specialization ?? this.specialization,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      yearsOfExperience: yearsOfExperience ?? this.yearsOfExperience,
      education: education ?? this.education,
      certifications: certifications ?? this.certifications,
      consultationFee: consultationFee ?? this.consultationFee,
      languages: languages ?? this.languages,
      biography: biography ?? this.biography,
      schedule: schedule ?? this.schedule,
      availability: availability ?? this.availability,
      rating: rating ?? this.rating,
      totalConsultations: totalConsultations ?? this.totalConsultations,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Helper methods
  String get fullName => '$firstName $lastName';
  String get displayName => 'Dr. $fullName';
  bool get isVerified => status == DoctorStatus.verified;
  bool get isAvailable => availability && isVerified;

  /// Get years of experience display
  String get experienceDisplay {
    if (yearsOfExperience == 1) {
      return '1 year of experience';
    }
    return '$yearsOfExperience years of experience';
  }

  /// Get education display
  String get educationDisplay {
    if (education.isEmpty) return 'Education not specified';
    return education.join(', ');
  }

  /// Get languages display
  String get languagesDisplay {
    if (languages.isEmpty) return 'Languages not specified';
    return languages.join(', ');
  }

  /// Get rating display
  String get ratingDisplay {
    if (totalConsultations == 0) return 'No reviews yet';
    return '${rating.toStringAsFixed(1)} ★ ($totalConsultations reviews)';
  }
}

/// Doctor status enum
enum DoctorStatus {
  pending('pending'),
  verified('verified'),
  suspended('suspended'),
  inactive('inactive');

  const DoctorStatus(this.value);
  final String value;

  static DoctorStatus fromString(String value) {
    return DoctorStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => DoctorStatus.pending,
    );
  }

  String get displayName {
    switch (this) {
      case DoctorStatus.pending:
        return 'Pending Verification';
      case DoctorStatus.verified:
        return 'Verified';
      case DoctorStatus.suspended:
        return 'Suspended';
      case DoctorStatus.inactive:
        return 'Inactive';
    }
  }
}

/// Doctor Schedule Model
/// Represents a doctor's weekly schedule
class DoctorSchedule {
  final int dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
  final String startTime; // Format: "HH:MM"
  final String endTime; // Format: "HH:MM"
  final bool isAvailable;
  final int maxAppointments;

  const DoctorSchedule({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.isAvailable = true,
    this.maxAppointments = 10,
  });

  /// Create from JSON
  factory DoctorSchedule.fromJson(Map<String, dynamic> json) {
    return DoctorSchedule(
      dayOfWeek: json['day_of_week'] as int,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      isAvailable: json['is_available'] as bool? ?? true,
      maxAppointments: json['max_appointments'] as int? ?? 10,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'day_of_week': dayOfWeek,
      'start_time': startTime,
      'end_time': endTime,
      'is_available': isAvailable,
      'max_appointments': maxAppointments,
    };
  }

  /// Copy with new values
  DoctorSchedule copyWith({
    int? dayOfWeek,
    String? startTime,
    String? endTime,
    bool? isAvailable,
    int? maxAppointments,
  }) {
    return DoctorSchedule(
      dayOfWeek: dayOfWeek ?? this.dayOfWeek,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      isAvailable: isAvailable ?? this.isAvailable,
      maxAppointments: maxAppointments ?? this.maxAppointments,
    );
  }

  /// Helper methods
  String get dayName {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayOfWeek % 7];
  }

  String get timeRange => '$startTime - $endTime';

  @override
  String toString() {
    return '$dayName: $timeRange (${isAvailable ? "Available" : "Unavailable"})';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is DoctorSchedule &&
        other.dayOfWeek == dayOfWeek &&
        other.startTime == startTime &&
        other.endTime == endTime &&
        other.isAvailable == isAvailable &&
        other.maxAppointments == maxAppointments;
  }

  @override
  int get hashCode {
    return Object.hash(
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
      maxAppointments,
    );
  }
}
