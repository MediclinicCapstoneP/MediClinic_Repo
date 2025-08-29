/// Supabase Configuration
/// Configure your Supabase connection settings here

import 'environment.dart';

class SupabaseConfig {
  // Use environment configuration for better security
  static String get url => Environment.supabaseUrl;
  static String get anonKey => Environment.supabaseAnonKey;

  // Development fallback values (replace with your actual values)
  static const String developmentUrl = 'https://your-project.supabase.co';
  static const String developmentAnonKey = 'your-anon-key-here';

  // Validation
  static bool get isConfigured =>
      url != 'YOUR_SUPABASE_URL' && anonKey != 'YOUR_SUPABASE_ANON_KEY';

  // Configuration info
  static void logConfiguration() {
    if (Environment.enableLogging) {
      print('=== Supabase Configuration ===');
      print('URL: ${url.substring(0, 20)}...');
      print('Key: ${anonKey.substring(0, 10)}...');
      print('Configured: $isConfigured');
      print('==============================');
    }
  }
}
