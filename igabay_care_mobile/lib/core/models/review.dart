/// Review model class based on React TypeScript interfaces
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

  const Review({
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
  });

  /// Create from JSON
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
    );
  }

  /// Convert to JSON
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

  /// Copy with new values
  Review copyWith({
    String? id,
    String? patientId,
    String? appointmentId,
    String? clinicId,
    String? doctorId,
    double? overallRating,
    double? staffRating,
    double? cleanlinessRating,
    double? communicationRating,
    double? valueRating,
    String? reviewTitle,
    String? reviewText,
    bool? isAnonymous,
    bool? isVerified,
    bool? isPublished,
    int? helpfulVotes,
    int? totalVotes,
    String? clinicResponse,
    DateTime? clinicResponseDate,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Review(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      appointmentId: appointmentId ?? this.appointmentId,
      clinicId: clinicId ?? this.clinicId,
      doctorId: doctorId ?? this.doctorId,
      overallRating: overallRating ?? this.overallRating,
      staffRating: staffRating ?? this.staffRating,
      cleanlinessRating: cleanlinessRating ?? this.cleanlinessRating,
      communicationRating: communicationRating ?? this.communicationRating,
      valueRating: valueRating ?? this.valueRating,
      reviewTitle: reviewTitle ?? this.reviewTitle,
      reviewText: reviewText ?? this.reviewText,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      isVerified: isVerified ?? this.isVerified,
      isPublished: isPublished ?? this.isPublished,
      helpfulVotes: helpfulVotes ?? this.helpfulVotes,
      totalVotes: totalVotes ?? this.totalVotes,
      clinicResponse: clinicResponse ?? this.clinicResponse,
      clinicResponseDate: clinicResponseDate ?? this.clinicResponseDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get average of all sub-ratings
  double get averageSubRating {
    final ratings = [
      staffRating,
      cleanlinessRating,
      communicationRating,
      valueRating,
    ].where((rating) => rating != null).cast<double>();

    if (ratings.isEmpty) return overallRating;

    return ratings.reduce((a, b) => a + b) / ratings.length;
  }

  /// Check if review has sub-ratings
  bool get hasSubRatings {
    return staffRating != null ||
        cleanlinessRating != null ||
        communicationRating != null ||
        valueRating != null;
  }

  /// Get helpfulness percentage
  double get helpfulnessPercentage {
    if (totalVotes == 0) return 0.0;
    return (helpfulVotes / totalVotes) * 100;
  }

  /// Check if review is helpful
  bool get isHelpful => helpfulnessPercentage >= 50.0;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Review && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

/// Review with additional details
class ReviewWithDetails extends Review {
  final PatientInfo? patient;
  final ClinicInfo clinic;
  final DoctorInfo? doctor;
  final AppointmentInfo appointment;

  const ReviewWithDetails({
    required String id,
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
    bool isVerified = false,
    bool isPublished = true,
    int helpfulVotes = 0,
    int totalVotes = 0,
    String? clinicResponse,
    DateTime? clinicResponseDate,
    required DateTime createdAt,
    required DateTime updatedAt,
    this.patient,
    required this.clinic,
    this.doctor,
    required this.appointment,
  }) : super(
         id: id,
         patientId: patientId,
         appointmentId: appointmentId,
         clinicId: clinicId,
         doctorId: doctorId,
         overallRating: overallRating,
         staffRating: staffRating,
         cleanlinessRating: cleanlinessRating,
         communicationRating: communicationRating,
         valueRating: valueRating,
         reviewTitle: reviewTitle,
         reviewText: reviewText,
         isAnonymous: isAnonymous,
         isVerified: isVerified,
         isPublished: isPublished,
         helpfulVotes: helpfulVotes,
         totalVotes: totalVotes,
         clinicResponse: clinicResponse,
         clinicResponseDate: clinicResponseDate,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

  factory ReviewWithDetails.fromJson(Map<String, dynamic> json) {
    return ReviewWithDetails(
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
          ? PatientInfo.fromJson(json['patient'] as Map<String, dynamic>)
          : null,
      clinic: ClinicInfo.fromJson(json['clinic'] as Map<String, dynamic>),
      doctor: json['doctor'] != null
          ? DoctorInfo.fromJson(json['doctor'] as Map<String, dynamic>)
          : null,
      appointment: AppointmentInfo.fromJson(
        json['appointment'] as Map<String, dynamic>,
      ),
    );
  }
}

/// Patient info for reviews
class PatientInfo {
  final String firstName;
  final String lastName;

  const PatientInfo({required this.firstName, required this.lastName});

  factory PatientInfo.fromJson(Map<String, dynamic> json) {
    return PatientInfo(
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
    );
  }

  String get fullName => '$firstName $lastName';
}

/// Clinic info for reviews
class ClinicInfo {
  final String clinicName;

  const ClinicInfo({required this.clinicName});

  factory ClinicInfo.fromJson(Map<String, dynamic> json) {
    return ClinicInfo(clinicName: json['clinic_name'] as String);
  }
}

/// Doctor info for reviews
class DoctorInfo {
  final String firstName;
  final String lastName;
  final String specialization;

  const DoctorInfo({
    required this.firstName,
    required this.lastName,
    required this.specialization,
  });

  factory DoctorInfo.fromJson(Map<String, dynamic> json) {
    return DoctorInfo(
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      specialization: json['specialization'] as String,
    );
  }

  String get fullName => 'Dr. $firstName $lastName';
}

/// Appointment info for reviews
class AppointmentInfo {
  final DateTime appointmentDate;
  final String appointmentType;

  const AppointmentInfo({
    required this.appointmentDate,
    required this.appointmentType,
  });

  factory AppointmentInfo.fromJson(Map<String, dynamic> json) {
    return AppointmentInfo(
      appointmentDate: DateTime.parse(json['appointment_date'] as String),
      appointmentType: json['appointment_type'] as String,
    );
  }
}

/// Clinic rating summary
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

  const ClinicRating({
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
      totalReviews: json['total_reviews'] as int,
      averageRating: (json['average_rating'] as num).toDouble(),
      averageStaffRating: (json['average_staff_rating'] as num).toDouble(),
      averageCleanlinessRating: (json['average_cleanliness_rating'] as num)
          .toDouble(),
      averageCommunicationRating: (json['average_communication_rating'] as num)
          .toDouble(),
      averageValueRating: (json['average_value_rating'] as num).toDouble(),
      fiveStarCount: json['five_star_count'] as int,
      fourStarCount: json['four_star_count'] as int,
      threeStarCount: json['three_star_count'] as int,
      twoStarCount: json['two_star_count'] as int,
      oneStarCount: json['one_star_count'] as int,
      latestReviewDate: DateTime.parse(json['latest_review_date'] as String),
    );
  }

  /// Get rating distribution as percentages
  Map<int, double> get ratingDistributionPercentages {
    if (totalReviews == 0) {
      return {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    }

    return {
      5: (fiveStarCount / totalReviews) * 100,
      4: (fourStarCount / totalReviews) * 100,
      3: (threeStarCount / totalReviews) * 100,
      2: (twoStarCount / totalReviews) * 100,
      1: (oneStarCount / totalReviews) * 100,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ClinicRating && other.clinicId == clinicId;
  }

  @override
  int get hashCode => clinicId.hashCode;
}

/// Parameters for creating a review
class CreateReviewParams {
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

  const CreateReviewParams({
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
  });

  Map<String, dynamic> toJson() {
    return {
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
    };
  }
}

/// Parameters for updating a review
class UpdateReviewParams {
  final double? overallRating;
  final double? staffRating;
  final double? cleanlinessRating;
  final double? communicationRating;
  final double? valueRating;
  final String? reviewTitle;
  final String? reviewText;
  final bool? isAnonymous;

  const UpdateReviewParams({
    this.overallRating,
    this.staffRating,
    this.cleanlinessRating,
    this.communicationRating,
    this.valueRating,
    this.reviewTitle,
    this.reviewText,
    this.isAnonymous,
  });

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};

    if (overallRating != null) json['overall_rating'] = overallRating;
    if (staffRating != null) json['staff_rating'] = staffRating;
    if (cleanlinessRating != null)
      json['cleanliness_rating'] = cleanlinessRating;
    if (communicationRating != null)
      json['communication_rating'] = communicationRating;
    if (valueRating != null) json['value_rating'] = valueRating;
    if (reviewTitle != null) json['review_title'] = reviewTitle;
    if (reviewText != null) json['review_text'] = reviewText;
    if (isAnonymous != null) json['is_anonymous'] = isAnonymous;

    return json;
  }
}
