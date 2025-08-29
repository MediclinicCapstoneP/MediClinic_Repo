/// Authentication Provider with Custom Implementations
///
/// This file provides authentication functionality for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:flutter/material.dart (replaced with custom VoidCallback typedef)
/// - package:supabase_flutter/supabase_flutter.dart (replaced with MockSupabase classes)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

import '../models/user.dart';
import '../models/patient_profile.dart';
import '../models/clinic_profile.dart';

/// Custom callback type for listeners
typedef VoidCallback = void Function();

/// Simple debug print function
void debugPrint(String message) {
  print('[AuthProvider] $message');
}

/// Mock authentication change events
enum AuthChangeEvent { signedIn, signedOut, tokenRefreshed, userUpdated }

/// Mock authentication session
class Session {
  final MockUser user;
  final String accessToken;
  final DateTime expiresAt;

  const Session({
    required this.user,
    required this.accessToken,
    required this.expiresAt,
  });
}

/// Mock user for authentication
class MockUser {
  final String id;
  final String email;
  final DateTime createdAt;

  const MockUser({
    required this.id,
    required this.email,
    required this.createdAt,
  });
}

/// Mock authentication response
class AuthResponse {
  final MockUser? user;
  final Session? session;
  final String? error;

  const AuthResponse({this.user, this.session, this.error});
}

/// Mock authentication exception
class AuthException implements Exception {
  final String message;
  final String? statusCode;

  const AuthException(this.message, {this.statusCode});

  @override
  String toString() => 'AuthException: $message';
}

/// Mock authentication state change data
class AuthStateChangeData {
  final AuthChangeEvent event;
  final Session? session;

  const AuthStateChangeData({required this.event, this.session});
}

/// Mock authentication manager
class MockAuth {
  Session? _currentSession;
  final List<void Function(AuthStateChangeData)> _listeners = [];

  Session? get currentSession => _currentSession;

  /// Stream-like listener for auth state changes
  void Function(void Function(AuthStateChangeData)) get onAuthStateChange =>
      (callback) => _listeners.add(callback);

  /// Mock sign up method
  Future<AuthResponse> signUp({
    required String email,
    required String password,
  }) async {
    debugPrint('Mock signUp: $email');
    await Future.delayed(const Duration(milliseconds: 500));

    final user = MockUser(
      id: 'mock-user-${DateTime.now().millisecondsSinceEpoch}',
      email: email,
      createdAt: DateTime.now(),
    );

    final session = Session(
      user: user,
      accessToken: 'mock-access-token',
      expiresAt: DateTime.now().add(const Duration(hours: 1)),
    );

    _currentSession = session;
    _notifyListeners(AuthChangeEvent.signedIn, session);

    return AuthResponse(user: user, session: session);
  }

  /// Mock sign in method
  Future<AuthResponse> signInWithPassword({
    required String email,
    required String password,
  }) async {
    debugPrint('Mock signIn: $email');
    await Future.delayed(const Duration(milliseconds: 500));

    // Mock authentication logic - accept any non-empty credentials
    if (email.isEmpty || password.isEmpty) {
      throw const AuthException('Invalid credentials');
    }

    final user = MockUser(
      id: 'mock-user-${email.hashCode}',
      email: email,
      createdAt: DateTime.now(),
    );

    final session = Session(
      user: user,
      accessToken: 'mock-access-token',
      expiresAt: DateTime.now().add(const Duration(hours: 1)),
    );

    _currentSession = session;
    _notifyListeners(AuthChangeEvent.signedIn, session);

    return AuthResponse(user: user, session: session);
  }

  /// Mock sign out method
  Future<void> signOut() async {
    debugPrint('Mock signOut');
    await Future.delayed(const Duration(milliseconds: 200));

    _currentSession = null;
    _notifyListeners(AuthChangeEvent.signedOut, null);
  }

  /// Mock password reset
  Future<void> resetPasswordForEmail(String email) async {
    debugPrint('Mock resetPassword: $email');
    await Future.delayed(const Duration(milliseconds: 300));
    // Mock successful password reset
  }

  void _notifyListeners(AuthChangeEvent event, Session? session) {
    final data = AuthStateChangeData(event: event, session: session);
    for (final listener in _listeners) {
      try {
        listener(data);
      } catch (e) {
        debugPrint('Error in auth listener: $e');
      }
    }
  }
}

/// Mock Supabase table for database operations
class MockSupabaseTable {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  String? _selectQuery;
  Map<String, dynamic>? _updateData;

  MockSupabaseTable(this.tableName);

  MockSupabaseTable select([String? columns]) {
    _selectQuery = columns ?? '*';
    return this;
  }

  MockSupabaseTable eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<Map<String, dynamic>?> maybeSingle() async {
    await Future.delayed(const Duration(milliseconds: 100));
    debugPrint('Mock $tableName.maybeSingle() with filters: $_filters');

    // Return mock data based on table and filters
    if (tableName == 'patients' && _filters['user_id'] != null) {
      return {
        'id': 'mock-patient-${_filters['user_id']}',
        'user_id': _filters['user_id'],
        'email': 'patient@example.com',
        'first_name': 'Mock',
        'last_name': 'Patient',
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };
    } else if (tableName == 'clinics' && _filters['user_id'] != null) {
      return {
        'id': 'mock-clinic-${_filters['user_id']}',
        'user_id': _filters['user_id'],
        'email': 'clinic@example.com',
        'clinic_name': 'Mock Clinic',
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };
    }

    return null; // No matching record
  }

  Future<void> insert(Map<String, dynamic> data) async {
    await Future.delayed(const Duration(milliseconds: 100));
    debugPrint('Mock INSERT into $tableName: $data');
  }

  MockSupabaseTable update(Map<String, dynamic> data) {
    _updateData = data;
    return this;
  }

  Future<void> execute() async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (_updateData != null) {
      debugPrint('Mock UPDATE $tableName with filters $_filters: $_updateData');
    }
  }
}

/// Mock Supabase client
class MockSupabaseClient {
  final MockAuth _auth = MockAuth();

  MockAuth get auth => _auth;

  MockSupabaseTable from(String tableName) => MockSupabaseTable(tableName);
}

/// Mock Supabase instance
class MockSupabase {
  static final MockSupabase _instance = MockSupabase._internal();
  static MockSupabase get instance => _instance;

  MockSupabase._internal();

  MockSupabaseClient get client => MockSupabaseClient();
}

class AuthProvider {
  final MockSupabaseClient _supabase = MockSupabase.instance.client;

  // Listener management
  final List<VoidCallback> _listeners = [];

  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _initializeAuth();
  }

  // Listener management methods
  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void notifyListeners() {
    for (final listener in _listeners) {
      try {
        listener();
      } catch (e) {
        debugPrint('Error in listener: $e');
      }
    }
  }

  void dispose() {
    _listeners.clear();
  }

  Future<void> _initializeAuth() async {
    _setLoading(true);

    try {
      final session = _supabase.auth.currentSession;
      if (session?.user != null) {
        await _fetchUserProfile(session!.user.id);
      }
    } catch (e) {
      _setError('Failed to initialize authentication: ${e.toString()}');
    } finally {
      _setLoading(false);
    }

    // Listen to auth state changes
    _supabase.auth.onAuthStateChange((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      switch (event) {
        case AuthChangeEvent.signedIn:
          if (session?.user != null) {
            _fetchUserProfile(session!.user.id);
          }
          break;
        case AuthChangeEvent.signedOut:
          _clearUser();
          break;
        case AuthChangeEvent.tokenRefreshed:
          // Handle token refresh if needed
          break;
        default:
          break;
      }
    });
  }

  Future<void> signUp({
    required String email,
    required String password,
    required UserRole role,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final AuthResponse response = await _supabase.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user != null) {
        // Create role-specific profile
        if (role == UserRole.patient) {
          await _createPatientProfile(response.user!.id, email);
        } else if (role == UserRole.clinic) {
          await _createClinicProfile(response.user!.id, email);
        }

        await _fetchUserProfile(response.user!.id);
      }
    } on AuthException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Registration failed: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    _setLoading(true);
    _clearError();

    try {
      final AuthResponse response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        await _fetchUserProfile(response.user!.id);
      }
    } on AuthException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Login failed: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    _setLoading(true);
    _clearError();

    try {
      await _supabase.auth.signOut();
      _clearUser();
    } catch (e) {
      _setError('Sign out failed: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> resetPassword(String email) async {
    _setLoading(true);
    _clearError();

    try {
      await _supabase.auth.resetPasswordForEmail(email);
    } on AuthException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError('Password reset failed: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> _fetchUserProfile(String userId) async {
    try {
      // First, try to get patient profile
      final patientResponse = await _supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (patientResponse != null) {
        final patientProfile = PatientProfile.fromJson(patientResponse);
        _user = User(
          id: userId,
          email: patientProfile.email,
          role: UserRole.patient,
          createdAt: patientProfile.createdAt,
          patientProfile: patientProfile,
        );
        notifyListeners();
        return;
      }

      // If no patient profile, try clinic profile
      final clinicResponse = await _supabase
          .from('clinics')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (clinicResponse != null) {
        final clinicProfile = ClinicProfile.fromJson(clinicResponse);
        _user = User(
          id: userId,
          email: clinicProfile.email,
          role: UserRole.clinic,
          createdAt: clinicProfile.createdAt,
          clinicProfile: clinicProfile,
        );
        notifyListeners();
        return;
      }

      throw Exception('No profile found for user');
    } catch (e) {
      _setError('Failed to fetch user profile: ${e.toString()}');
    }
  }

  Future<void> _createPatientProfile(String userId, String email) async {
    await _supabase.from('patients').insert({
      'user_id': userId,
      'email': email,
      'first_name': '',
      'last_name': '',
    });
  }

  Future<void> _createClinicProfile(String userId, String email) async {
    await _supabase.from('clinics').insert({
      'user_id': userId,
      'email': email,
      'clinic_name': '',
    });
  }

  Future<void> updatePatientProfile(PatientProfile profile) async {
    _setLoading(true);
    _clearError();

    try {
      await (_supabase
          .from('patients')
          .update(profile.toJson())
          .eq('id', profile.id)
          .execute());

      if (_user != null) {
        _user = _user!.copyWith(patientProfile: profile);
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to update profile: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateClinicProfile(ClinicProfile profile) async {
    _setLoading(true);
    _clearError();

    try {
      await (_supabase
          .from('clinics')
          .update(profile.toJson())
          .eq('id', profile.id)
          .execute());

      if (_user != null) {
        _user = _user!.copyWith(clinicProfile: profile);
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to update profile: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _clearUser() {
    _user = null;
    notifyListeners();
  }
}

extension on User {
  User copyWith({
    String? id,
    String? email,
    UserRole? role,
    DateTime? createdAt,
    PatientProfile? patientProfile,
    ClinicProfile? clinicProfile,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      patientProfile: patientProfile ?? this.patientProfile,
      clinicProfile: clinicProfile ?? this.clinicProfile,
    );
  }
}
