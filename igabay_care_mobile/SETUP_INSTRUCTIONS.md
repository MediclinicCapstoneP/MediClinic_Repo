# IgabayCare Flutter Setup Instructions

## 🚀 Quick Start Guide

Follow these steps to set up the IgabayCare Flutter mobile application:

### 1. Prerequisites

Ensure you have the following installed:
- **Flutter SDK** (3.0 or later)
- **Dart SDK** (included with Flutter)
- **Android Studio** or **VS Code** with Flutter extensions
- **Git**

Verify your setup:
```bash
flutter doctor -v
```

### 2. Project Setup

1. **Clone the repository** (if not already done):
```bash
git clone [repository-url]
cd igabay_care_mobile
```

2. **Install dependencies**:
```bash
flutter pub get
```

3. **Clean and rebuild** (if you encounter issues):
```bash
flutter clean
flutter pub get
```

### 3. Environment Configuration

#### Option A: Edit configuration files directly

1. **Update Supabase configuration** in `lib/core/config/supabase_config.dart`:
```dart
static const String developmentUrl = 'https://your-project.supabase.co';
static const String developmentAnonKey = 'your-anon-key-here';
```

2. **Update environment settings** in `lib/core/config/environment.dart`:
```dart
static const String supabaseUrl = 'https://your-project.supabase.co';
static const String supabaseAnonKey = 'your-anon-key-here';
static const String googleMapsApiKey = 'your-google-maps-api-key';
```

#### Option B: Use environment variables (Recommended for production)

Create a `.env` file in the project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
ENVIRONMENT=development
```

### 4. Supabase Backend Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up the database schema** using the SQL scripts in the main IgabayCare project

3. **Configure Row Level Security (RLS)** policies for:
   - `profiles` table
   - `patient_profiles` table
   - `clinic_profiles` table
   - `appointments` table
   - `reviews` table

4. **Enable authentication** providers you want to use (email/password is enabled by default)

### 5. Google Maps Setup (Optional)

If you plan to use map features:

1. **Get a Google Maps API key** from [Google Cloud Console](https://console.cloud.google.com)

2. **Enable the following APIs**:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API

3. **Add the API key** to your environment configuration

### 6. Firebase Setup (For Notifications - Optional)

1. **Create a Firebase project** at [firebase.google.com](https://firebase.google.com)

2. **Add Android/iOS apps** to your Firebase project

3. **Download configuration files**:
   - `google-services.json` for Android (place in `android/app/`)
   - `GoogleService-Info.plist` for iOS (place in `ios/Runner/`)

### 7. Running the Application

#### Development Mode

```bash
# Run on connected device/emulator
flutter run

# Run with hot reload
flutter run --debug

# Run on specific device
flutter devices
flutter run -d [device-id]
```

#### Build for Release

```bash
# Android APK
flutter build apk --release

# Android App Bundle (recommended for Play Store)
flutter build appbundle --release

# iOS (requires macOS and Xcode)
flutter build ios --release
```

### 8. Testing

```bash
# Run all tests
flutter test

# Run tests with coverage
flutter test --coverage

# Run integration tests
flutter drive --target=test_driver/app.dart
```

### 9. Code Quality

```bash
# Analyze code
flutter analyze

# Format code
dart format lib/

# Fix auto-fixable issues
dart fix --apply
```

## 📱 Project Structure

```
lib/
├── core/                    # Core functionality
│   ├── config/             # Configuration files
│   ├── constants/          # App constants
│   ├── interfaces/         # Service interfaces
│   ├── models/             # Data models
│   ├── providers/          # State management
│   ├── router/             # Navigation
│   ├── services/           # Business logic services
│   ├── theme/              # App theming
│   └── utils/              # Utility functions
├── features/               # Feature modules
│   ├── auth/               # Authentication
│   ├── clinic/             # Clinic management
│   ├── onboarding/         # App onboarding
│   └── patient/            # Patient features
└── main.dart               # App entry point
```

## 🔧 Troubleshooting

### Common Issues

1. **Import errors / "Target of URI doesn't exist"**:
   ```bash
   flutter clean
   flutter pub get
   # Restart your IDE
   ```

2. **Build errors**:
   ```bash
   flutter clean
   flutter pub cache repair
   flutter pub get
   ```

3. **Dependency conflicts**:
   ```bash
   flutter pub deps
   flutter pub outdated
   ```

4. **Android build issues**:
   - Check your `android/app/build.gradle` file
   - Ensure you have the correct Android SDK version
   - Clean and rebuild: `cd android && ./gradlew clean && cd ..`

5. **iOS build issues**:
   - Open `ios/Runner.xcworkspace` in Xcode
   - Clean build folder in Xcode
   - Check provisioning profiles and certificates

### Environment Issues

If you're seeing configuration errors:

1. **Check environment setup**:
   ```bash
   flutter doctor -v
   dart --version
   ```

2. **Verify Supabase configuration**:
   - Ensure URL and keys are correct
   - Check network connectivity
   - Verify Supabase project is active

3. **Test configuration**:
   ```bash
   dart lib/core/utils/import_verification.dart
   ```

## 📚 Additional Resources

- **Flutter Documentation**: [flutter.dev](https://flutter.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Dart Packages**: [pub.dev](https://pub.dev)

## 🆘 Getting Help

If you encounter issues:

1. **Check the diagnostic tools**:
   ```bash
   # Run the diagnostic script
   diagnose_environment.bat  # Windows
   # or check import verification
   dart lib/core/utils/import_verification.dart
   ```

2. **Review the troubleshooting guides**:
   - `DEPENDENCY_FIX_README.md`
   - `IDE_CONFIGURATION_GUIDE.md`

3. **Check logs**:
   - Flutter logs: `flutter logs`
   - Device logs: Android Studio Device Monitor or Xcode Console

4. **Contact support** with:
   - Output from `flutter doctor -v`
   - Error messages
   - Steps to reproduce the issue

---

**Last Updated**: August 2025  
**Flutter Version**: 3.x  
**Dart Version**: 3.x