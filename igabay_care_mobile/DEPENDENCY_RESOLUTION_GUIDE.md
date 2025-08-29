# Flutter Dependency Resolution Guide

## Current Issue: Core Flutter Packages Not Found

You're experiencing import errors for fundamental Flutter packages:
- `package:flutter/material.dart`
- `package:go_router/go_router.dart`
- `package:provider/provider.dart`

## Diagnosis

The `pubspec.yaml` contains all correct dependencies, but the Flutter environment is not resolving packages properly. This indicates an SDK or environment configuration issue.

## Manual Resolution Steps

### Step 1: Verify Flutter Installation
```bash
flutter doctor -v
```
Look for:
- ✓ Flutter SDK installed correctly
- ✓ Dart SDK path accessible
- ✓ IDE plugins detected

### Step 2: Check Flutter SDK Path
```bash
where flutter        # Windows
which flutter        # macOS/Linux
```

### Step 3: Force Clean Dependency Resolution
```bash
# Navigate to project directory
cd "c:\Users\Ariane\Documents\CapstoneProject\MediClinic_Repo\igabay_care_mobile"

# Complete clean rebuild
flutter clean
rm pubspec.lock          # Windows: del pubspec.lock
rm -rf .dart_tool        # Windows: rmdir /s .dart_tool

# Repair package cache
flutter pub cache repair

# Fresh dependency installation
flutter pub get

# Verify dependencies
flutter pub deps --style=compact
```

### Step 4: IDE Configuration

#### For Qoder IDE:
1. Check Flutter SDK path in IDE settings
2. Verify Dart plugin is enabled
3. Restart analysis server (if option available)
4. Clear IDE cache and restart

#### Alternative: Test in VS Code
1. Install Flutter/Dart extensions
2. Open project in VS Code
3. Press Ctrl+Shift+P → "Dart: Restart Analysis Server"
4. Press Ctrl+Shift+P → "Flutter: Reload"

### Step 5: Create Minimal Test

Create `minimal_test.dart`:
```dart
import 'package:flutter/material.dart';

void main() => runApp(
  MaterialApp(
    home: Scaffold(
      body: Center(child: Text('Flutter Working!')),
    ),
  ),
);
```

Run: `flutter run --debug minimal_test.dart`

If this works, it's purely an IDE issue.

### Step 6: Environment Variables (Windows)

Check if these are set:
```cmd
echo %FLUTTER_ROOT%
echo %PATH%
```

Flutter should be in your PATH.

## Expected Results After Fix

1. `pubspec.lock` file should be created
2. `.dart_tool` directory should exist
3. No import errors in IDE
4. `flutter analyze` should pass

## If Still Not Working

The issue might be:
1. **Flutter SDK corrupted**: Reinstall Flutter
2. **PATH issues**: Flutter not in system PATH
3. **IDE-specific bug**: Try different IDE or command line
4. **Permissions**: Run as administrator (Windows)

## Verification Command

Once fixed, this should work:
```bash
flutter analyze lib/core/router/app_router.dart
```

## Alternative Solution

If environment issues persist, we can temporarily replace problematic imports with alternative implementations or use dart:ui instead of material.dart for basic functionality.