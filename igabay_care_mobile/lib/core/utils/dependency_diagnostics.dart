/// Dependency Diagnosis and Fix Utility
/// Helps identify and resolve Flutter package dependency issues

import 'dart:io';

void main() async {
  print('=== IgabayCare Flutter Dependency Diagnosis ===\n');

  await checkFlutterInstallation();
  await checkPubspecYaml();
  await checkDependencies();
  await provideSolutions();
}

Future<void> checkFlutterInstallation() async {
  print('1. Checking Flutter Installation...');

  try {
    final result = await Process.run('flutter', ['--version']);

    if (result.exitCode == 0) {
      print('✅ Flutter is installed');
      print('Version: ${result.stdout.toString().split('\n')[0]}');
    } else {
      print('❌ Flutter not found or not working properly');
      print('Error: ${result.stderr}');
    }
  } catch (e) {
    print('❌ Failed to check Flutter installation: $e');
    print('Make sure Flutter is in your PATH');
  }

  print('');
}

Future<void> checkPubspecYaml() async {
  print('2. Checking pubspec.yaml...');

  final pubspecFile = File('pubspec.yaml');

  if (!pubspecFile.existsSync()) {
    print('❌ pubspec.yaml not found');
    return;
  }

  print('✅ pubspec.yaml exists');

  final content = await pubspecFile.readAsString();
  final requiredPackages = [
    'flutter:',
    'supabase_flutter:',
    'provider:',
    'go_router:',
    'google_fonts:',
    'intl:',
  ];

  print('Checking required packages:');
  for (final package in requiredPackages) {
    if (content.contains(package)) {
      print('  ✅ $package found');
    } else {
      print('  ❌ $package missing');
    }
  }

  print('');
}

Future<void> checkDependencies() async {
  print('3. Checking dependency installation...');

  final pubspecLock = File('pubspec.lock');
  final packagesDir = Directory('.dart_tool/package_config.json');

  if (!pubspecLock.existsSync()) {
    print('❌ pubspec.lock not found - dependencies not installed');
  } else {
    print('✅ pubspec.lock exists');
  }

  if (!packagesDir.existsSync()) {
    print('❌ Package configuration not found');
  } else {
    print('✅ Package configuration exists');
  }

  // Check common package imports
  final importTests = [
    'package:flutter/material.dart',
    'package:provider/provider.dart',
    'package:supabase_flutter/supabase_flutter.dart',
    'package:go_router/go_router.dart',
  ];

  print('\nTesting package availability:');
  for (final import in importTests) {
    // This is a simulation - in real Dart we'd need to use dart:mirrors
    // or compile-time checks
    print('  📦 $import - Need to verify manually');
  }

  print('');
}

Future<void> provideSolutions() async {
  print('4. Recommended Solutions:\n');

  print('🔧 SOLUTION 1: Complete Clean Install');
  print('   Run the following commands in order:');
  print('   1. flutter clean');
  print('   2. rm pubspec.lock (or del pubspec.lock on Windows)');
  print('   3. flutter pub get');
  print('   4. Restart your IDE\n');

  print('🔧 SOLUTION 2: Flutter Doctor Check');
  print('   1. Run: flutter doctor');
  print('   2. Fix any issues shown');
  print('   3. Ensure all checkmarks are green\n');

  print('🔧 SOLUTION 3: IDE-Specific Fixes');
  print('   VS Code:');
  print('   - Press Ctrl+Shift+P');
  print('   - Run "Flutter: Reload"');
  print('   - Run "Dart: Restart Analysis Server"');
  print('');
  print('   Android Studio:');
  print('   - File > Invalidate Caches and Restart');
  print('   - Tools > Flutter > Flutter Clean');
  print('   - Tools > Flutter > Flutter Packages Get\n');

  print('🔧 SOLUTION 4: Manual Verification');
  print('   1. Open terminal in project root');
  print('   2. Run: flutter pub deps');
  print('   3. Check for any conflict messages');
  print('   4. Run: flutter analyze');
  print('   5. Fix any analysis errors\n');

  print('🔧 SOLUTION 5: Environment Check');
  print('   1. Verify Flutter is in PATH');
  print('   2. Check FLUTTER_ROOT environment variable');
  print('   3. Ensure no proxy/firewall blocking package downloads');
  print('   4. Try: flutter pub cache repair\n');

  print('📱 Test Command:');
  print('   flutter test --no-sound-null-safety test/widget_test.dart');
  print('   (if test file exists)\n');

  print('🚀 Quick Fix Script Available:');
  print('   Run: fix_dependencies.bat');
  print('   (Windows batch file in project root)\n');
}

/// Manual package verification
void verifyPackageImports() {
  print('=== Manual Import Verification ===\n');

  final testImports = '''
// Test file - create as test/import_test.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

void main() {
  // This file should compile without errors if dependencies are properly installed
  print('All imports successful!');
  
  // Test basic Flutter widgets
  const widget = MaterialApp(home: Text('Test'));
  
  // Test Provider
  final provider = ChangeNotifierProvider(
    create: (_) => TestProvider(),
    child: const Text('Test'),
  );
  
  print('Dependencies verification complete');
}

class TestProvider extends ChangeNotifier {
  void test() {
    notifyListeners();
  }
}
''';

  print('Create this test file to verify imports:');
  print(testImports);

  print('\nThen run: dart test/import_test.dart');
  print('If it runs without errors, dependencies are properly installed.');
}
