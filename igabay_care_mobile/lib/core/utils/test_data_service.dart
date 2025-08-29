/// Test Data Service
/// Provides test user creation and management for development/testing

import '../providers/auth_provider.dart';
import '../models/user.dart';

/// Test user credentials
class TestUsers {
  static const patient = TestPatientData(
    email: 'patient@test.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
  );

  static const clinic = TestClinicData(
    email: 'clinic@test.com',
    password: 'TestPassword123!',
    clinicName: 'Test Medical Clinic',
    location: 'Test City',
    phone: '+1-555-0123',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    description: 'A test clinic for development purposes',
  );

  static const doctor = TestDoctorData(
    email: 'doctor@test.com',
    password: 'TestPassword123!',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    licenseNumber: 'MD123456',
    specialization: 'General Medicine',
    phone: '+1-555-0124',
    experienceYears: 5,
  );
}

/// Test user data classes
class TestPatientData {
  final String email;
  final String password;
  final String firstName;
  final String lastName;

  const TestPatientData({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });
}

class TestClinicData {
  final String email;
  final String password;
  final String clinicName;
  final String location;
  final String phone;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final String description;

  const TestClinicData({
    required this.email,
    required this.password,
    required this.clinicName,
    required this.location,
    required this.phone,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.description,
  });
}

class TestDoctorData {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String licenseNumber;
  final String specialization;
  final String phone;
  final int experienceYears;

  const TestDoctorData({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.licenseNumber,
    required this.specialization,
    required this.phone,
    required this.experienceYears,
  });
}

/// Result classes for test operations
class TestUserResults {
  final TestResult? patient;
  final TestResult? clinic;
  final TestResult? doctor;

  const TestUserResults({this.patient, this.clinic, this.doctor});
}

class TestResult {
  final bool success;
  final User? user;
  final String? error;

  const TestResult({required this.success, this.user, this.error});

  TestResult.success(this.user) : success = true, error = null;

  TestResult.failure(this.error) : success = false, user = null;
}

/// Test data service class
class TestDataService {
  final AuthProvider _authProvider;

  TestDataService(this._authProvider);

  /// Create all test users
  Future<TestUserResults> createAllTestUsers() async {
    print('Creating test users...');

    TestResult? patientResult;
    TestResult? clinicResult;
    TestResult? doctorResult;

    try {
      // Create test patient
      print('Creating test patient...');
      try {
        await _authProvider.register(
          TestUsers.patient.email,
          TestUsers.patient.password,
          UserRole.patient,
          additionalData: {
            'first_name': TestUsers.patient.firstName,
            'last_name': TestUsers.patient.lastName,
          },
        );
        final user = _authProvider.user;
        if (user != null) {
          patientResult = TestResult.success(user);
          print('✅ Test patient created successfully');
        } else {
          patientResult = TestResult.failure('User not found after creation');
          print(
            '❌ Failed to create test patient: User not found after creation',
          );
        }
      } catch (e) {
        patientResult = TestResult.failure(e.toString());
        print('❌ Failed to create test patient: $e');
      }

      // Sign out before creating next user
      await _authProvider.logout();

      // Create test clinic
      print('Creating test clinic...');
      try {
        await _authProvider.register(
          TestUsers.clinic.email,
          TestUsers.clinic.password,
          UserRole.clinic,
          additionalData: {
            'clinic_name': TestUsers.clinic.clinicName,
            'address': TestUsers.clinic.address,
            'city': TestUsers.clinic.city,
            'state': TestUsers.clinic.state,
            'zip_code': TestUsers.clinic.zipCode,
            'phone_number': TestUsers.clinic.phone,
            'description': TestUsers.clinic.description,
          },
        );
        final user = _authProvider.user;
        if (user != null) {
          clinicResult = TestResult.success(user);
          print('✅ Test clinic created successfully');
        } else {
          clinicResult = TestResult.failure('User not found after creation');
          print(
            '❌ Failed to create test clinic: User not found after creation',
          );
        }
      } catch (e) {
        clinicResult = TestResult.failure(e.toString());
        print('❌ Failed to create test clinic: $e');
      }

      // Sign out before creating next user
      await _authProvider.logout();

      // Create test doctor (if doctor role exists)
      print('Creating test doctor...');
      try {
        await _authProvider.register(
          TestUsers.doctor.email,
          TestUsers.doctor.password,
          UserRole
              .clinic, // Using clinic role as doctor might be part of clinic
          additionalData: {
            'first_name': TestUsers.doctor.firstName,
            'last_name': TestUsers.doctor.lastName,
            'license_number': TestUsers.doctor.licenseNumber,
            'specialization': TestUsers.doctor.specialization,
            'phone_number': TestUsers.doctor.phone,
            'experience_years': TestUsers.doctor.experienceYears,
          },
        );
        final user = _authProvider.user;
        if (user != null) {
          doctorResult = TestResult.success(user);
          print('✅ Test doctor created successfully');
        } else {
          doctorResult = TestResult.failure('User not found after creation');
          print(
            '❌ Failed to create test doctor: User not found after creation',
          );
        }
      } catch (e) {
        doctorResult = TestResult.failure(e.toString());
        print('❌ Failed to create test doctor: $e');
      }
    } catch (error) {
      print('Exception during test user creation: $error');
    }

    return TestUserResults(
      patient: patientResult,
      clinic: clinicResult,
      doctor: doctorResult,
    );
  }

  /// Test sign-in for all user types
  Future<TestUserResults> testAllSignIns() async {
    print('Testing sign-ins...');

    TestResult? patientResult;
    TestResult? clinicResult;
    TestResult? doctorResult;

    try {
      // Test patient sign-in
      print('Testing patient sign-in...');
      try {
        await _authProvider.login(
          TestUsers.patient.email,
          TestUsers.patient.password,
        );
        final user = _authProvider.user;
        if (user != null) {
          patientResult = TestResult.success(user);
          print('✅ Patient sign-in successful');
        } else {
          patientResult = TestResult.failure('User not found after sign-in');
          print('❌ Patient sign-in failed: User not found after sign-in');
        }
      } catch (e) {
        patientResult = TestResult.failure(e.toString());
        print('❌ Patient sign-in failed: $e');
      }

      // Sign out before next test
      await _authProvider.logout();

      // Test clinic sign-in
      print('Testing clinic sign-in...');
      try {
        await _authProvider.login(
          TestUsers.clinic.email,
          TestUsers.clinic.password,
        );
        final user = _authProvider.user;
        if (user != null) {
          clinicResult = TestResult.success(user);
          print('✅ Clinic sign-in successful');
        } else {
          clinicResult = TestResult.failure('User not found after sign-in');
          print('❌ Clinic sign-in failed: User not found after sign-in');
        }
      } catch (e) {
        clinicResult = TestResult.failure(e.toString());
        print('❌ Clinic sign-in failed: $e');
      }

      // Sign out before next test
      await _authProvider.logout();

      // Test doctor sign-in
      print('Testing doctor sign-in...');
      try {
        await _authProvider.login(
          TestUsers.doctor.email,
          TestUsers.doctor.password,
        );
        final user = _authProvider.user;
        if (user != null) {
          doctorResult = TestResult.success(user);
          print('✅ Doctor sign-in successful');
        } else {
          doctorResult = TestResult.failure('User not found after sign-in');
          print('❌ Doctor sign-in failed: User not found after sign-in');
        }
      } catch (e) {
        doctorResult = TestResult.failure(e.toString());
        print('❌ Doctor sign-in failed: $e');
      }
    } catch (error) {
      print('Exception during sign-in testing: $error');
    }

    return TestUserResults(
      patient: patientResult,
      clinic: clinicResult,
      doctor: doctorResult,
    );
  }

  /// Create a specific test user type
  Future<TestResult> createTestUser(String userType) async {
    print('Creating test $userType...');

    try {
      switch (userType.toLowerCase()) {
        case 'patient':
          await _authProvider.register(
            TestUsers.patient.email,
            TestUsers.patient.password,
            UserRole.patient,
            additionalData: {
              'first_name': TestUsers.patient.firstName,
              'last_name': TestUsers.patient.lastName,
            },
          );
          break;

        case 'clinic':
          await _authProvider.register(
            TestUsers.clinic.email,
            TestUsers.clinic.password,
            UserRole.clinic,
            additionalData: {
              'clinic_name': TestUsers.clinic.clinicName,
              'address': TestUsers.clinic.address,
              'city': TestUsers.clinic.city,
              'state': TestUsers.clinic.state,
              'zip_code': TestUsers.clinic.zipCode,
              'phone_number': TestUsers.clinic.phone,
              'description': TestUsers.clinic.description,
            },
          );
          break;

        case 'doctor':
          await _authProvider.register(
            TestUsers.doctor.email,
            TestUsers.doctor.password,
            UserRole.clinic,
            additionalData: {
              'first_name': TestUsers.doctor.firstName,
              'last_name': TestUsers.doctor.lastName,
              'license_number': TestUsers.doctor.licenseNumber,
              'specialization': TestUsers.doctor.specialization,
              'phone_number': TestUsers.doctor.phone,
              'experience_years': TestUsers.doctor.experienceYears,
            },
          );
          break;

        default:
          throw Exception('Unknown user type: $userType');
      }

      final user = _authProvider.user;
      if (user != null) {
        print('✅ Test $userType created successfully');
        return TestResult.success(user);
      } else {
        print(
          '❌ Failed to create test $userType: User not found after creation',
        );
        return TestResult.failure('User not found after creation');
      }
    } catch (error) {
      print('❌ Failed to create test $userType: $error');
      return TestResult.failure(error.toString());
    }
  }

  /// Test sign-in for a specific user type
  Future<TestResult> testUserSignIn(String userType) async {
    print('Testing $userType sign-in...');

    try {
      late String email;
      late String password;

      switch (userType.toLowerCase()) {
        case 'patient':
          email = TestUsers.patient.email;
          password = TestUsers.patient.password;
          break;
        case 'clinic':
          email = TestUsers.clinic.email;
          password = TestUsers.clinic.password;
          break;
        case 'doctor':
          email = TestUsers.doctor.email;
          password = TestUsers.doctor.password;
          break;
        default:
          throw Exception('Unknown user type: $userType');
      }

      await _authProvider.login(email, password);
      final user = _authProvider.user;

      if (user != null) {
        print('✅ $userType sign-in successful');
        return TestResult.success(user);
      } else {
        print('❌ $userType sign-in failed: User not found after sign-in');
        return TestResult.failure('User not found after sign-in');
      }
    } catch (error) {
      print('❌ $userType sign-in failed: $error');
      return TestResult.failure(error.toString());
    }
  }

  /// Clean up test users (for testing purposes)
  Future<void> cleanupTestUsers() async {
    print('🧹 Cleaning up test users...');

    // Note: In a real app, you might want to implement user deletion
    // For now, this is just a placeholder
    print(
      '⚠️ User cleanup not implemented - manually delete test users if needed',
    );
  }

  /// Get test user credentials for manual testing
  Map<String, dynamic> getTestCredentials() {
    return {
      'patient': {
        'email': TestUsers.patient.email,
        'password': TestUsers.patient.password,
      },
      'clinic': {
        'email': TestUsers.clinic.email,
        'password': TestUsers.clinic.password,
      },
      'doctor': {
        'email': TestUsers.doctor.email,
        'password': TestUsers.doctor.password,
      },
    };
  }

  /// Print test credentials for debugging
  void printTestCredentials() {
    print('📋 Test User Credentials:');
    print(
      '👤 Patient: ${TestUsers.patient.email} / ${TestUsers.patient.password}',
    );
    print(
      '🏥 Clinic: ${TestUsers.clinic.email} / ${TestUsers.clinic.password}',
    );
    print(
      '👨‍⚕️ Doctor: ${TestUsers.doctor.email} / ${TestUsers.doctor.password}',
    );
  }
}
