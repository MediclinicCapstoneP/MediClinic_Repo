/// Application constants for centralized configuration
/// Contains all constant values used throughout the app

class AppConstants {
  // App Information
  static const String appName = 'IgabayCare';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Healthcare Management Mobile App';

  // API Configuration
  static const int apiTimeoutSeconds = 30;
  static const int maxRetryAttempts = 3;
  static const String apiVersion = 'v1';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Cache Duration
  static const Duration defaultCacheDuration = Duration(hours: 1);
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration longCacheDuration = Duration(days: 1);

  // Animation Durations
  static const Duration fastAnimation = Duration(milliseconds: 200);
  static const Duration normalAnimation = Duration(milliseconds: 300);
  static const Duration slowAnimation = Duration(milliseconds: 500);

  // UI Dimensions
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double extraLargePadding = 32.0;

  static const double defaultBorderRadius = 8.0;
  static const double smallBorderRadius = 4.0;
  static const double largeBorderRadius = 16.0;

  static const double defaultElevation = 2.0;
  static const double mediumElevation = 4.0;
  static const double highElevation = 8.0;

  // Font Sizes
  static const double smallFontSize = 12.0;
  static const double normalFontSize = 14.0;
  static const double mediumFontSize = 16.0;
  static const double largeFontSize = 18.0;
  static const double extraLargeFontSize = 24.0;
  static const double titleFontSize = 32.0;

  // Icon Sizes
  static const double smallIconSize = 16.0;
  static const double normalIconSize = 24.0;
  static const double largeIconSize = 32.0;
  static const double extraLargeIconSize = 48.0;

  // Button Heights
  static const double smallButtonHeight = 32.0;
  static const double normalButtonHeight = 48.0;
  static const double largeButtonHeight = 56.0;

  // Input Field Heights
  static const double inputFieldHeight = 56.0;
  static const double smallInputFieldHeight = 40.0;

  // Maximum Content Width (for tablets/web)
  static const double maxContentWidth = 600.0;

  // Breakpoints
  static const double mobileBreakpoint = 600.0;
  static const double tabletBreakpoint = 900.0;
  static const double desktopBreakpoint = 1200.0;
}

/// Business logic constants
class BusinessConstants {
  // Appointment Booking
  static const int maxAdvanceBookingDays = 90;
  static const int minAdvanceBookingHours = 2;
  static const int defaultAppointmentDurationMinutes = 30;
  static const int maxAppointmentDurationMinutes = 240;

  // Time Slots
  static const String businessStartTime = '09:00';
  static const String businessEndTime = '17:00';
  static const int timeSlotIntervalMinutes = 30;

  // Working Days
  static const List<int> workingDays = [1, 2, 3, 4, 5]; // Mon-Fri

  // Cancellation Policy
  static const int cancellationPolicyHours = 24;
  static const int rescheduleFreeLimitHours = 24;

  // Rating System
  static const double minRating = 1.0;
  static const double maxRating = 5.0;
  static const double defaultRating = 5.0;

  // Review System
  static const int maxReviewTitleLength = 100;
  static const int maxReviewTextLength = 1000;
  static const int minReviewTextLength = 10;

  // Search
  static const int maxSearchResults = 50;
  static const int minSearchQueryLength = 2;
  static const int searchDebounceMilliseconds = 500;

  // File Upload
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];

  // Profile Validation
  static const int minNameLength = 2;
  static const int maxNameLength = 50;
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int maxDescriptionLength = 500;

  // Phone Number
  static const int minPhoneLength = 10;
  static const int maxPhoneLength = 15;

  // Address
  static const int minAddressLength = 5;
  static const int maxAddressLength = 200;

  // License Numbers
  static const int minLicenseLength = 3;
  static const int maxLicenseLength = 20;
}

/// Error messages
class ErrorMessages {
  // Network Errors
  static const String networkError =
      'Network connection error. Please check your internet connection.';
  static const String serverError = 'Server error. Please try again later.';
  static const String timeoutError = 'Request timeout. Please try again.';
  static const String unknownError =
      'An unexpected error occurred. Please try again.';

  // Authentication Errors
  static const String invalidCredentials = 'Invalid email or password.';
  static const String userNotFound = 'User not found.';
  static const String emailAlreadyExists = 'Email already exists.';
  static const String weakPassword = 'Password is too weak.';
  static const String emailNotVerified = 'Please verify your email address.';

  // Validation Errors
  static const String requiredField = 'This field is required.';
  static const String invalidEmail = 'Please enter a valid email address.';
  static const String invalidPhoneNumber = 'Please enter a valid phone number.';
  static const String passwordTooShort =
      'Password must be at least 8 characters long.';
  static const String passwordsDoNotMatch = 'Passwords do not match.';

  // Appointment Errors
  static const String appointmentNotFound = 'Appointment not found.';
  static const String timeSlotUnavailable =
      'Selected time slot is not available.';
  static const String appointmentTooLate =
      'Cannot book appointment. Outside booking window.';
  static const String appointmentTooEarly =
      'Cannot book appointment. Minimum advance notice required.';
  static const String cannotCancelAppointment =
      'Cannot cancel appointment. Cancellation window has passed.';

  // Permission Errors
  static const String noPermission =
      'You do not have permission to perform this action.';
  static const String cameraPermissionDenied = 'Camera permission denied.';
  static const String storagePermissionDenied = 'Storage permission denied.';
  static const String locationPermissionDenied = 'Location permission denied.';

  // File Upload Errors
  static const String fileTooLarge = 'File size exceeds maximum limit.';
  static const String invalidFileType = 'Invalid file type.';
  static const String uploadFailed = 'File upload failed. Please try again.';
}

/// Success messages
class SuccessMessages {
  // Authentication
  static const String loginSuccess = 'Login successful!';
  static const String registrationSuccess = 'Registration successful!';
  static const String passwordChanged = 'Password changed successfully.';
  static const String passwordResetSent = 'Password reset email sent.';

  // Profile
  static const String profileUpdated = 'Profile updated successfully.';
  static const String profileCreated = 'Profile created successfully.';

  // Appointments
  static const String appointmentBooked = 'Appointment booked successfully!';
  static const String appointmentCancelled =
      'Appointment cancelled successfully.';
  static const String appointmentRescheduled =
      'Appointment rescheduled successfully.';
  static const String appointmentCompleted = 'Appointment marked as completed.';

  // Reviews
  static const String reviewSubmitted = 'Review submitted successfully!';
  static const String reviewUpdated = 'Review updated successfully.';
  static const String reviewDeleted = 'Review deleted successfully.';

  // Notifications
  static const String notificationMarkedRead = 'Notification marked as read.';
  static const String allNotificationsMarkedRead =
      'All notifications marked as read.';
  static const String notificationDeleted = 'Notification deleted.';

  // General
  static const String saveSuccess = 'Saved successfully!';
  static const String deleteSuccess = 'Deleted successfully.';
  static const String updateSuccess = 'Updated successfully.';
}

/// App routes/paths
class AppRoutes {
  // Authentication
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';

  // Main Navigation
  static const String home = '/home';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String notifications = '/notifications';

  // Patient Routes
  static const String patientHome = '/patient';
  static const String bookAppointment = '/patient/book-appointment';
  static const String patientAppointments = '/patient/appointments';
  static const String patientProfile = '/patient/profile';
  static const String appointmentDetails = '/patient/appointment-details';
  static const String writeReview = '/patient/write-review';

  // Clinic Routes
  static const String clinicHome = '/clinic';
  static const String clinicAppointments = '/clinic/appointments';
  static const String clinicProfile = '/clinic/profile';
  static const String clinicReviews = '/clinic/reviews';
  static const String clinicDashboard = '/clinic/dashboard';

  // Common Routes
  static const String search = '/search';
  static const String help = '/help';
  static const String about = '/about';
  static const String privacyPolicy = '/privacy-policy';
  static const String termsOfService = '/terms-of-service';
}

/// Storage keys for local storage
class StorageKeys {
  // User Data
  static const String userId = 'user_id';
  static const String userEmail = 'user_email';
  static const String userRole = 'user_role';
  static const String userToken = 'user_token';

  // Settings
  static const String themeMode = 'theme_mode';
  static const String language = 'language';
  static const String notificationsEnabled = 'notifications_enabled';

  // Onboarding
  static const String hasSeenOnboarding = 'has_seen_onboarding';
  static const String firstLaunch = 'first_launch';

  // Cache
  static const String cachedClinics = 'cached_clinics';
  static const String cachedAppointments = 'cached_appointments';
  static const String lastCacheUpdate = 'last_cache_update';

  // Temporary Data
  static const String draftAppointment = 'draft_appointment';
  static const String draftReview = 'draft_review';
}

/// Special values and identifiers
class SpecialValues {
  // Default/Empty Values
  static const String emptyString = '';
  static const String notAvailable = 'N/A';
  static const String comingSoon = 'Coming Soon';
  static const String loading = 'Loading...';

  // Placeholder IDs
  static const String unknownId = 'unknown';
  static const String systemId = 'system';
  static const String guestId = 'guest';

  // Feature Flags
  static const bool enableNotifications = true;
  static const bool enableReviews = true;
  static const bool enableDarkMode = true;
  static const bool enableOfflineMode = false;

  // Environment
  static const String developmentEnv = 'development';
  static const String stagingEnv = 'staging';
  static const String productionEnv = 'production';
}

/// Regular expressions for validation
class RegexPatterns {
  // Email pattern (more comprehensive)
  static const String email =
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

  // Phone number (international format)
  static const String phoneNumber = r'^\+?[1-9]\d{1,14}$';

  // Password (at least 8 chars, 1 upper, 1 lower, 1 digit, 1 special)
  static const String strongPassword =
      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';

  // Name (letters, spaces, hyphens, apostrophes only)
  static const String name = r"^[a-zA-Z\s\-']+$";

  // Numbers only
  static const String numbersOnly = r'^[0-9]+$';

  // Letters only
  static const String lettersOnly = r'^[a-zA-Z]+$';

  // Alphanumeric
  static const String alphanumeric = r'^[a-zA-Z0-9]+$';

  // URL
  static const String url =
      r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$';

  // Time format (HH:MM)
  static const String timeFormat = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$';

  // Date format (YYYY-MM-DD)
  static const String dateFormat = r'^\d{4}-\d{2}-\d{2}$';
}
