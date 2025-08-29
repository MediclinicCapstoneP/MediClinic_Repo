import 'patient_profile.dart';
import 'clinic_profile.dart';

class User {
  final String id;
  final String email;
  final UserRole role;
  final DateTime createdAt;
  final PatientProfile? patientProfile;
  final ClinicProfile? clinicProfile;

  User({
    required this.id,
    required this.email,
    required this.role,
    required this.createdAt,
    this.patientProfile,
    this.clinicProfile,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      role: UserRole.fromString(json['role'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      patientProfile: json['patient_profile'] != null
          ? PatientProfile.fromJson(json['patient_profile'])
          : null,
      clinicProfile: json['clinic_profile'] != null
          ? ClinicProfile.fromJson(json['clinic_profile'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role.toString(),
      'created_at': createdAt.toIso8601String(),
      if (patientProfile != null) 'patient_profile': patientProfile!.toJson(),
      if (clinicProfile != null) 'clinic_profile': clinicProfile!.toJson(),
    };
  }
}

enum UserRole {
  patient,
  clinic;

  static UserRole fromString(String role) {
    switch (role) {
      case 'patient':
        return UserRole.patient;
      case 'clinic':
        return UserRole.clinic;
      default:
        throw ArgumentError('Invalid user role: $role');
    }
  }

  @override
  String toString() {
    return name;
  }
}
