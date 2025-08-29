# Flutter Dependency Resolution Guide

## 🚨 Current Issue
The Flutter project is showing "Target of URI doesn't exist" errors for all package imports, indicating that Flutter dependencies are not properly installed or recognized by the IDE.

## 📊 Diagnostic Summary
- ❌ Flutter packages not recognized
- ❌ Import statements failing
- ❌ IDE not detecting installed dependencies
- ⚠️ This is typically an environment/installation issue rather than a code issue

## 🔧 Solution Steps (In Order)

### Step 1: Verify Flutter Installation
```bash
flutter doctor -v
```
**Expected:** All checkmarks should be green. Fix any issues shown.

### Step 2: Check Flutter Environment
```bash
# Check Flutter is in PATH
flutter --version

# Check Dart is working
dart --version

# Verify Flutter directory structure
where flutter  # On Windows
which flutter  # On macOS/Linux
```

### Step 3: Clean and Reinstall Dependencies
```bash
# Navigate to project directory
cd c:\Users\Ariane\Documents\CapstoneProject\MediClinic_Repo\igabay_care_mobile

# Clean all build artifacts
flutter clean

# Remove lock file
del pubspec.lock  # Windows
rm pubspec.lock   # macOS/Linux

# Repair Flutter package cache
flutter pub cache repair

# Get dependencies with verbose output
flutter pub get --verbose

# Run dependency tree analysis
flutter pub deps
```

### Step 4: IDE-Specific Fixes

#### For VS Code:
1. Press `Ctrl+Shift+P`
2. Run `Flutter: Reload`
3. Run `Dart: Restart Analysis Server`
4. Close and reopen the project
5. Restart VS Code completely

#### For Android Studio:
1. `File > Invalidate Caches and Restart`
2. `Tools > Flutter > Flutter Clean`
3. `Tools > Flutter > Flutter Packages Get`
4. Restart Android Studio

#### For IntelliJ IDEA:
1. `File > Invalidate Caches and Restart`
2. `Tools > Dart > Reload Analysis Server`

### Step 5: Manual Verification
```bash
# Test basic Flutter command
flutter analyze

# Create and test a minimal Flutter app
flutter create test_app
cd test_app
flutter run --debug
```

### Step 6: Environment Variables Check
Ensure these environment variables are set:

**Windows:**
```cmd
# Check if FLUTTER_ROOT is set
echo %FLUTTER_ROOT%

# Check PATH contains Flutter
echo %PATH%
```

**macOS/Linux:**
```bash
# Check if FLUTTER_ROOT is set
echo $FLUTTER_ROOT

# Check PATH contains Flutter
echo $PATH
```

## 🛠️ Quick Fix Scripts

### Windows (fix_dependencies.bat)
```batch
@echo off
echo Fixing Flutter dependencies...
flutter clean
del pubspec.lock
flutter pub cache repair
flutter pub get --verbose
echo.
echo Restart your IDE now!
pause
```

### macOS/Linux (fix_dependencies.sh)
```bash
#!/bin/bash
echo "Fixing Flutter dependencies..."
flutter clean
rm -f pubspec.lock
flutter pub cache repair
flutter pub get --verbose
echo ""
echo "Restart your IDE now!"
```

## 🔍 Verification Tests

### Test 1: Import Verification
Run this Dart file to test imports:
```bash
dart lib/core/utils/import_verification.dart
```

### Test 2: Basic Flutter Analysis
```bash
flutter analyze --no-fatal-infos
```

### Test 3: Package Resolution
```bash
flutter pub deps --no-dev
```

## 🚩 Common Issues and Solutions

### Issue 1: Flutter Not Found
**Symptoms:** Command 'flutter' is not recognized
**Solution:** 
- Reinstall Flutter SDK
- Add Flutter bin directory to PATH
- Restart terminal/IDE

### Issue 2: Proxy/Firewall Issues
**Symptoms:** Package download failures
**Solution:**
```bash
# Configure Flutter to use proxy (if needed)
flutter config --enable-web

# Clear proxy settings if problematic
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### Issue 3: Corrupted Cache
**Symptoms:** Inconsistent package behavior
**Solution:**
```bash
flutter pub cache clean
flutter pub cache repair
```

### Issue 4: IDE Analysis Server Issues
**Symptoms:** Red underlines but code should work
**Solution:**
1. Restart Dart Analysis Server
2. Clear IDE cache
3. Restart IDE completely

## 📱 Project-Specific Packages
Verify these packages are in pubspec.yaml:

```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.6
  provider: ^6.1.2
  go_router: ^14.2.7
  google_fonts: ^6.2.1
  intl: ^0.19.0
  # ... other packages
```

## 🎯 Expected Results After Fix

After successful resolution, you should see:
- ✅ No red underlines in import statements
- ✅ Code completion works for Flutter widgets
- ✅ `flutter analyze` shows no critical errors
- ✅ IDE recognizes Flutter/Dart syntax
- ✅ Hot reload works in debug mode

## 🆘 If Problems Persist

1. **Complete Flutter Reinstall:**
   - Uninstall Flutter completely
   - Download fresh Flutter SDK
   - Reinstall following official guide
   - Restore project dependencies

2. **Check System Requirements:**
   - Ensure compatible Dart/Flutter versions
   - Verify system meets Flutter requirements
   - Check for conflicting Dart installations

3. **Alternative Solutions:**
   - Try different IDE (VS Code vs Android Studio)
   - Create new Flutter project and migrate code
   - Use Docker for consistent Flutter environment

## 📞 Getting Help

If you continue experiencing issues:
1. Run `flutter doctor -v` and share output
2. Share `flutter pub deps` output
3. Provide exact error messages
4. Include IDE version and OS information

---

**Last Updated:** August 2025
**Flutter Version Tested:** 3.x
**Target Platform:** Windows 22H2