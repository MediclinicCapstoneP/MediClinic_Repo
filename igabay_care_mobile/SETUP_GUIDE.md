# IgabayCare Mobile - Setup and Deployment Guide

## Quick Start Guide

### 1. Prerequisites Installation

#### Flutter SDK
```bash
# Download and install Flutter SDK
# Add Flutter to your PATH
flutter doctor  # Check installation
```

#### Required Tools
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **VS Code**: Recommended editor with Flutter extension

### 2. Project Setup

#### Clone and Install
```bash
git clone <repository-url>
cd igabay_care_mobile
flutter pub get
```

#### Environment Configuration
Create `lib/core/config/environment.dart`:
```dart
class Environment {
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
}
```

### 3. Supabase Backend Setup

#### Database Schema
Run the following SQL scripts in your Supabase SQL editor:

1. **Create Tables**:
```sql
-- From IgabayCare/database/schema.sql
-- Includes: patients, clinics, appointments tables
```

2. **Setup RLS Policies**:
```sql
-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patient policies
CREATE POLICY "Patients can view own profile" ON patients
    FOR SELECT USING (auth.uid() = user_id);

-- Similar policies for clinics and appointments
```

#### Supabase Configuration
1. Create new Supabase project
2. Copy Project URL and anon key
3. Update `lib/core/config/supabase_config.dart`

### 4. Platform-Specific Setup

#### Android Configuration

1. **Update package name** in `android/app/build.gradle`:
```gradle
defaultConfig {
    applicationId "com.igabaycare.mobile"
    // ... other config
}
```

2. **Add Google Maps API key** in `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY" />
```

3. **Firebase setup** (optional):
   - Create Firebase project
   - Add Android app
   - Download `google-services.json`
   - Place in `android/app/`

#### iOS Configuration

1. **Update bundle identifier** in `ios/Runner.xcodeproj`

2. **Add Google Maps API key** in `ios/Runner/AppDelegate.swift`:
```swift
GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
```

3. **Firebase setup** (optional):
   - Add iOS app to Firebase project
   - Download `GoogleService-Info.plist`
   - Add to `ios/Runner/`

### 5. Running the App

#### Development
```bash
# Start emulator or connect device
flutter devices

# Run in debug mode
flutter run

# Run with hot reload
flutter run --hot
```

#### Build for Testing
```bash
# Android APK
flutter build apk --debug

# iOS (macOS only)
flutter build ios --debug
```

## Deployment Guide

### Android Deployment

#### 1. Prepare for Release
```bash
# Generate signing key
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

#### 2. Configure Signing
Create `android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=upload
storeFile=/path/to/upload-keystore.jks
```

Update `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

#### 3. Build Release
```bash
# App Bundle (recommended)
flutter build appbundle --release

# APK
flutter build apk --release
```

#### 4. Deploy to Google Play
1. Create Google Play Console account
2. Create new app listing
3. Upload app bundle
4. Configure store listing
5. Submit for review

### iOS Deployment

#### 1. Configure Xcode Project
```bash
flutter build ios --release
open ios/Runner.xcworkspace
```

#### 2. Apple Developer Setup
1. Join Apple Developer Program
2. Create App ID in Developer Console
3. Configure certificates and profiles

#### 3. Archive and Upload
1. Select "Any iOS Device" in Xcode
2. Product → Archive
3. Upload to App Store Connect
4. Submit for review

## Environment-Specific Configurations

### Development Environment
```dart
// lib/core/config/app_config.dart
class AppConfig {
  static const bool isProduction = false;
  static const String baseUrl = 'https://your-dev-supabase.supabase.co';
  static const bool enableLogging = true;
}
```

### Production Environment
```dart
class AppConfig {
  static const bool isProduction = true;
  static const String baseUrl = 'https://your-prod-supabase.supabase.co';
  static const bool enableLogging = false;
}
```

## Testing Strategy

### Unit Tests
```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
```

### Integration Tests
```bash
# Run integration tests
flutter drive --target=test_driver/app.dart
```

### Widget Tests
Create test files in `test/` directory:
```dart
testWidgets('Login screen test', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());
  expect(find.text('Sign In'), findsOneWidget);
});
```

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
flutter build apk --analyze-size

# Profile performance
flutter run --profile
```

### Code Optimization
- Use `const` constructors where possible
- Implement proper `dispose()` methods
- Use `ListView.builder()` for large lists
- Optimize image loading with caching

## Monitoring and Analytics

### Firebase Analytics Setup
```dart
// lib/core/services/analytics_service.dart
class AnalyticsService {
  static FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  
  static Future<void> logEvent(String name, Map<String, dynamic> parameters) async {
    await analytics.logEvent(name: name, parameters: parameters);
  }
}
```

### Crash Reporting
```dart
// lib/main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;
  
  runApp(MyApp());
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   flutter clean
   flutter pub get
   flutter pub deps
   ```

2. **Android Build Issues**:
   - Check Android SDK version
   - Update gradle version
   - Verify signing configuration

3. **iOS Build Issues**:
   - Update Xcode
   - Check iOS deployment target
   - Verify certificates and profiles

4. **Supabase Connection**:
   - Verify URL and API key
   - Check network connectivity
   - Review RLS policies

### Debug Commands
```bash
# Check Flutter installation
flutter doctor -v

# Check dependencies
flutter pub deps

# Verbose build output
flutter build apk --verbose

# Debug info
flutter analyze
```

## Security Checklist

### Code Security
- [ ] API keys not hardcoded
- [ ] Sensitive data encrypted
- [ ] Input validation implemented
- [ ] Error messages don't leak info

### Build Security
- [ ] Obfuscation enabled for release
- [ ] Debug info removed
- [ ] Signing keys secure
- [ ] App permissions minimal

### Backend Security
- [ ] RLS policies configured
- [ ] API rate limiting enabled
- [ ] Authentication required
- [ ] Data validation on server

## Maintenance

### Regular Updates
- Update Flutter SDK monthly
- Update dependencies quarterly
- Review security advisories
- Monitor app store reviews

### Monitoring
- Track crash rates
- Monitor performance metrics
- Review user feedback
- Update documentation

This guide provides a comprehensive approach to setting up, building, and deploying the IgabayCare mobile application.