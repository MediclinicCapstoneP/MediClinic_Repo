/// Abstract interfaces for clinical services following SOLID principles
/// Interface Segregation Principle: Specific interfaces for clinical operations

import '../models/clinic_profile.dart';
import '../models/patient_profile.dart';
import '../models/doctor_profile.dart';
import 'auth_service_interface.dart';

/// Operating hours interface
class OperatingHours {
  final DaySchedule monday;
  final DaySchedule tuesday;
  final DaySchedule wednesday;
  final DaySchedule thursday;
  final DaySchedule friday;
  final DaySchedule saturday;
  final DaySchedule sunday;

  const OperatingHours({
    required this.monday,
    required this.tuesday,
    required this.wednesday,
    required this.thursday,
    required this.friday,
    required this.saturday,
    required this.sunday,
  });
}

class DaySchedule {
  final String open;
  final String close;
  final bool isOpen;

  const DaySchedule({
    required this.open,
    required this.close,
    required this.isOpen,
  });
}

/// Clinical service interfaces
abstract class IClinicService {
  Future<ServiceResult<ClinicProfile>> getClinic(String clinicId);
  Future<ServiceResult<ClinicProfile>> getClinicByUserId(String userId);
  Future<ServiceResult<ClinicProfile>> createClinic(Map<String, dynamic> data);
  Future<ServiceResult<ClinicProfile>> updateClinic(
    String clinicId,
    Map<String, dynamic> data,
  );
  Future<ServiceResult<void>> deleteClinic(String clinicId);
  Future<ServiceResult<List<ClinicProfile>>> searchClinics(
    ClinicSearchCriteria criteria,
  );
}

abstract class IDoctorService {
  Future<ServiceResult<DoctorProfile>> getDoctor(String doctorId);
  Future<ServiceResult<DoctorProfile>> getDoctorByUserId(String userId);
  Future<ServiceResult<List<DoctorProfile>>> getDoctorsByClinic(
    String clinicId,
  );
  Future<ServiceResult<DoctorProfile>> createDoctor(Map<String, dynamic> data);
  Future<ServiceResult<DoctorProfile>> updateDoctor(
    String doctorId,
    Map<String, dynamic> data,
  );
  Future<ServiceResult<void>> deleteDoctor(String doctorId);
  Future<ServiceResult<List<DoctorProfile>>> searchDoctors(
    DoctorSearchCriteria criteria,
  );
}

abstract class IPatientService {
  Future<ServiceResult<PatientProfile>> getPatient(String patientId);
  Future<ServiceResult<PatientProfile>> getPatientByUserId(String userId);
  Future<ServiceResult<PatientProfile>> createPatient(
    Map<String, dynamic> data,
  );
  Future<ServiceResult<PatientProfile>> updatePatient(
    String patientId,
    Map<String, dynamic> data,
  );
  Future<ServiceResult<void>> deletePatient(String patientId);
}

/// Search criteria interfaces
class ClinicSearchCriteria {
  final String? location;
  final String? specialty;
  final String? name;
  final double? radius;
  final Coordinates? coordinates;
  final bool? verified;
  final bool? hasAvailableSlots;

  const ClinicSearchCriteria({
    this.location,
    this.specialty,
    this.name,
    this.radius,
    this.coordinates,
    this.verified,
    this.hasAvailableSlots,
  });
}

class DoctorSearchCriteria {
  final String? specialization;
  final String? clinicId;
  final bool? availability;
  final double? rating;
  final int? experience;
  final String? language;

  const DoctorSearchCriteria({
    this.specialization,
    this.clinicId,
    this.availability,
    this.rating,
    this.experience,
    this.language,
  });
}

class Coordinates {
  final double lat;
  final double lng;

  const Coordinates({required this.lat, required this.lng});
}

/// Specialty management interface
abstract class ISpecialtyService {
  Future<ServiceResult<List<String>>> getStandardSpecialties();
  Future<ServiceResult<List<String>>> getClinicSpecialties(String clinicId);
  Future<ServiceResult<void>> addSpecialtyToClinic(
    String clinicId,
    String specialty,
    bool isCustom,
  );
  Future<ServiceResult<void>> removeSpecialtyFromClinic(
    String clinicId,
    String specialty,
  );
  Future<ServiceResult<void>> replaceClinicSpecialties(
    String clinicId,
    List<String> standardSpecialties,
    List<String> customSpecialties,
  );
}

/// Verification service interface
abstract class IVerificationService {
  Future<ServiceResult<void>> verifyClinic(String clinicId);
  Future<ServiceResult<void>> verifyDoctor(String doctorId);
  Future<ServiceResult<String>> getVerificationStatus(
    String entityType,
    String entityId,
  );
  Future<ServiceResult<void>> requestVerification(
    String entityType,
    String entityId,
    List<String> documents,
  );
}

/// Clinic profile status enum
enum ClinicStatus {
  pending('pending'),
  approved('approved'),
  rejected('rejected');

  const ClinicStatus(this.value);
  final String value;

  static ClinicStatus fromString(String value) {
    return ClinicStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ClinicStatus.pending,
    );
  }
}
