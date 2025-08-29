# IDE Configuration Checker for Flutter Dependencies

## 🎯 IDE-Specific Solutions for Flutter Import Issues

### Problem: "Target of URI doesn't exist" for Flutter packages
This typically indicates IDE analysis server issues rather than actual dependency problems.

## 🔧 Solution by IDE

### VS Code
```json
// .vscode/settings.json
{
    "dart.flutterSdkPath": "C:\\flutter",  // Update to your Flutter path
    "dart.analyzeAngularTemplates": false,
    "dart.lineLength": 80,
    "dart.showIgnoreQuickFixes": true,
    "dart.previewFlutterUiGuides": true,
    "dart.enableSnippets": true,
    "dart.debugExternalLibraries": false,
    "dart.debugSdkLibraries": false,
    "files.exclude": {
        "**/.dart_tool": true,
        "**/.packages": true,
        "**/build": true
    }
}
```

**VS Code Commands to Fix:**
1. `Ctrl+Shift+P` → `Dart: Restart Analysis Server`
2. `Ctrl+Shift+P` → `Flutter: Reload`
3. `Ctrl+Shift+P` → `Developer: Reload Window`

### Android Studio / IntelliJ IDEA

**Settings to Check:**
1. `File → Settings → Languages & Frameworks → Flutter`
   - Flutter SDK path: `C:\flutter` (or your path)
   - Check "Enable Flutter"

2. `File → Settings → Languages & Frameworks → Dart`
   - Dart SDK path: `C:\flutter\bin\cache\dart-sdk`
   - Check "Enable Dart"

**Fixes for Android Studio:**
1. `File → Invalidate Caches and Restart`
2. `Tools → Flutter → Flutter Clean`
3. `Tools → Flutter → Flutter Packages Get`
4. Restart Android Studio

### Qoder IDE (Your Current IDE)

Since you're using Qoder IDE 0.1.17, the issue might be:

1. **Flutter SDK Path Configuration:**
   - Check if Qoder IDE has Flutter SDK configured
   - Verify the path points to your Flutter installation
   - Ensure Dart plugin is enabled

2. **Analysis Server:**
   - Look for "Dart Analysis Server" restart option
   - Clear analysis cache if available
   - Restart the IDE completely

3. **Project Settings:**
   - Check if the project is recognized as a Flutter project
   - Verify workspace settings include Flutter configuration

## 🛠️ Universal IDE Fixes

### Step 1: Verify Flutter Installation
```bash
# Check Flutter is working
flutter doctor -v

# Verify Flutter can see packages
flutter pub deps
```

### Step 2: Clean and Reinstall
```bash
# In project directory
flutter clean
rm pubspec.lock  # or 'del pubspec.lock' on Windows
flutter pub get
```

### Step 3: IDE Reset
1. Close IDE completely
2. Clear IDE cache/settings (if option available)
3. Restart IDE
4. Reopen project
5. Wait for indexing/analysis to complete

### Step 4: Manual Package Verification
Create this test file: `test_imports.dart`
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  print('Imports working: ${MaterialApp}');
}
```

Run: `dart test_imports.dart`

If this works but IDE still shows errors, it's purely an IDE issue.

## 🔍 Debugging Steps

### Check 1: Flutter SDK Recognition
```bash
where flutter  # Windows
which flutter  # macOS/Linux
```

### Check 2: Package Resolution
```bash
flutter pub deps --style=compact
```

### Check 3: Analysis Issues
```bash
flutter analyze --verbose
```

### Check 4: IDE Logs
Look for IDE logs mentioning:
- "Analysis server"
- "Flutter SDK"
- "Dart SDK"
- "Package resolution"

## 🎯 Quick Test

Create and run this minimal test:

```dart
// minimal_test.dart
import 'package:flutter/material.dart';

void main() => runApp(
  MaterialApp(
    home: Scaffold(
      appBar: AppBar(title: Text('Test')),
      body: Center(child: Text('Dependencies Working!')),
    ),
  ),
);
```

Run: `flutter run --debug minimal_test.dart`

If this works, your Flutter setup is fine and it's purely an IDE configuration issue.

## 📱 For Your Specific Setup

Based on your error pattern, try this sequence:

1. **Run the diagnostic script:**
   ```
   diagnose_environment.bat
   ```

2. **If dependencies are installed but IDE shows errors:**
   - Look for Flutter/Dart plugin settings in Qoder IDE
   - Check for analysis server restart option
   - Try opening the project in VS Code temporarily to verify

3. **Nuclear option (if nothing else works):**
   ```bash
   flutter clean
   rm -rf .dart_tool
   rm pubspec.lock
   flutter pub get
   # Restart IDE
   ```

## 🔄 IDE-Specific Configuration Files

### VS Code
- `.vscode/settings.json` (shown above)
- `.vscode/launch.json` for debugging

### Android Studio
- `.idea/` folder contains project settings
- `android/local.properties` for SDK paths

### General
- `analysis_options.yaml` for Dart analysis rules
- `pubspec.yaml` for dependencies

The key is ensuring your IDE recognizes the Flutter project structure and has the correct SDK paths configured.