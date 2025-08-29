/// Abstract interfaces for authentication services following SOLID principles
/// Interface Segregation Principle: Split large interfaces into smaller, focused ones

import '../models/user.dart';

/// Common result type for all operations
class ServiceResult<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? code;

  const ServiceResult({
    required this.success,
    this.data,
    this.error,
    this.code,
  });

  ServiceResult.success(this.data) : success = true, error = null, code = null;

  ServiceResult.failure(this.error, [this.code]) : success = false, data = null;
}

/// Authentication data interfaces
class SignInCredentials {
  final String email;
  final String password;

  const SignInCredentials({required this.email, required this.password});
}

class SignUpData {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final UserRole role;
  final String? clinicName;
  final String? specialization;

  const SignUpData({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.clinicName,
    this.specialization,
  });
}

/// Segregated authentication interfaces
abstract class IAuthenticationService {
  Future<ServiceResult<User>> signIn(SignInCredentials credentials);
  Future<ServiceResult<void>> signOut();
  Future<ServiceResult<User>> getCurrentUser();
  Future<bool> isAuthenticated();
}

abstract class IUserRegistrationService {
  Future<ServiceResult<User>> registerUser(SignUpData data);
  Future<ServiceResult<void>> verifyEmail(String token);
  Future<ServiceResult<void>> resendVerification(String email);
}

abstract class IPasswordService {
  Future<ServiceResult<void>> resetPassword(String email);
  Future<ServiceResult<void>> changePassword(
    String oldPassword,
    String newPassword,
  );
  ValidationResult validatePassword(String password);
}

abstract class IProfileService<T> {
  Future<ServiceResult<T>> getProfile(String userId);
  Future<ServiceResult<T>> updateProfile(
    String userId,
    Map<String, dynamic> data,
  );
  Future<ServiceResult<void>> deleteProfile(String userId);
}

/// Validation result class
class ValidationResult {
  final bool isValid;
  final List<String> errors;

  const ValidationResult({required this.isValid, required this.errors});

  ValidationResult.valid() : isValid = true, errors = const [];
  ValidationResult.invalid(this.errors) : isValid = false;
}

abstract class IValidationService {
  bool validateEmail(String email);
  ValidationResult validatePassword(String password);
  ValidationResult validateSignUpData(SignUpData data);
  ValidationResult validateRequiredFields(
    Map<String, dynamic> data,
    List<String> requiredFields,
  );
}

/// Role-based access control interfaces
abstract class IRoleService {
  Future<ServiceResult<String>> getUserRole(String userId);
  Future<bool> hasPermission(String userId, String permission);
  Future<ServiceResult<void>> assignRole(String userId, String role);
}

/// Token management interface
abstract class ITokenService {
  void setToken(String token);
  String? getToken();
  void removeToken();
  bool isTokenValid(String token);
  Future<ServiceResult<String>> refreshToken();
}

/// Session management interface
abstract class ISessionService {
  Future<ServiceResult<String>> createSession(User user);
  Future<ServiceResult<User>> validateSession(String sessionId);
  Future<ServiceResult<void>> destroySession(String sessionId);
  Future<ServiceResult<String>> refreshSession(String sessionId);
}
