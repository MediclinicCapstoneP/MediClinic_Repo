import 'patient_profile.dart';
import 'clinic_profile.dart';

class Appointment {
  final String id;
  final String patientId;
  final String clinicId;
  final String? doctorId;
  final String? doctorName;
  final String? doctorSpecialty;
  final DateTime appointmentDate;
  final String appointmentTime; // HH:MM:SS format
  final int durationMinutes;
  final AppointmentType appointmentType;
  final AppointmentStatus status;
  final AppointmentPriority priority;
  final String? roomNumber;
  final String? floorNumber;
  final String? building;
  final String? patientNotes;
  final String? doctorNotes;
  final String? adminNotes;
  final String? insuranceProvider;
  final String? insurancePolicyNumber;
  final double? copayAmount;
  final double? totalCost;
  final bool reminderSent;
  final DateTime? reminderSentAt;
  final bool confirmationSent;
  final DateTime? confirmationSentAt;
  final DateTime? cancelledAt;
  final String? cancelledBy;
  final String? cancellationReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Optional related data for display
  final PatientProfile? patient;
  final ClinicProfile? clinic;

  Appointment({
    required this.id,
    required this.patientId,
    required this.clinicId,
    this.doctorId,
    this.doctorName,
    this.doctorSpecialty,
    required this.appointmentDate,
    required this.appointmentTime,
    this.durationMinutes = 30,
    this.appointmentType = AppointmentType.consultation,
    this.status = AppointmentStatus.scheduled,
    this.priority = AppointmentPriority.normal,
    this.roomNumber,
    this.floorNumber,
    this.building,
    this.patientNotes,
    this.doctorNotes,
    this.adminNotes,
    this.insuranceProvider,
    this.insurancePolicyNumber,
    this.copayAmount,
    this.totalCost,
    this.reminderSent = false,
    this.reminderSentAt,
    this.confirmationSent = false,
    this.confirmationSentAt,
    this.cancelledAt,
    this.cancelledBy,
    this.cancellationReason,
    required this.createdAt,
    required this.updatedAt,
    this.patient,
    this.clinic,
  });

  DateTime get appointmentDateTime {
    final timeParts = appointmentTime.split(':');
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);

    return DateTime(
      appointmentDate.year,
      appointmentDate.month,
      appointmentDate.day,
      hour,
      minute,
    );
  }

  DateTime get appointmentEndTime {
    return appointmentDateTime.add(Duration(minutes: durationMinutes));
  }

  bool get isToday {
    final now = DateTime.now();
    return appointmentDate.year == now.year &&
        appointmentDate.month == now.month &&
        appointmentDate.day == now.day;
  }

  bool get isPastDue {
    return appointmentDateTime.isBefore(DateTime.now());
  }

  bool get canBeCancelled {
    return status == AppointmentStatus.scheduled ||
        status == AppointmentStatus.confirmed;
  }

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      patientId: json['patient_id'] as String,
      clinicId: json['clinic_id'] as String,
      doctorId: json['doctor_id'] as String?,
      doctorName: json['doctor_name'] as String?,
      doctorSpecialty: json['doctor_specialty'] as String?,
      appointmentDate: DateTime.parse(json['appointment_date'] as String),
      appointmentTime: json['appointment_time'] as String,
      durationMinutes: json['duration_minutes'] as int? ?? 30,
      appointmentType: AppointmentType.fromString(
        json['appointment_type'] as String? ?? 'consultation',
      ),
      status: AppointmentStatus.fromString(
        json['status'] as String? ?? 'scheduled',
      ),
      priority: AppointmentPriority.fromString(
        json['priority'] as String? ?? 'normal',
      ),
      roomNumber: json['room_number'] as String?,
      floorNumber: json['floor_number'] as String?,
      building: json['building'] as String?,
      patientNotes: json['patient_notes'] as String?,
      doctorNotes: json['doctor_notes'] as String?,
      adminNotes: json['admin_notes'] as String?,
      insuranceProvider: json['insurance_provider'] as String?,
      insurancePolicyNumber: json['insurance_policy_number'] as String?,
      copayAmount: json['copay_amount']?.toDouble(),
      totalCost: json['total_cost']?.toDouble(),
      reminderSent: json['reminder_sent'] as bool? ?? false,
      reminderSentAt: json['reminder_sent_at'] != null
          ? DateTime.parse(json['reminder_sent_at'] as String)
          : null,
      confirmationSent: json['confirmation_sent'] as bool? ?? false,
      confirmationSentAt: json['confirmation_sent_at'] != null
          ? DateTime.parse(json['confirmation_sent_at'] as String)
          : null,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.parse(json['cancelled_at'] as String)
          : null,
      cancelledBy: json['cancelled_by'] as String?,
      cancellationReason: json['cancellation_reason'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      patient: json['patient'] != null
          ? PatientProfile.fromJson(json['patient'])
          : null,
      clinic: json['clinic'] != null
          ? ClinicProfile.fromJson(json['clinic'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'clinic_id': clinicId,
      'doctor_id': doctorId,
      'doctor_name': doctorName,
      'doctor_specialty': doctorSpecialty,
      'appointment_date': appointmentDate.toIso8601String().split('T')[0],
      'appointment_time': appointmentTime,
      'duration_minutes': durationMinutes,
      'appointment_type': appointmentType.toString(),
      'status': status.toString(),
      'priority': priority.toString(),
      'room_number': roomNumber,
      'floor_number': floorNumber,
      'building': building,
      'patient_notes': patientNotes,
      'doctor_notes': doctorNotes,
      'admin_notes': adminNotes,
      'insurance_provider': insuranceProvider,
      'insurance_policy_number': insurancePolicyNumber,
      'copay_amount': copayAmount,
      'total_cost': totalCost,
      'reminder_sent': reminderSent,
      'reminder_sent_at': reminderSentAt?.toIso8601String(),
      'confirmation_sent': confirmationSent,
      'confirmation_sent_at': confirmationSentAt?.toIso8601String(),
      'cancelled_at': cancelledAt?.toIso8601String(),
      'cancelled_by': cancelledBy,
      'cancellation_reason': cancellationReason,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

enum AppointmentType {
  consultation,
  followUp,
  emergency,
  routineCheckup,
  specialistVisit,
  procedure,
  surgery,
  labTest,
  imaging,
  vaccination,
  physicalTherapy,
  mentalHealth,
  dental,
  vision,
  other;

  static AppointmentType fromString(String type) {
    switch (type) {
      case 'consultation':
        return AppointmentType.consultation;
      case 'follow_up':
        return AppointmentType.followUp;
      case 'emergency':
        return AppointmentType.emergency;
      case 'routine_checkup':
        return AppointmentType.routineCheckup;
      case 'specialist_visit':
        return AppointmentType.specialistVisit;
      case 'procedure':
        return AppointmentType.procedure;
      case 'surgery':
        return AppointmentType.surgery;
      case 'lab_test':
        return AppointmentType.labTest;
      case 'imaging':
        return AppointmentType.imaging;
      case 'vaccination':
        return AppointmentType.vaccination;
      case 'physical_therapy':
        return AppointmentType.physicalTherapy;
      case 'mental_health':
        return AppointmentType.mentalHealth;
      case 'dental':
        return AppointmentType.dental;
      case 'vision':
        return AppointmentType.vision;
      case 'other':
        return AppointmentType.other;
      default:
        return AppointmentType.consultation;
    }
  }

  @override
  String toString() {
    switch (this) {
      case AppointmentType.followUp:
        return 'follow_up';
      case AppointmentType.routineCheckup:
        return 'routine_checkup';
      case AppointmentType.specialistVisit:
        return 'specialist_visit';
      case AppointmentType.labTest:
        return 'lab_test';
      case AppointmentType.physicalTherapy:
        return 'physical_therapy';
      case AppointmentType.mentalHealth:
        return 'mental_health';
      default:
        return name;
    }
  }

  String get displayName {
    switch (this) {
      case AppointmentType.consultation:
        return 'Consultation';
      case AppointmentType.followUp:
        return 'Follow-up';
      case AppointmentType.emergency:
        return 'Emergency';
      case AppointmentType.routineCheckup:
        return 'Routine Checkup';
      case AppointmentType.specialistVisit:
        return 'Specialist Visit';
      case AppointmentType.procedure:
        return 'Procedure';
      case AppointmentType.surgery:
        return 'Surgery';
      case AppointmentType.labTest:
        return 'Lab Test';
      case AppointmentType.imaging:
        return 'Imaging';
      case AppointmentType.vaccination:
        return 'Vaccination';
      case AppointmentType.physicalTherapy:
        return 'Physical Therapy';
      case AppointmentType.mentalHealth:
        return 'Mental Health';
      case AppointmentType.dental:
        return 'Dental';
      case AppointmentType.vision:
        return 'Vision';
      case AppointmentType.other:
        return 'Other';
    }
  }
}

enum AppointmentStatus {
  scheduled,
  confirmed,
  inProgress,
  completed,
  cancelled,
  noShow,
  rescheduled;

  static AppointmentStatus fromString(String status) {
    switch (status) {
      case 'scheduled':
        return AppointmentStatus.scheduled;
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'in_progress':
        return AppointmentStatus.inProgress;
      case 'completed':
        return AppointmentStatus.completed;
      case 'cancelled':
        return AppointmentStatus.cancelled;
      case 'no_show':
        return AppointmentStatus.noShow;
      case 'rescheduled':
        return AppointmentStatus.rescheduled;
      default:
        return AppointmentStatus.scheduled;
    }
  }

  @override
  String toString() {
    switch (this) {
      case AppointmentStatus.inProgress:
        return 'in_progress';
      case AppointmentStatus.noShow:
        return 'no_show';
      default:
        return name;
    }
  }

  String get displayName {
    switch (this) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
    }
  }
}

enum AppointmentPriority {
  low,
  normal,
  high,
  urgent;

  static AppointmentPriority fromString(String priority) {
    switch (priority) {
      case 'low':
        return AppointmentPriority.low;
      case 'normal':
        return AppointmentPriority.normal;
      case 'high':
        return AppointmentPriority.high;
      case 'urgent':
        return AppointmentPriority.urgent;
      default:
        return AppointmentPriority.normal;
    }
  }

  @override
  String toString() {
    return name;
  }

  String get displayName {
    switch (this) {
      case AppointmentPriority.low:
        return 'Low';
      case AppointmentPriority.normal:
        return 'Normal';
      case AppointmentPriority.high:
        return 'High';
      case AppointmentPriority.urgent:
        return 'Urgent';
    }
  }
}
