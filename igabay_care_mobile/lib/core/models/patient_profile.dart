class PatientProfile {
  final String id;
  final String userId;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final DateTime? dateOfBirth;
  final String? address;
  final String? emergencyContact;
  final String? bloodType;
  final String? allergies;
  final String? medications;
  final String? medicalConditions;
  final String? profilePictureUrl;
  final String? profilePicturePath;
  final DateTime createdAt;
  final DateTime updatedAt;

  PatientProfile({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.dateOfBirth,
    this.address,
    this.emergencyContact,
    this.bloodType,
    this.allergies,
    this.medications,
    this.medicalConditions,
    this.profilePictureUrl,
    this.profilePicturePath,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';

  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    final age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      return age - 1;
    }
    return age;
  }

  factory PatientProfile.fromJson(Map<String, dynamic> json) {
    return PatientProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      dateOfBirth: json['date_of_birth'] != null
          ? DateTime.parse(json['date_of_birth'] as String)
          : null,
      address: json['address'] as String?,
      emergencyContact: json['emergency_contact'] as String?,
      bloodType: json['blood_type'] as String?,
      allergies: json['allergies'] as String?,
      medications: json['medications'] as String?,
      medicalConditions: json['medical_conditions'] as String?,
      profilePictureUrl: json['profile_picture_url'] as String?,
      profilePicturePath: json['profile_picture_path'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'address': address,
      'emergency_contact': emergencyContact,
      'blood_type': bloodType,
      'allergies': allergies,
      'medications': medications,
      'medical_conditions': medicalConditions,
      'profile_picture_url': profilePictureUrl,
      'profile_picture_path': profilePicturePath,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  PatientProfile copyWith({
    String? id,
    String? userId,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    DateTime? dateOfBirth,
    String? address,
    String? emergencyContact,
    String? bloodType,
    String? allergies,
    String? medications,
    String? medicalConditions,
    String? profilePictureUrl,
    String? profilePicturePath,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PatientProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      address: address ?? this.address,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      bloodType: bloodType ?? this.bloodType,
      allergies: allergies ?? this.allergies,
      medications: medications ?? this.medications,
      medicalConditions: medicalConditions ?? this.medicalConditions,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      profilePicturePath: profilePicturePath ?? this.profilePicturePath,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
