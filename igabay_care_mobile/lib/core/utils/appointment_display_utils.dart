import '../models/appointment.dart';
import '../models/patient_profile.dart';
import '../models/clinic_profile.dart';
import '../models/user.dart';

/// Display model for appointment information
class AppointmentDisplay {
  final String appointmentId;
  final String patientName;
  final String patientEmail;
  final String? patientPhone;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String appointmentType;
  final String status;
  final String? doctorName;
  final String clinicName;

  const AppointmentDisplay({
    required this.appointmentId,
    required this.patientName,
    required this.patientEmail,
    this.patientPhone,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.appointmentType,
    required this.status,
    this.doctorName,
    required this.clinicName,
  });

  /// Create from appointment and related data
  factory AppointmentDisplay.fromAppointment(
    Appointment appointment, {
    PatientProfile? patient,
    ClinicProfile? clinic,
  }) {
    final patientName = patient != null
        ? '${patient.firstName} ${patient.lastName}'
        : 'Unknown Patient';

    final patientEmail = patient?.email ?? 'No email';
    final clinicName = clinic?.clinicName ?? 'Unknown Clinic';

    return AppointmentDisplay(
      appointmentId: appointment.id,
      patientName: patientName,
      patientEmail: patientEmail,
      patientPhone: patient?.phone,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType.displayName,
      status: appointment.status.displayName,
      doctorName: appointment.doctorName,
      clinicName: clinicName,
    );
  }

  /// Get formatted date string
  String get formattedDate {
    return '${appointmentDate.day}/${appointmentDate.month}/${appointmentDate.year}';
  }

  /// Get formatted time string
  String get formattedTime {
    return appointmentTime;
  }

  /// Get formatted date and time
  String get formattedDateTime {
    return '$formattedDate at $formattedTime';
  }
}

/// Utility class for appointment display operations
class AppointmentDisplayUtils {
  /// Format patient name for display
  static String formatPatientName(String? firstName, String? lastName) {
    if (firstName == null && lastName == null) return 'Unknown Patient';
    if (firstName == null) return lastName ?? 'Unknown Patient';
    if (lastName == null) return firstName;
    return '$firstName $lastName';
  }

  /// Get appointment with patient name for display (simplified)
  static Future<AppointmentDisplay?> getAppointmentWithPatientName(
    String appointmentId,
  ) async {
    // This is a simplified version - implement with actual service calls
    print('Getting appointment details for: $appointmentId');

    // Return null for now - implement with actual service
    return null;
  }

  /// Get all appointments with patient names for a clinic (simplified)
  static Future<List<AppointmentDisplay>> getClinicAppointmentsWithPatientNames(
    String clinicId,
  ) async {
    print('Getting clinic appointments for: $clinicId');

    // Return empty list for now - implement with actual service
    return [];
  }

  /// Get patient appointments with names for a specific patient (simplified)
  static Future<List<AppointmentDisplay>> getPatientAppointmentsWithNames(
    String patientId,
  ) async {
    print('Getting patient appointments for: $patientId');

    // Return empty list for now - implement with actual service
    return [];
  }

  /// Get upcoming appointments for display (simplified)
  static Future<List<AppointmentDisplay>> getUpcomingAppointments(
    String userId,
    UserRole role,
  ) async {
    print('Getting upcoming appointments for user: $userId, role: $role');

    // Return empty list for now - implement with actual service
    return [];
  }

  /// Get today's appointments for display (simplified)
  static Future<List<AppointmentDisplay>> getTodaysAppointments(
    String userId,
    UserRole role,
  ) async {
    print('Getting today\'s appointments for user: $userId, role: $role');

    // Return empty list for now - implement with actual service
    return [];
  }

  /// Example usage for debugging a specific appointment
  static Future<AppointmentDisplay?> displaySpecificAppointment(
    String appointmentId,
  ) async {
    print('🔍 Fetching appointment details...');

    final appointmentDisplay = await getAppointmentWithPatientName(
      appointmentId,
    );

    if (appointmentDisplay != null) {
      print('✅ Appointment found:');
      print('📋 Patient Name: ${appointmentDisplay.patientName}');
      print('📧 Patient Email: ${appointmentDisplay.patientEmail}');
      print(
        '📞 Patient Phone: ${appointmentDisplay.patientPhone ?? 'Not provided'}',
      );
      print('📅 Date: ${appointmentDisplay.formattedDate}');
      print('⏰ Time: ${appointmentDisplay.formattedTime}');
      print('🩺 Type: ${appointmentDisplay.appointmentType}');
      print('📊 Status: ${appointmentDisplay.status}');
      print('👨‍⚕️ Doctor: ${appointmentDisplay.doctorName ?? 'Not assigned'}');
      print('🏥 Clinic: ${appointmentDisplay.clinicName}');
    } else {
      print('❌ Appointment not found or error occurred');
    }

    return appointmentDisplay;
  }

  /// Get appointment status color for UI
  static String getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'in_progress':
        return 'yellow';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      case 'no_show':
        return 'orange';
      case 'rescheduled':
        return 'purple';
      default:
        return 'gray';
    }
  }

  /// Get appointment priority color for UI
  static String getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'gray';
      case 'normal':
        return 'blue';
      case 'high':
        return 'orange';
      case 'urgent':
        return 'red';
      default:
        return 'blue';
    }
  }

  /// Get appointment summary text
  static String getAppointmentSummary(AppointmentDisplay appointment) {
    return '${appointment.patientName} - ${appointment.appointmentType} on ${appointment.formattedDate} at ${appointment.formattedTime}';
  }

  /// Filter appointments by status
  static List<AppointmentDisplay> filterByStatus(
    List<AppointmentDisplay> appointments,
    String status,
  ) {
    return appointments
        .where((apt) => apt.status.toLowerCase() == status.toLowerCase())
        .toList();
  }

  /// Filter appointments by type
  static List<AppointmentDisplay> filterByType(
    List<AppointmentDisplay> appointments,
    String type,
  ) {
    return appointments
        .where((apt) => apt.appointmentType.toLowerCase() == type.toLowerCase())
        .toList();
  }

  /// Search appointments by patient name
  static List<AppointmentDisplay> searchByPatientName(
    List<AppointmentDisplay> appointments,
    String query,
  ) {
    final lowerQuery = query.toLowerCase();
    return appointments
        .where((apt) => apt.patientName.toLowerCase().contains(lowerQuery))
        .toList();
  }
}
