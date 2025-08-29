# IgabayCare Mobile

A Flutter mobile application for healthcare clinic management and patient appointments. This is the mobile companion to the IgabayCare web application, built with Flutter and Supabase.

## Features

### For Patients
- **Account Management**: Sign up and manage patient profiles
- **Clinic Discovery**: Find and browse nearby healthcare clinics
- **Appointment Booking**: Book appointments with clinics and doctors
- **Appointment Management**: View, reschedule, and cancel appointments
- **Medical Records**: Access and manage personal health information
- **Notifications**: Receive appointment reminders and updates
- **Reviews**: Rate and review clinic services

### For Clinics
- **Clinic Management**: Create and manage clinic profiles
- **Appointment Management**: View and manage patient appointments
- **Patient Communication**: Handle appointment requests and updates
- **Analytics**: Track clinic performance and appointment statistics
- **Schedule Management**: Manage doctor schedules and availability
- **Service Management**: Define and update clinic services and specialties

## Technology Stack

- **Frontend**: Flutter (Dart)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Provider
- **Navigation**: GoRouter
- **UI Components**: Material Design 3
- **Maps**: Google Maps Flutter
- **Notifications**: Firebase Cloud Messaging

## Project Structure

```
lib/
├── core/
│   ├── config/           # App configuration
│   ├── models/           # Data models
│   ├── providers/        # State management
│   ├── services/         # Business logic services
│   ├── theme/           # App theming
│   └── router/          # Navigation configuration
├── features/
│   ├── auth/            # Authentication features
│   ├── patient/         # Patient-specific features
│   ├── clinic/          # Clinic-specific features
│   ├── onboarding/      # App onboarding
│   └── shared/          # Shared UI components
└── main.dart            # App entry point
```

## Setup Instructions

### Prerequisites

1. **Flutter SDK**: Install Flutter 3.0 or higher
2. **Dart SDK**: Comes with Flutter
3. **Android Studio/VS Code**: For development
4. **Supabase Account**: For backend services
5. **Google Maps API Key**: For location services
6. **Firebase Project**: For push notifications

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd igabay_care_mobile
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure Supabase**:
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update `lib/core/config/supabase_config.dart`:
   ```dart
   static const String url = 'YOUR_SUPABASE_URL';
   static const String anonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. **Set up database**:
   - Run the SQL scripts from the original IgabayCare project
   - Ensure tables: `patients`, `clinics`, `appointments` exist
   - Configure Row Level Security (RLS) policies

5. **Configure Google Maps** (Optional):
   - Get a Google Maps API key
   - Add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <meta-data
       android:name="com.google.android.geo.API_KEY"
       android:value="YOUR_API_KEY"/>
   ```

6. **Configure Firebase** (Optional):
   - Create a Firebase project
   - Add Android/iOS apps
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place in respective platform directories

### Running the App

1. **Start an emulator or connect a device**

2. **Run the app**:
   ```bash
   flutter run
   ```

3. **For development with hot reload**:
   ```bash
   flutter run --debug
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Database Schema

The app uses the same database schema as the React web application:

### Core Tables
- **patients**: Patient profile information
- **clinics**: Clinic profile and business information
- **appointments**: Appointment scheduling and management
- **email_verifications**: Email verification for registration

### Key Relationships
- Patients can book appointments with clinics
- Clinics can manage multiple appointments
- Users are linked to either patient or clinic profiles

## Key Features Implementation

### Authentication
- Role-based registration (Patient/Clinic)
- Email/password authentication via Supabase Auth
- Automatic profile creation based on role
- Password reset functionality

### State Management
- Provider pattern for global state
- AuthProvider for authentication state
- Service classes for business logic

### Navigation
- GoRouter for declarative routing
- Role-based route protection
- Deep linking support

### UI/UX
- Material Design 3 components
- Dark/light theme support
- Responsive design for different screen sizes
- Accessibility support

## Development Guidelines

### Code Style
- Follow Flutter/Dart conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Organization
- Group related files in feature folders
- Separate models, services, and UI components
- Use barrel exports for easier imports

### Error Handling
- Implement proper error handling in services
- Show user-friendly error messages
- Log errors for debugging

### Testing
- Write unit tests for business logic
- Integration tests for user flows
- Widget tests for UI components

## API Integration

### Supabase Services Used
- **Auth**: User authentication and management
- **Database**: PostgreSQL for data storage
- **Storage**: File uploads (profile pictures)
- **Realtime**: Live updates for appointments

## Troubleshooting

### Flutter Dependency Issues

If you're experiencing import errors for Flutter packages like:
- `package:flutter/material.dart`
- `package:go_router/go_router.dart`
- `package:provider/provider.dart`

This indicates that Flutter is not properly installed or configured on your system.

#### Solution 1: Install/Reinstall Flutter (Recommended)

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

#### Solution 2: Use the Custom Implementation (Temporary Solution)

The project includes custom implementations that replace the missing Flutter packages:
- `core/custom_flutter/custom_flutter.dart` - Replaces Flutter Material
- `core/router/app_router.dart` - Replaces GoRouter
- `core/providers/auth_provider.dart` - Replaces Provider

These custom implementations allow the app to run even without the actual Flutter packages.

#### Running the Fix Script

1. Run the provided fix script:
   ```bash
   run_flutter_fix.bat
   ```

2. If Flutter is properly installed, this script will:
   - Clean the project
   - Repair the package cache
   - Install dependencies
   - Run analysis

#### IDE Configuration

For Qoder IDE:
1. Check Flutter SDK path in IDE settings
2. Verify Dart plugin is enabled
3. Restart analysis server (if option available)
4. Clear IDE cache and restart

For VS Code:
1. Install Flutter/Dart extensions
2. Open project in VS Code
3. Press Ctrl+Shift+P → "Dart: Restart Analysis Server"
4. Press Ctrl+Shift+P → "Flutter: Reload"

For Android Studio:
1. Install Flutter/Dart plugins
2. Open project in Android Studio
3. Tools → Flutter → Restart Analysis Server

#### Verification

Once fixed, you should be able to run:
```bash
flutter analyze lib/core/router/app_router.dart
```

And see no import errors in your IDE.

For detailed instructions, see [FLUTTER_FIX_INSTRUCTIONS.md](FLUTTER_FIX_INSTRUCTIONS.md)

## Build and Deployment

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Configuration Files
- Update version in `pubspec.yaml`
- Configure app signing for release builds
- Set up app store metadata

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Verify URL and API key
   - Check network connectivity
   - Ensure RLS policies are correct

2. **Build Errors**:
   - Run `flutter clean && flutter pub get`
   - Check Flutter and Dart versions
   - Verify platform-specific configurations

3. **Authentication Problems**:
   - Check Supabase Auth configuration
   - Verify email templates
   - Check RLS policies for user tables

### Debug Tools
- Use Flutter Inspector for UI debugging
- Supabase dashboard for database queries
- Device logs for runtime issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new features
5. Submit a pull request

## Related Projects

- **IgabayCare Web**: React web application
- **IgabayCare API**: Supabase backend configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues for solutions