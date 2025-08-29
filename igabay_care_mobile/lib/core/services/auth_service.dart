/// Authentication Service Implementation
/// Concrete implementation of authentication interfaces using Mock Supabase
///
/// This file provides authentication services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:supabase_flutter/supabase_flutter.dart (replaced with MockSupabase classes)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with MockSupabase
import '../interfaces/auth_service_interface.dart';
import '../models/user.dart';

/// Mock Supabase User class
class MockSupabaseUser {
  final String id;
  final String email;
  final DateTime createdAt;

  const MockSupabaseUser({
    required this.id,
    required this.email,
    required this.createdAt,
  });
}

/// Mock Auth Response
class MockAuthResponse {
  final MockSupabaseUser? user;
  final String? error;

  const MockAuthResponse({this.user, this.error});
}

/// Mock Auth Exception
class AuthException implements Exception {
  final String message;
  final String? statusCode;

  const AuthException(this.message, {this.statusCode});

  @override
  String toString() => 'AuthException: $message';
}

/// Mock OTP Type enum
enum OtpType { signup, recovery }

/// Mock User Attributes
class UserAttributes {
  final String? password;
  final String? email;

  const UserAttributes({this.password, this.email});
}

/// Mock Supabase Auth
class MockSupabaseAuth {
  MockSupabaseUser? _currentUser;

  MockSupabaseUser? get currentUser => _currentUser;

  /// Mock sign in with password
  Future<MockAuthResponse> signInWithPassword({
    required String email,
    required String password,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));
    print('[MockAuth] Sign in attempt: $email');

    // Mock validation
    if (email.isEmpty || password.isEmpty) {
      throw const AuthException('Invalid credentials');
    }

    // Mock successful authentication
    final user = MockSupabaseUser(
      id: 'mock-user-${email.hashCode}',
      email: email,
      createdAt: DateTime.now(),
    );

    _currentUser = user;
    return MockAuthResponse(user: user);
  }

  /// Mock sign up
  Future<MockAuthResponse> signUp({
    required String email,
    required String password,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    print('[MockAuth] Sign up attempt: $email');

    if (email.isEmpty || password.isEmpty) {
      throw const AuthException('Invalid registration data');
    }

    final user = MockSupabaseUser(
      id: 'mock-user-${DateTime.now().millisecondsSinceEpoch}',
      email: email,
      createdAt: DateTime.now(),
    );

    _currentUser = user;
    return MockAuthResponse(user: user);
  }

  /// Mock sign out
  Future<void> signOut() async {
    await Future.delayed(const Duration(milliseconds: 200));
    print('[MockAuth] Sign out');
    _currentUser = null;
  }

  /// Mock password reset
  Future<void> resetPasswordForEmail(String email) async {
    await Future.delayed(const Duration(milliseconds: 300));
    print('[MockAuth] Password reset for: $email');
  }

  /// Mock resend verification
  Future<void> resend({required OtpType type, required String email}) async {
    await Future.delayed(const Duration(milliseconds: 300));
    print('[MockAuth] Resend ${type.name} to: $email');
  }

  /// Mock update user
  Future<MockAuthResponse> updateUser(UserAttributes attributes) async {
    await Future.delayed(const Duration(milliseconds: 300));
    print('[MockAuth] Update user attributes');

    if (_currentUser == null) {
      throw const AuthException('No authenticated user');
    }

    return MockAuthResponse(user: _currentUser);
  }
}

/// Mock Supabase Table
class MockSupabaseTable {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  final Map<String, dynamic> _insertData = {};
  String? _selectQuery;

  MockSupabaseTable(this.tableName);

  MockSupabaseTable select([String? columns]) {
    _selectQuery = columns ?? '*';
    return this;
  }

  MockSupabaseTable eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockTable] $tableName.single() with filters: $_filters');

    // Return mock data based on table and filters
    return _generateMockData();
  }

  Future<void> insert(Map<String, dynamic> data) async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockTable] INSERT into $tableName: $data');
  }

  Map<String, dynamic> _generateMockData() {
    switch (tableName) {
      case 'profiles':
        return {
          'id': _filters['id'] ?? 'mock-profile-id',
          'email': 'mock@example.com',
          'first_name': 'Mock',
          'last_name': 'User',
          'role': 'patient',
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
          'patient_profiles': [
            {
              'id': 'mock-patient-id',
              'user_id': _filters['id'] ?? 'mock-profile-id',
              'first_name': 'Mock',
              'last_name': 'Patient',
              'email': 'patient@example.com',
              'created_at': DateTime.now().toIso8601String(),
              'updated_at': DateTime.now().toIso8601String(),
            },
          ],
          'clinic_profiles': [],
        };
      case 'patient_profiles':
        return {
          'id': _filters['user_id'] ?? 'mock-patient-id',
          'user_id': _filters['user_id'] ?? 'mock-profile-id',
          'first_name': 'Mock',
          'last_name': 'Patient',
          'email': 'patient@example.com',
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        };
      case 'clinic_profiles':
        return {
          'id': _filters['user_id'] ?? 'mock-clinic-id',
          'user_id': _filters['user_id'] ?? 'mock-profile-id',
          'clinic_name': 'Mock Clinic',
          'email': 'clinic@example.com',
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        };
      default:
        return {
          'id': 'mock-id',
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        };
    }
  }
}

/// Mock Supabase Client
class SupabaseClient {
  final MockSupabaseAuth _auth = MockSupabaseAuth();

  MockSupabaseAuth get auth => _auth;

  MockSupabaseTable from(String tableName) => MockSupabaseTable(tableName);
}

/// Mock Supabase singleton
class Supabase {
  static final Supabase _instance = Supabase._internal();
  static Supabase get instance => _instance;

  Supabase._internal();

  final SupabaseClient _client = SupabaseClient();
  SupabaseClient get client => _client;
}

/// Supabase Authentication Service Implementation
class SupabaseAuthService implements IAuthenticationService {
  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  Future<ServiceResult<User>> signIn(SignInCredentials credentials) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: credentials.email,
        password: credentials.password,
      );

      if (response.user != null) {
        // Fetch user profile data
        final userProfile = await _fetchUserProfile(response.user!.id);
        if (userProfile.success && userProfile.data != null) {
          return ServiceResult.success(userProfile.data!);
        } else {
          return ServiceResult.failure(
            'Failed to fetch user profile',
            'PROFILE_FETCH_ERROR',
          );
        }
      } else {
        return ServiceResult.failure('Authentication failed', 'AUTH_FAILED');
      }
    } on AuthException catch (e) {
      return ServiceResult.failure(e.message, e.statusCode);
    } catch (e) {
      return ServiceResult.failure(
        'Unexpected error during sign in: ${e.toString()}',
        'UNKNOWN_ERROR',
      );
    }
  }

  // Additional method for user registration (not in interface but used by registration service)
  Future<ServiceResult<User>> signUp(SignUpData data) async {
    try {
      final response = await _supabase.auth.signUp(
        email: data.email,
        password: data.password,
      );

      if (response.user != null) {
        // Create user profile based on role
        final profileResult = await _createUserProfile(response.user!, data);
        if (profileResult.success) {
          return ServiceResult.success(profileResult.data!);
        } else {
          return ServiceResult.failure(
            'Failed to create user profile',
            'PROFILE_CREATE_ERROR',
          );
        }
      } else {
        return ServiceResult.failure(
          'User registration failed',
          'REGISTRATION_FAILED',
        );
      }
    } on AuthException catch (e) {
      return ServiceResult.failure(e.message, e.statusCode);
    } catch (e) {
      return ServiceResult.failure(
        'Unexpected error during sign up: ${e.toString()}',
        'UNKNOWN_ERROR',
      );
    }
  }

  @override
  Future<ServiceResult<void>> signOut() async {
    try {
      await _supabase.auth.signOut();
      return ServiceResult.success(null);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to sign out: ${e.toString()}',
        'SIGNOUT_ERROR',
      );
    }
  }

  @override
  Future<ServiceResult<User>> getCurrentUser() async {
    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser != null) {
        final userProfile = await _fetchUserProfile(currentUser.id);
        return userProfile; // Return the ServiceResult<User> directly
      }
      // Return a failure instead of success with null for non-nullable User
      return ServiceResult.failure('No authenticated user', 'NO_USER');
    } catch (e) {
      return ServiceResult.failure(
        'Failed to get current user: ${e.toString()}',
        'GET_USER_ERROR',
      );
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      final currentUser = _supabase.auth.currentUser;
      return currentUser != null;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<ServiceResult<void>> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
      return ServiceResult.success(null);
    } on AuthException catch (e) {
      return ServiceResult.failure(e.message, e.statusCode);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to send password reset email: ${e.toString()}',
        'RESET_PASSWORD_ERROR',
      );
    }
  }

  /// Helper method to fetch user profile
  Future<ServiceResult<User>> _fetchUserProfile(String userId) async {
    try {
      // Query the profiles table to get user role and basic info
      final response = await _supabase
          .from('profiles')
          .select('*, patient_profiles(*), clinic_profiles(*)')
          .eq('id', userId)
          .single();

      final user = User.fromJson(response);
      return ServiceResult.success(user);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to fetch user profile: ${e.toString()}',
        'FETCH_PROFILE_ERROR',
      );
    }
  }

  /// Helper method to create user profile
  Future<ServiceResult<User>> _createUserProfile(
    MockSupabaseUser authUser,
    SignUpData data,
  ) async {
    try {
      // Create basic profile
      final profileData = {
        'id': authUser.id,
        'email': data.email,
        'first_name': data.firstName,
        'last_name': data.lastName,
        'role': data.role.name,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      await _supabase.from('profiles').insert(profileData);

      // Create role-specific profile
      switch (data.role) {
        case UserRole.patient:
          await _createPatientProfile(authUser.id, data);
          break;
        case UserRole.clinic:
          await _createClinicProfile(authUser.id, data);
          break;
      }

      // Fetch the complete user profile
      return await _fetchUserProfile(authUser.id);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to create user profile: ${e.toString()}',
        'CREATE_PROFILE_ERROR',
      );
    }
  }

  /// Create patient-specific profile
  Future<void> _createPatientProfile(String userId, SignUpData data) async {
    final patientData = {
      'id': userId,
      'user_id': userId,
      'first_name': data.firstName,
      'last_name': data.lastName,
      'date_of_birth': null, // To be filled during profile completion
      'phone_number': null,
      'address': null,
      'emergency_contact': null,
      'blood_type': null,
      'allergies': null,
      'medications': null,
      'medical_conditions': null,
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    await _supabase.from('patient_profiles').insert(patientData);
  }

  /// Create clinic-specific profile
  Future<void> _createClinicProfile(String userId, SignUpData data) async {
    final clinicData = {
      'id': userId,
      'user_id': userId,
      'clinic_name':
          data.clinicName ?? '${data.firstName} ${data.lastName} Clinic',
      'description': null, // To be filled during profile completion
      'phone_number': null,
      'email': data.email,
      'address': null,
      'city': null,
      'state': null,
      'zip_code': null,
      'latitude': null,
      'longitude': null,
      'operating_hours': null,
      'specialties': data.specialization != null ? [data.specialization!] : [],
      'status': 'pending',
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    await _supabase.from('clinic_profiles').insert(clinicData);
  }
}

/// User Registration Service Implementation
class SupabaseUserRegistrationService implements IUserRegistrationService {
  final SupabaseAuthService _authService = SupabaseAuthService();

  @override
  Future<ServiceResult<User>> registerUser(SignUpData data) async {
    return await _authService.signUp(data);
  }

  @override
  Future<ServiceResult<void>> verifyEmail(String token) async {
    try {
      // Supabase handles email verification automatically
      // This method is for custom verification logic if needed
      return ServiceResult.success(null);
    } catch (e) {
      return ServiceResult.failure(
        'Email verification failed: ${e.toString()}',
        'EMAIL_VERIFICATION_ERROR',
      );
    }
  }

  @override
  Future<ServiceResult<void>> resendVerification(String email) async {
    try {
      await Supabase.instance.client.auth.resend(
        type: OtpType.signup,
        email: email,
      );
      return ServiceResult.success(null);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to resend verification email: ${e.toString()}',
        'RESEND_VERIFICATION_ERROR',
      );
    }
  }
}

/// Password Service Implementation
class SupabasePasswordService implements IPasswordService {
  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  Future<ServiceResult<void>> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
      return ServiceResult.success(null);
    } on AuthException catch (e) {
      return ServiceResult.failure(e.message, e.statusCode);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to reset password: ${e.toString()}',
        'RESET_PASSWORD_ERROR',
      );
    }
  }

  @override
  Future<ServiceResult<void>> changePassword(
    String oldPassword,
    String newPassword,
  ) async {
    try {
      await _supabase.auth.updateUser(UserAttributes(password: newPassword));
      return ServiceResult.success(null);
    } on AuthException catch (e) {
      return ServiceResult.failure(e.message, e.statusCode);
    } catch (e) {
      return ServiceResult.failure(
        'Failed to change password: ${e.toString()}',
        'CHANGE_PASSWORD_ERROR',
      );
    }
  }

  @override
  ValidationResult validatePassword(String password) {
    final errors = <String>[];

    if (password.isEmpty) {
      errors.add('Password is required');
    } else {
      if (password.length < 8) {
        errors.add('Password must be at least 8 characters long');
      }
      if (!password.contains(RegExp(r'[A-Z]'))) {
        errors.add('Password must contain at least one uppercase letter');
      }
      if (!password.contains(RegExp(r'[a-z]'))) {
        errors.add('Password must contain at least one lowercase letter');
      }
      if (!password.contains(RegExp(r'[0-9]'))) {
        errors.add('Password must contain at least one number');
      }
      if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
        errors.add('Password must contain at least one special character');
      }
    }

    return ValidationResult(isValid: errors.isEmpty, errors: errors);
  }
}
