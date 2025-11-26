# IgabayCare Mobile - Healthcare Management App

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-0.79.1-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-53.0.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-2.57.4-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/React_Navigation-7.0.14-6700EB?style=for-the-badge&logo=react-router&logoColor=white" alt="React Navigation" />
</div>

---

**IgabayCare Mobile** is the native mobile application companion to the IgabayCare healthcare management system. Built with React Native and Expo, it provides a seamless mobile experience for patients, doctors, and clinic administrators to manage healthcare appointments, medical records, and prescriptions on-the-go.

## Features

### Authentication System
- **Role-Based Access Control (RBAC)**: Separate interfaces for patients, doctors, and clinics
- **Supabase Authentication**: Secure JWT-based authentication with email verification
- **Automatic Role Detection**: Users are automatically routed to appropriate dashboards based on their role
- **Protected Routes**: All sensitive routes are protected with role-based access control

### AI-Powered Chatbot
- **Groq AI Integration**: Fast inference using Llama3 model
- **Healthcare Assistant**: Provides medical information and guidance
- **Edge Functions**: Serverless API for chat processing
- **Real-time Messaging**: Interactive chat interface with typing indicators

### User Roles

#### Patient Features
- Book appointments with clinics
- View appointment history
- Search for clinics and doctors
- Manage personal health records
- PayMongo GCash payment integration

#### Doctor/Clinic Features
- Manage appointments and schedules
- View patient information
- Create prescriptions and medical records
- Clinic management dashboard

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 2. Environment Configuration

Create a `.env` file in the project root with your credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayMongo Configuration (optional)
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=your_paymongo_public_key
EXPO_PUBLIC_PAYMONGO_SECRET_KEY=your_paymongo_secret_key

# App Configuration
EXPO_PUBLIC_APP_ENV=development

# Groq API Key for AI Chatbot
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Database Setup

The application uses the comprehensive database schema provided, which includes:

- **patients**: Patient profiles and medical information
- **clinics**: Clinic information and services
- **doctors**: Doctor profiles and specializations
- **appointments**: Appointment booking and management
- **notifications**: Real-time notifications system
- **transactions**: Payment and billing records

### 4. Run the Application

```bash
npm run dev
```

## Authentication Flow

### Sign Up Process
1. User enters basic information (name, email, phone, password)
2. User selects their role (Patient, Clinic, or Doctor)
3. Profile is created in the appropriate table based on role
4. User is automatically signed in and routed to their dashboard

### Sign In Process
1. User enters email and password
2. System automatically detects user role from database
3. User is routed to appropriate dashboard based on role

### Role-Based Routing
- **Patients**: `/(tabs)/patient` - Patient dashboard with appointment booking
- **Doctors**: `/(tabs)/doctor` - Doctor dashboard with patient management
- **Clinics**: `/(tabs)/doctor` - Clinic management interface (shared with doctors)

## Project Structure

```
app/
├── (auth)/                 # Authentication screens
│   ├── login.tsx          # Login form with Supabase integration
│   ├── signup.tsx         # Registration form
│   └── role-selection.tsx # Role selection after signup
├── (tabs)/                # Main application tabs
│   ├── patient/           # Patient-specific screens
│   ├── doctor/            # Doctor/clinic screens
│   └── profile/           # Profile management
├── api/                   # Edge functions
│   └── chatbot/           # AI chatbot API endpoint
├── chat.tsx               # Chatbot screen
├── index.tsx              # Splash screen with auth state detection
└── _layout.tsx            # Root layout with AuthProvider

components/
├── AuthNavigator.tsx      # Handles automatic role-based navigation
├── ProtectedRoute.tsx     # Route protection component
└── ChatBot.tsx            # AI-powered healthcare chatbot component

contexts/
└── AuthContext.tsx        # Authentication state management

services/
└── authService.ts         # Supabase authentication service

lib/
└── supabase.ts           # Supabase client configuration
```

## Key Components

### AuthContext
Provides authentication state and methods throughout the app:
- `user`: Current authenticated user with role and profile
- `loading`: Authentication loading state
- `signIn()`: Sign in with email/password
- `signUp()`: Register new user with role
- `signOut()`: Sign out current user

### ProtectedRoute
Wraps components that require authentication:
- Redirects unauthenticated users to login
- Enforces role-based access control
- Shows loading state during auth checks

### AuthService
Handles all Supabase authentication operations:
- User registration with role-based profile creation
- Sign in with automatic role detection
- Profile retrieval based on user role
- Password reset and updates

## Security Features

- **Row Level Security (RLS)**: Database policies ensure users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different interfaces and permissions for each user type
- **Protected Routes**: All sensitive screens require authentication
- **Input Validation**: Comprehensive form validation and error handling

## Database Integration

The app integrates with a comprehensive PostgreSQL database schema including:
- User authentication and profiles
- Appointment booking and management
- Medical records and prescriptions
- Payment processing and transactions
- Notification system
- Clinic and doctor management

## Development Notes

- Uses Expo Router for navigation with role-based routing
- TypeScript for type safety
- Supabase for backend services
- React Native with modern hooks and context
- Comprehensive error handling and user feedback

## Testing

To test the authentication system:
1. Start the development server
2. Register a new account and select a role
3. Verify automatic routing to appropriate dashboard
4. Test sign out and sign in functionality
5. Verify role-based access control works correctly
