/// Environment Configuration
/// Manages environment-specific settings and feature flags

class Environment {
  // Environment type
  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );

  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'YOUR_SUPABASE_URL',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'YOUR_SUPABASE_ANON_KEY',
  );

  // Google Maps API
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: 'YOUR_GOOGLE_MAPS_API_KEY',
  );

  // App Configuration
  static const String appName = 'IgabayCare';
  static const String appVersion = '1.0.0';

  // Feature Flags
  static const bool enableNotifications = bool.fromEnvironment(
    'ENABLE_NOTIFICATIONS',
    defaultValue: true,
  );

  static const bool enableReviews = bool.fromEnvironment(
    'ENABLE_REVIEWS',
    defaultValue: true,
  );

  static const bool enableMaps = bool.fromEnvironment(
    'ENABLE_MAPS',
    defaultValue: true,
  );

  static const bool enableOfflineMode = bool.fromEnvironment(
    'ENABLE_OFFLINE_MODE',
    defaultValue: false,
  );

  // Debug Settings
  static const bool enableLogging = bool.fromEnvironment(
    'ENABLE_LOGGING',
    defaultValue: true,
  );

  static const bool enableDebugMode = bool.fromEnvironment(
    'DEBUG_MODE',
    defaultValue: true,
  );

  // API Configuration
  static const int apiTimeout = int.fromEnvironment(
    'API_TIMEOUT',
    defaultValue: 30,
  );

  static const int maxRetries = int.fromEnvironment(
    'MAX_RETRIES',
    defaultValue: 3,
  );

  // Environment Helpers
  static bool get isDevelopment => environment == 'development';
  static bool get isStaging => environment == 'staging';
  static bool get isProduction => environment == 'production';

  // Validation
  static bool get isConfigured =>
      supabaseUrl != 'YOUR_SUPABASE_URL' &&
      supabaseAnonKey != 'YOUR_SUPABASE_ANON_KEY';

  // Environment-specific settings
  static String get baseUrl {
    switch (environment) {
      case 'production':
        return 'https://your-prod-supabase.supabase.co';
      case 'staging':
        return 'https://your-staging-supabase.supabase.co';
      default:
        return supabaseUrl;
    }
  }

  // Log configuration details (for debugging)
  static void logConfiguration() {
    if (enableLogging) {
      print('=== Environment Configuration ===');
      print('Environment: $environment');
      print('App Name: $appName');
      print('App Version: $appVersion');
      print('Base URL: $baseUrl');
      print('Configured: $isConfigured');
      print('Features:');
      print('  Notifications: $enableNotifications');
      print('  Reviews: $enableReviews');
      print('  Maps: $enableMaps');
      print('  Offline Mode: $enableOfflineMode');
      print('  Debug Mode: $enableDebugMode');
      print('================================');
    }
  }
}

/// App Configuration helper
class AppConfig {
  static bool get isProduction => Environment.isProduction;
  static String get baseUrl => Environment.baseUrl;
  static bool get enableLogging => Environment.enableLogging && !isProduction;

  // Cache configuration
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration mediumCacheDuration = Duration(hours: 1);
  static const Duration longCacheDuration = Duration(days: 1);

  // UI Configuration
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration shortAnimationDuration = Duration(milliseconds: 150);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);

  // Business Logic Configuration
  static const int defaultPageSize = 20;
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
}
