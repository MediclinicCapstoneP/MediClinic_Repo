/// Comprehensive validation utilities for forms and data
/// Provides email, password, phone, and other validation functions

import '../interfaces/auth_service_interface.dart';

/// Main validation utility class
class Validators {
  /// Email validation
  static bool isValidEmail(String email) {
    if (email.isEmpty) return false;

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    return emailRegex.hasMatch(email);
  }

  /// Email validator for form fields
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }

    if (!isValidEmail(value)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /// Password validation with comprehensive rules
  static ValidationResult validatePassword(String password) {
    final errors = <String>[];

    if (password.isEmpty) {
      errors.add('Password is required');
      return ValidationResult.invalid(errors);
    }

    if (password.length < 8) {
      errors.add('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.add('Password must be less than 128 characters');
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

    if (errors.isEmpty) {
      return ValidationResult.valid();
    }

    return ValidationResult.invalid(errors);
  }

  /// Password validator for form fields
  static String? validatePasswordField(String? value) {
    final result = validatePassword(value ?? '');

    if (!result.isValid) {
      return result.errors.first; // Return first error for form display
    }

    return null;
  }

  /// Confirm password validation
  static String? validateConfirmPassword(
    String? password,
    String? confirmPassword,
  ) {
    if (confirmPassword == null || confirmPassword.isEmpty) {
      return 'Please confirm your password';
    }

    if (password != confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  }

  /// Phone number validation
  static bool isValidPhoneNumber(String phoneNumber) {
    if (phoneNumber.isEmpty) return false;

    // Remove all non-digit characters
    final digitsOnly = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');

    // Check if it's a valid length (10-15 digits)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return false;
    }

    // Check for basic phone number patterns
    final phoneRegex = RegExp(r'^[\+]?[1-9][\d]{9,14}$');
    return phoneRegex.hasMatch(digitsOnly);
  }

  /// Phone number validator for form fields
  static String? validatePhoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }

    if (!isValidPhoneNumber(value)) {
      return 'Please enter a valid phone number';
    }

    return null;
  }

  /// Required field validation
  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }

    return null;
  }

  /// Name validation (first name, last name)
  static String? validateName(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }

    if (value.trim().length < 2) {
      return '$fieldName must be at least 2 characters long';
    }

    if (value.trim().length > 50) {
      return '$fieldName must be less than 50 characters';
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    if (!RegExp(r"^[a-zA-Z\s\-\']+$").hasMatch(value.trim())) {
      return '$fieldName can only contain letters, spaces, hyphens, and apostrophes';
    }

    return null;
  }

  /// Address validation
  static String? validateAddress(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Address is required';
    }

    if (value.trim().length < 5) {
      return 'Address must be at least 5 characters long';
    }

    if (value.trim().length > 200) {
      return 'Address must be less than 200 characters';
    }

    return null;
  }

  /// Zip code validation
  static String? validateZipCode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'ZIP code is required';
    }

    // US ZIP code pattern (5 digits or 5-4 format)
    if (!RegExp(r'^\d{5}(-\d{4})?$').hasMatch(value.trim())) {
      return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    return null;
  }

  /// License number validation
  static String? validateLicenseNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'License number is required';
    }

    if (value.trim().length < 3) {
      return 'License number must be at least 3 characters long';
    }

    if (value.trim().length > 20) {
      return 'License number must be less than 20 characters';
    }

    return null;
  }

  /// Date of birth validation
  static String? validateDateOfBirth(DateTime? value) {
    if (value == null) {
      return 'Date of birth is required';
    }

    final now = DateTime.now();
    final age = now.year - value.year;

    if (value.isAfter(now)) {
      return 'Date of birth cannot be in the future';
    }

    if (age > 120) {
      return 'Please enter a valid date of birth';
    }

    if (age < 0) {
      return 'You must be at least 0 years old';
    }

    return null;
  }

  /// URL validation
  static String? validateUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // URL is optional in most cases
    }

    try {
      final uri = Uri.parse(value.trim());
      if (!uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
    } catch (e) {
      return 'Please enter a valid URL';
    }

    return null;
  }

  /// Clinic name validation
  static String? validateClinicName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Clinic name is required';
    }

    if (value.trim().length < 2) {
      return 'Clinic name must be at least 2 characters long';
    }

    if (value.trim().length > 100) {
      return 'Clinic name must be less than 100 characters';
    }

    return null;
  }

  /// Description validation
  static String? validateDescription(String? value, {int maxLength = 500}) {
    if (value != null && value.trim().length > maxLength) {
      return 'Description must be less than $maxLength characters';
    }

    return null;
  }

  /// Rating validation (1-5 stars)
  static String? validateRating(double? value) {
    if (value == null) {
      return 'Rating is required';
    }

    if (value < 1 || value > 5) {
      return 'Rating must be between 1 and 5 stars';
    }

    return null;
  }

  /// Age validation
  static String? validateAge(int? value, {int minAge = 0, int maxAge = 120}) {
    if (value == null) {
      return 'Age is required';
    }

    if (value < minAge || value > maxAge) {
      return 'Age must be between $minAge and $maxAge';
    }

    return null;
  }

  /// Blood type validation
  static String? validateBloodType(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Blood type is optional
    }

    final validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    if (!validBloodTypes.contains(value.trim().toUpperCase())) {
      return 'Please select a valid blood type';
    }

    return null;
  }

  /// Insurance policy number validation
  static String? validateInsurancePolicyNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Insurance is optional
    }

    if (value.trim().length < 3) {
      return 'Insurance policy number must be at least 3 characters long';
    }

    if (value.trim().length > 50) {
      return 'Insurance policy number must be less than 50 characters';
    }

    return null;
  }

  /// Validate multiple required fields
  static ValidationResult validateRequiredFields(
    Map<String, dynamic> data,
    List<String> requiredFields,
  ) {
    final errors = <String>[];

    for (final field in requiredFields) {
      final value = data[field];

      if (value == null ||
          (value is String && value.trim().isEmpty) ||
          (value is List && value.isEmpty)) {
        errors.add('${_formatFieldName(field)} is required');
      }
    }

    if (errors.isEmpty) {
      return ValidationResult.valid();
    }

    return ValidationResult.invalid(errors);
  }

  /// Format field name for display
  static String _formatFieldName(String fieldName) {
    return fieldName
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  /// Validate signup data
  static ValidationResult validateSignUpData(Map<String, dynamic> data) {
    final errors = <String>[];

    // Required fields validation
    final requiredFieldsResult = validateRequiredFields(data, [
      'email',
      'password',
      'first_name',
      'last_name',
    ]);

    if (!requiredFieldsResult.isValid) {
      errors.addAll(requiredFieldsResult.errors);
    }

    // Email validation
    final email = data['email'] as String?;
    if (email != null && !isValidEmail(email)) {
      errors.add('Please enter a valid email address');
    }

    // Password validation
    final password = data['password'] as String?;
    if (password != null) {
      final passwordResult = validatePassword(password);
      if (!passwordResult.isValid) {
        errors.addAll(passwordResult.errors);
      }
    }

    if (errors.isEmpty) {
      return ValidationResult.valid();
    }

    return ValidationResult.invalid(errors);
  }

  /// Custom validator builder
  static String? Function(String?) customValidator({
    required bool Function(String) condition,
    required String errorMessage,
    bool allowEmpty = false,
  }) {
    return (String? value) {
      if (allowEmpty && (value == null || value.isEmpty)) {
        return null;
      }

      if (value == null || value.isEmpty) {
        return 'This field is required';
      }

      if (!condition(value)) {
        return errorMessage;
      }

      return null;
    };
  }
}
