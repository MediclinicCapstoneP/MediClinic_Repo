import '../models/appointment.dart';
import '../models/patient_profile.dart';
import '../models/clinic_profile.dart';

/// Custom mock Supabase client for development without package dependencies
class MockSupabaseClient {
  /// Mock database table interface
  MockTable from(String tableName) => MockTable(tableName);
}

/// Mock table interface that simulates Supabase table operations
class MockTable {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  final List<String> _orderBy = [];
  String? _selectQuery;

  MockTable(this.tableName);

  MockTable select([String? columns]) {
    _selectQuery = columns ?? '*';
    return this;
  }

  MockTable eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockTable gte(String column, dynamic value) {
    _filters['${column}_gte'] = value;
    return this;
  }

  MockTable in_(String column, List<dynamic> values) {
    _filters['${column}_in'] = values;
    return this;
  }

  MockTable limit(int count) {
    _filters['_limit'] = count;
    return this;
  }

  MockTable order(String column, {bool ascending = true}) {
    _orderBy.add('$column ${ascending ? 'ASC' : 'DESC'}');
    return this;
  }

  /// Mock insert operation
  MockTable insert(Map<String, dynamic> data) {
    debugPrint('Mock INSERT into $tableName: $data');
    return this;
  }

  /// Mock update operation
  MockTable update(Map<String, dynamic> data) {
    debugPrint('Mock UPDATE $tableName SET $data WHERE $_filters');
    return this;
  }

  /// Mock single result
  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return _createMockResult();
  }

  /// Mock multiple results
  Future<List<Map<String, dynamic>>> call() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return [_createMockResult()];
  }

  /// Mock length getter for count operations
  int get length => 5; // Mock count

  /// Mock map method to transform results
  List<T> map<T>(T Function(Map<String, dynamic>) transform) {
    // Create mock list and transform each item
    final mockResults = [_createMockResult(), _createMockResult()];
    return mockResults.map(transform).toList();
  }

  /// Create mock result based on table name
  Map<String, dynamic> _createMockResult() {
    final now = DateTime.now();

    switch (tableName) {
      case 'appointments':
        return {
          'id': 'mock-appointment-${now.millisecondsSinceEpoch}',
          'patient_id': _filters['patient_id'] ?? 'mock-patient-id',
          'clinic_id': _filters['clinic_id'] ?? 'mock-clinic-id',
          'doctor_id': null,
          'doctor_name': 'Dr. Mock Doctor',
          'doctor_specialty': 'General Medicine',
          'appointment_date': now.toIso8601String().split('T')[0],
          'appointment_time': '10:00',
          'duration_minutes': 30,
          'appointment_type': 'consultation',
          'priority': 'normal',
          'status': 'scheduled',
          'patient_notes': 'Mock appointment notes',
          'created_at': now.toIso8601String(),
          'updated_at': now.toIso8601String(),
        };
      default:
        return {'id': 'mock-id', 'created_at': now.toIso8601String()};
    }
  }
}

/// Mock Supabase instance
class MockSupabase {
  static final MockSupabase _instance = MockSupabase._internal();
  static MockSupabase get instance => _instance;

  MockSupabase._internal();

  MockSupabaseClient get client => MockSupabaseClient();
}

/// Simple debug print function
void debugPrint(String message) {
  print('[AppointmentService] $message');
}

class AppointmentService {
  final MockSupabaseClient _supabase = MockSupabase.instance.client;

  // Create a new appointment
  Future<Appointment> createAppointment({
    required String patientId,
    required String clinicId,
    String? doctorId,
    String? doctorName,
    String? doctorSpecialty,
    required DateTime appointmentDate,
    required String appointmentTime,
    int durationMinutes = 30,
    AppointmentType appointmentType = AppointmentType.consultation,
    AppointmentPriority priority = AppointmentPriority.normal,
    String? patientNotes,
    String? insuranceProvider,
    String? insurancePolicyNumber,
    double? copayAmount,
    double? totalCost,
  }) async {
    try {
      final appointmentData = {
        'patient_id': patientId,
        'clinic_id': clinicId,
        'doctor_id': doctorId,
        'doctor_name': doctorName,
        'doctor_specialty': doctorSpecialty,
        'appointment_date': appointmentDate.toIso8601String().split('T')[0],
        'appointment_time': appointmentTime,
        'duration_minutes': durationMinutes,
        'appointment_type': appointmentType.toString(),
        'priority': priority.toString(),
        'patient_notes': patientNotes,
        'insurance_provider': insuranceProvider,
        'insurance_policy_number': insurancePolicyNumber,
        'copay_amount': copayAmount,
        'total_cost': totalCost,
        'status': 'scheduled',
      };

      final response = await _supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();

      return Appointment.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create appointment: ${e.toString()}');
    }
  }

  // Get appointments for a patient
  Future<List<Appointment>> getPatientAppointments(String patientId) async {
    try {
      final response = await _supabase
          .from('appointments')
          .select('''
            *,
            clinics!appointments_clinic_id_fkey (
              id,
              clinic_name,
              address,
              city,
              state,
              phone
            )
          ''')
          .eq('patient_id', patientId)
          .order('appointment_date', ascending: true)
          .order('appointment_time', ascending: true);

      return response.map((data) => Appointment.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch patient appointments: ${e.toString()}');
    }
  }

  // Get appointments for a clinic
  Future<List<Appointment>> getClinicAppointments(String clinicId) async {
    try {
      final response = await _supabase
          .from('appointments')
          .select('''
            *,
            patients!appointments_patient_id_fkey (
              id,
              first_name,
              last_name,
              email,
              phone,
              date_of_birth
            )
          ''')
          .eq('clinic_id', clinicId)
          .order('appointment_date', ascending: true)
          .order('appointment_time', ascending: true);

      return response.map((data) => Appointment.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch clinic appointments: ${e.toString()}');
    }
  }

  // Get appointments for a specific date
  Future<List<Appointment>> getAppointmentsByDate({
    required String clinicId,
    required DateTime date,
  }) async {
    try {
      final dateString = date.toIso8601String().split('T')[0];

      final response = await _supabase
          .from('appointments')
          .select('''
            *,
            patients!appointments_patient_id_fkey (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          ''')
          .eq('clinic_id', clinicId)
          .eq('appointment_date', dateString)
          .order('appointment_time', ascending: true);

      return response.map((data) => Appointment.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch appointments by date: ${e.toString()}');
    }
  }

  // Update appointment status
  Future<Appointment> updateAppointmentStatus({
    required String appointmentId,
    required AppointmentStatus status,
    String? doctorNotes,
    String? adminNotes,
    String? cancelledBy,
    String? cancellationReason,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'status': status.toString(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (doctorNotes != null) updateData['doctor_notes'] = doctorNotes;
      if (adminNotes != null) updateData['admin_notes'] = adminNotes;

      if (status == AppointmentStatus.cancelled) {
        updateData['cancelled_at'] = DateTime.now().toIso8601String();
        updateData['cancelled_by'] = cancelledBy;
        updateData['cancellation_reason'] = cancellationReason;
      }

      final response = await _supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointmentId)
          .select()
          .single();

      return Appointment.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update appointment status: ${e.toString()}');
    }
  }

  // Reschedule appointment
  Future<Appointment> rescheduleAppointment({
    required String appointmentId,
    required DateTime newDate,
    required String newTime,
  }) async {
    try {
      final updateData = {
        'appointment_date': newDate.toIso8601String().split('T')[0],
        'appointment_time': newTime,
        'status': AppointmentStatus.rescheduled.toString(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      final response = await _supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointmentId)
          .select()
          .single();

      return Appointment.fromJson(response);
    } catch (e) {
      throw Exception('Failed to reschedule appointment: ${e.toString()}');
    }
  }

  // Cancel appointment
  Future<Appointment> cancelAppointment({
    required String appointmentId,
    required String cancelledBy,
    String? cancellationReason,
  }) async {
    return updateAppointmentStatus(
      appointmentId: appointmentId,
      status: AppointmentStatus.cancelled,
      cancelledBy: cancelledBy,
      cancellationReason: cancellationReason,
    );
  }

  // Confirm appointment
  Future<Appointment> confirmAppointment(String appointmentId) async {
    return updateAppointmentStatus(
      appointmentId: appointmentId,
      status: AppointmentStatus.confirmed,
    );
  }

  // Complete appointment
  Future<Appointment> completeAppointment({
    required String appointmentId,
    String? doctorNotes,
  }) async {
    return updateAppointmentStatus(
      appointmentId: appointmentId,
      status: AppointmentStatus.completed,
      doctorNotes: doctorNotes,
    );
  }

  // Get upcoming appointments for a user
  Future<List<Appointment>> getUpcomingAppointments({
    String? patientId,
    String? clinicId,
    int limit = 10,
  }) async {
    try {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);

      var query = _supabase
          .from('appointments')
          .select('''
            *,
            patients!appointments_patient_id_fkey (
              id,
              first_name,
              last_name,
              email,
              phone
            ),
            clinics!appointments_clinic_id_fkey (
              id,
              clinic_name,
              address,
              city,
              state
            )
          ''')
          .gte('appointment_date', today.toIso8601String().split('T')[0])
          .in_('status', ['scheduled', 'confirmed'])
          .order('appointment_date', ascending: true)
          .order('appointment_time', ascending: true)
          .limit(limit);

      if (patientId != null) {
        query = query.eq('patient_id', patientId);
      }

      if (clinicId != null) {
        query = query.eq('clinic_id', clinicId);
      }

      final response = await query;
      return response.map((data) => Appointment.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch upcoming appointments: ${e.toString()}');
    }
  }

  // Get appointment statistics
  Future<Map<String, int>> getAppointmentStats(String clinicId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];

      // Get total appointments
      final totalResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId);

      // Get today's appointments
      final todayResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('appointment_date', today);

      // Get appointments by status
      final scheduledResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('status', 'scheduled');

      final confirmedResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('status', 'confirmed');

      final completedResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('status', 'completed');

      final cancelledResponse = await _supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('status', 'cancelled');

      return {
        'total': totalResponse.length,
        'today': todayResponse.length,
        'scheduled': scheduledResponse.length,
        'confirmed': confirmedResponse.length,
        'completed': completedResponse.length,
        'cancelled': cancelledResponse.length,
      };
    } catch (e) {
      throw Exception(
        'Failed to fetch appointment statistics: ${e.toString()}',
      );
    }
  }

  // Search available time slots
  Future<List<String>> getAvailableTimeSlots({
    required String clinicId,
    required DateTime date,
    int durationMinutes = 30,
  }) async {
    try {
      // Get existing appointments for the date
      final existingAppointments = await getAppointmentsByDate(
        clinicId: clinicId,
        date: date,
      );

      // Define business hours (9 AM to 5 PM)
      final List<String> allSlots = [];
      for (int hour = 9; hour < 17; hour++) {
        for (int minute = 0; minute < 60; minute += durationMinutes) {
          final timeString =
              '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}:00';
          allSlots.add(timeString);
        }
      }

      // Remove occupied slots
      final occupiedSlots = existingAppointments
          .where((apt) => apt.status != AppointmentStatus.cancelled)
          .map((apt) => apt.appointmentTime)
          .toSet();

      return allSlots.where((slot) => !occupiedSlots.contains(slot)).toList();
    } catch (e) {
      throw Exception('Failed to fetch available time slots: ${e.toString()}');
    }
  }
}
