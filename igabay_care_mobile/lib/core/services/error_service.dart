/// Error Handling Service
/// Provides consistent error handling and user-friendly error messages
///
/// This file provides error handling services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:flutter/foundation.dart (replaced with custom kDebugMode)
/// - package:supabase_flutter/supabase_flutter.dart (replaced with custom exception classes)
///
/// The custom implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:flutter/foundation.dart'; // Replaced with custom kDebugMode
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with custom exception classes

/// Debug mode constant replacement for Flutter foundation
const bool kDebugMode = true; // Set to false for production builds

/// Mock Auth Exception
class AuthException implements Exception {
  final String message;
  final String? statusCode;

  const AuthException(this.message, {this.statusCode});

  @override
  String toString() => 'AuthException: $message';
}

/// Mock Postgrest Exception
class PostgrestException implements Exception {
  final String message;
  final String? code;

  const PostgrestException({required this.message, this.code});

  @override
  String toString() => 'PostgrestException: $message';
}

/// Mock Storage Exception
class StorageException implements Exception {
  final String message;
  final String? statusCode;

  const StorageException(this.message, {this.statusCode});

  @override
  String toString() => 'StorageException: $message';
}

/// Central error handling service
class ErrorHandlingService {
  static final ErrorHandlingService _instance =
      ErrorHandlingService._internal();
  factory ErrorHandlingService() => _instance;
  ErrorHandlingService._internal();

  /// Handle and format errors for user display
  String getErrorMessage(dynamic error) {
    if (error is AuthException) {
      return _handleAuthError(error);
    } else if (error is PostgrestException) {
      return _handleDatabaseError(error);
    } else if (error is StorageException) {
      return _handleStorageError(error);
    } else if (error is Exception) {
      return _handleGenericException(error);
    } else {
      return _handleUnknownError(error);
    }
  }

  /// Get error code for logging/debugging
  String getErrorCode(dynamic error) {
    if (error is AuthException) {
      return error.statusCode ?? 'AUTH_ERROR';
    } else if (error is PostgrestException) {
      return error.code ?? 'DB_ERROR';
    } else if (error is StorageException) {
      return error.statusCode ?? 'STORAGE_ERROR';
    } else {
      return 'UNKNOWN_ERROR';
    }
  }

  /// Log error for debugging (only in debug mode)
  void logError(dynamic error, {String? context, StackTrace? stackTrace}) {
    if (kDebugMode) {
      print('=== ERROR LOG ===');
      if (context != null) {
        print('Context: $context');
      }
      print('Error: $error');
      print('Code: ${getErrorCode(error)}');
      print('Message: ${getErrorMessage(error)}');
      if (stackTrace != null) {
        print('Stack Trace: $stackTrace');
      }
      print('================');
    }
  }

  /// Handle authentication errors
  String _handleAuthError(AuthException error) {
    switch (error.statusCode) {
      case '400':
        if (error.message.contains('Invalid login credentials')) {
          return 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.contains('Password should be at least')) {
          return 'Password must be at least 6 characters long.';
        } else if (error.message.contains('Unable to validate email address')) {
          return 'Please enter a valid email address.';
        }
        return 'Invalid request. Please check your input and try again.';

      case '422':
        if (error.message.contains('User already registered')) {
          return 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.contains('Email not confirmed')) {
          return 'Please check your email and click the confirmation link before signing in.';
        }
        return 'Account creation failed. Please try again.';

      case '429':
        return 'Too many requests. Please wait a moment and try again.';

      case '500':
        return 'Server error. Please try again later.';

      default:
        return error.message.isNotEmpty
            ? error.message
            : 'Authentication failed. Please try again.';
    }
  }

  /// Handle database errors
  String _handleDatabaseError(PostgrestException error) {
    switch (error.code) {
      case 'PGRST116':
        return 'Record not found.';

      case '23505':
        return 'This information is already in use. Please use different details.';

      case '23503':
        return 'Cannot complete action due to related data constraints.';

      case '42501':
        return 'You do not have permission to perform this action.';

      case '42601':
        return 'Invalid request format.';

      default:
        if (error.message.contains('row-level security')) {
          return 'Access denied. You do not have permission to view this data.';
        } else if (error.message.contains('duplicate key')) {
          return 'This information already exists. Please use different details.';
        } else if (error.message.contains('violates foreign key')) {
          return 'Cannot complete action due to related data.';
        }
        return 'Database error occurred. Please try again.';
    }
  }

  /// Handle storage errors
  String _handleStorageError(StorageException error) {
    switch (error.statusCode) {
      case '400':
        return 'Invalid file. Please check the file format and try again.';

      case '413':
        return 'File is too large. Please choose a smaller file.';

      case '415':
        return 'File type not supported. Please choose a different file format.';

      default:
        return 'File upload failed. Please try again.';
    }
  }

  /// Handle generic exceptions
  String _handleGenericException(Exception error) {
    final errorString = error.toString();

    if (errorString.contains('SocketException') ||
        errorString.contains('NetworkException')) {
      return 'No internet connection. Please check your network and try again.';
    } else if (errorString.contains('TimeoutException')) {
      return 'Request timed out. Please check your connection and try again.';
    } else if (errorString.contains('FormatException')) {
      return 'Invalid data format received. Please try again.';
    } else if (errorString.contains('HttpException')) {
      return 'Network error occurred. Please try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /// Handle unknown errors
  String _handleUnknownError(dynamic error) {
    return 'An unexpected error occurred. Please try again.';
  }

  /// Check if error is recoverable (user can retry)
  bool isRecoverableError(dynamic error) {
    if (error is AuthException) {
      // These auth errors are typically not recoverable
      final nonRecoverableCodes = ['422']; // User already exists, etc.
      return !nonRecoverableCodes.contains(error.statusCode);
    } else if (error is PostgrestException) {
      // These database errors are typically not recoverable
      final nonRecoverableCodes = [
        '23505',
        '42501',
      ]; // Duplicate key, permission denied
      return !nonRecoverableCodes.contains(error.code);
    }

    // Most other errors are potentially recoverable
    return true;
  }

  /// Get user-friendly action suggestion
  String getActionSuggestion(dynamic error) {
    if (error is AuthException) {
      switch (error.statusCode) {
        case '400':
          return 'Please check your input and try again.';
        case '422':
          if (error.message.contains('User already registered')) {
            return 'Try signing in instead of creating a new account.';
          } else if (error.message.contains('Email not confirmed')) {
            return 'Check your email for a confirmation link.';
          }
          return 'Please verify your information and try again.';
        case '429':
          return 'Please wait a few minutes before trying again.';
        default:
          return 'Please try again or contact support if the problem persists.';
      }
    } else if (error is PostgrestException) {
      if (error.code == '42501') {
        return 'Please ensure you are signed in with the correct account.';
      } else if (error.code == '23505') {
        return 'Please use different information or update existing records.';
      }
      return 'Please try again or contact support if the problem persists.';
    }

    return 'Please try again. If the problem persists, contact support.';
  }
}

/// Error categories for classification
enum ErrorCategory {
  authentication,
  authorization,
  validation,
  network,
  database,
  storage,
  unknown,
}

/// Classify error into categories
ErrorCategory classifyError(dynamic error) {
  if (error is AuthException) {
    if (error.statusCode == '42501' ||
        error.message.contains('permission') ||
        error.message.contains('unauthorized')) {
      return ErrorCategory.authorization;
    }
    return ErrorCategory.authentication;
  } else if (error is PostgrestException) {
    if (error.code == '42501') {
      return ErrorCategory.authorization;
    } else if (error.code?.startsWith('23') == true) {
      return ErrorCategory.validation;
    }
    return ErrorCategory.database;
  } else if (error is StorageException) {
    return ErrorCategory.storage;
  } else if (error.toString().contains('SocketException') ||
      error.toString().contains('NetworkException') ||
      error.toString().contains('TimeoutException')) {
    return ErrorCategory.network;
  }

  return ErrorCategory.unknown;
}
