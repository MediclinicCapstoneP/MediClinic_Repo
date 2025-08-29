// Import Verification Test
// This file tests if all required Flutter packages are properly installed

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

void main() {
  print('=== IgabayCare Import Verification ===');
  print('Testing Flutter package imports...\n');

  try {
    // Test Flutter Material imports
    print('✅ Flutter Material: ${MaterialApp}');

    // Test Provider imports
    print('✅ Provider: ${ChangeNotifierProvider}');

    // Test Supabase imports
    print('✅ Supabase: ${Supabase}');

    // Test GoRouter imports
    print('✅ GoRouter: ${GoRouter}');

    // Test Google Fonts imports
    print('✅ Google Fonts: ${GoogleFonts}');

    // Test Intl imports
    final formatter = DateFormat('yyyy-MM-dd');
    print('✅ Intl: ${formatter.runtimeType}');

    print('\n🎉 All imports successful!');
    print('Flutter dependencies are properly installed.\n');

    // Test basic widget creation
    const testWidget = MaterialApp(home: Text('Import test successful'));

    print('✅ Widget creation test passed');
  } catch (e) {
    print('❌ Import verification failed: $e');
    print(
      '\nThis indicates that Flutter dependencies are not properly installed.',
    );
    print('Please run the fix script or follow manual installation steps.');
  }
}

/// Test class for Provider functionality
class TestNotifier extends ChangeNotifier {
  String _message = 'Dependencies working correctly';

  String get message => _message;

  void updateMessage(String newMessage) {
    _message = newMessage;
    notifyListeners();
  }
}

/// Test function for date formatting
String formatTestDate() {
  final now = DateTime.now();
  final formatter = DateFormat('EEEE, MMMM d, yyyy');
  return formatter.format(now);
}

/// Instructions for running this test
/// 
/// To verify your Flutter dependencies:
/// 1. Open terminal in the project root
/// 2. Run: dart lib/core/utils/import_verification.dart
/// 3. Check the output for any errors
/// 
/// If you see "All imports successful", your dependencies are working.
/// If you see any errors, run the fix_dependencies.bat script.