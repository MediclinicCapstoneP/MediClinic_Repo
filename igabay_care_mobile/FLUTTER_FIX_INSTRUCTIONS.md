# Flutter Environment Fix Instructions

## Problem
The IgabayCare mobile app is experiencing import errors for fundamental Flutter packages:
- `package:flutter/material.dart`
- `package:go_router/go_router.dart`
- `package:provider/provider.dart`

This indicates that Flutter is not properly installed or configured on your system.

## Solution Options

### Option 1: Install/Reinstall Flutter (Recommended)

1. **Download Flutter SDK**
   - Visit https://flutter.dev/docs/get-started/install
   - Download the appropriate version for your operating system

2. **Extract Flutter SDK**
   - Extract to a location like `C:\flutter` (Windows) or `~/development/flutter` (macOS/Linux)

3. **Update PATH Environment Variable**
   - Add Flutter to your PATH:
     - Windows: Add `C:\flutter\bin` to your PATH
     - macOS/Linux: Add `export PATH="$PATH:[PATH_TO_FLUTTER]/flutter/bin"` to your shell config

4. **Verify Installation**
   ```bash
   flutter --version
   ```

5. **Run Flutter Doctor**
   ```bash
   flutter doctor
   ```
   - Follow any additional setup instructions

6. **Install Dependencies**
   ```bash
   cd igabay_care_mobile
   flutter pub get
   ```

### Option 2: Use the Custom Implementation (Temporary Solution)

The project includes custom implementations that replace the missing Flutter packages:
- `core/custom_flutter/custom_flutter.dart` - Replaces Flutter Material
- `core/router/app_router.dart` - Replaces GoRouter
- `core/providers/auth_provider.dart` - Replaces Provider

These custom implementations allow the app to run even without the actual Flutter packages.

## Running the Fix Script

1. Run the provided fix script:
   ```bash
   run_flutter_fix.bat
   ```

2. If Flutter is properly installed, this script will:
   - Clean the project
   - Repair the package cache
   - Install dependencies
   - Run analysis

## IDE Configuration

### For Qoder IDE:
1. Check Flutter SDK path in IDE settings
2. Verify Dart plugin is enabled
3. Restart analysis server (if option available)
4. Clear IDE cache and restart

### For VS Code:
1. Install Flutter/Dart extensions
2. Open project in VS Code
3. Press Ctrl+Shift+P → "Dart: Restart Analysis Server"
4. Press Ctrl+Shift+P → "Flutter: Reload"

### For Android Studio:
1. Install Flutter/Dart plugins
2. Open project in Android Studio
3. Tools → Flutter → Restart Analysis Server

## Testing the Fix

1. Run the diagnostic tool:
   ```bash
   diagnose_environment.bat
   ```

2. Try running a minimal test:
   ```bash
   flutter run --debug lib/main.dart
   ```

## If Issues Persist

1. **Flutter SDK corrupted**: Reinstall Flutter
2. **PATH issues**: Flutter not in system PATH
3. **IDE-specific bug**: Try different IDE or command line
4. **Permissions**: Run as administrator (Windows)

## Verification

Once fixed, you should be able to run:
```bash
flutter analyze lib/core/router/app_router.dart
```

And see no import errors in your IDE.