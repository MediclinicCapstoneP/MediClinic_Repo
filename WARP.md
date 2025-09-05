# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

iGabayAtiCare is a mobile-first healthcare platform built with React, TypeScript, and Supabase that connects patients with registered clinics through real-time appointment booking and clinic registration management. The system integrates machine learning to automate validation of bookings and clinic registrations, enhancing security and reducing fraudulent activity. An AI-powered chatbot assistant guides users through the booking process and provides real-time support.

### Key Features
- **Payment-First Booking**: Patients pay consultation fees before securing appointments
- **ML-Powered Validation**: Automated validation for bookings and clinic registrations
- **AI Chatbot Assistant**: OpenAI-powered 24/7 user guidance and support
- **Mobile-Optimized**: Cross-platform mobile app with responsive design
- **Real-Time Notifications**: Push notifications for appointments and updates
- **Comprehensive Medical Records**: Patient history management with provider access
- **Secure Document Verification**: Clinic license and accreditation validation

## Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.5.3
- Vite 7.0.5 (development server and build tool)
- TailwindCSS 3.4.1 (utility-first CSS framework)
- React Router v7 (client-side routing)
- Lucide React (icon library)

**Backend & Database:**
- Supabase 2.53.0 (Backend-as-a-Service)
- PostgreSQL with Row Level Security (RLS)
- Real-time subscriptions

**Maps & Geolocation:**
- Leaflet 1.9.4 with React-Leaflet 4.2.1
- Leaflet Routing Machine for navigation

**Payment Processing:**
- Adyen payment gateway with multi-method support (GCash, PayMaya, Cards)
- Payment-first booking system ensuring appointment legitimacy

**Machine Learning & AI:**
- ML-based booking validation algorithms
- Automated clinic registration verification
- OpenAI-powered chatbot integration

**Mobile & Notifications:**
- Progressive Web App (PWA) capabilities
- Push notification system
- Cross-platform mobile optimization

## Common Development Commands

```bash
# Navigate to the main application directory
cd IgabayCare

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run code linting
npm run lint

# Check environment variables (development only)
# The app automatically runs environment checks in dev mode
```

## Development Setup

### Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Required environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_PAYMONGO_PUBLIC_KEY`: PayMongo public key (for payments)
   - `VITE_PAYMONGO_SECRET_KEY`: PayMongo secret key (for payments)

### Database Setup
The database schema is located in `IgabayCare/database/` directory. Key setup files:
- `comprehensive_database_setup.sql`: Main database schema
- Various migration and fix files for specific features

Run the comprehensive database setup in Supabase SQL Editor to create all required tables and relationships.

## High-Level Architecture

### Core Architecture Pattern
The codebase follows a modular, feature-based architecture with SOLID principles:

**Core Module (`src/core/`):**
- Implements dependency injection container (`DIContainer.ts`)
- Medical design system with healthcare-specific components
- Extensible component architecture with factory pattern
- Medical data validation with HIPAA compliance considerations
- Theme provider supporting different healthcare roles

**Feature-Based Organization (`src/features/`):**
- Authentication feature with role-based access control
- Separate sign-in/up flows for patients, clinics, and doctors
- Comprehensive service layer for each entity type

**Component Hierarchy:**
- **Layout Components:** Role-specific navigation (Patient, Clinic, Doctor)
- **UI Components:** Reusable medical-themed components
- **Feature Components:** Business logic components organized by domain
- **Page Components:** Route-level components for different user dashboards

### Authentication & Authorization
- Multi-role authentication system (Patient, Clinic, Doctor)
- Supabase Auth with JWT tokens
- Role-based dashboards and navigation
- Row Level Security (RLS) policies for data access control

**User Flow:**
1. Users sign up with role selection (patient/clinic/doctor)
2. Role-specific profile creation in respective tables
3. Context-aware authentication with role switching capability
4. Role-based redirects to appropriate dashboards

### Data Layer Architecture
**Service Pattern:**
- Each entity has dedicated service files in `features/auth/utils/`
- Services handle CRUD operations and business logic
- Centralized error handling and validation
- Type-safe interfaces for all data operations

**Key Services:**
- `patientService.ts`: Patient profile and medical data management
- `clinicService.ts`: Clinic registration and management
- `doctorService.ts`: Doctor profile and schedule management
- `appointmentService.ts`: Appointment booking and lifecycle
- `storageService.ts`: File upload and profile picture handling

### Database Design
**Core Tables:**
- `patients`: Patient profiles with medical information
- `clinics`: Clinic business data with location/services
- `appointments`: Appointment management with status tracking
- `clinic_services`: Service offerings with pricing

**Key Relationships:**
- Users (Supabase Auth) → Role-specific profiles (patients/clinics)
- Appointments link patients and clinics with optional doctor assignment
- Clinics have multiple services with individual pricing

**Security Features:**
- Row Level Security ensures users only access their own data
- Role-based policies for different user types
- Audit trails for appointment modifications

## Testing and Debugging

### Debug Components
- `AuthDebugComponent`: Authentication state debugging (dev mode only)
- Debug routes available at `/debug` and `/appointment-display-test` (dev mode only)
- Environment checker runs automatically in development

### Common Development Issues

**Authentication Problems:**
- Check Supabase URL and keys in `.env`
- Verify user role assignment in database
- Use AuthDebugComponent for state inspection

**Database Errors:**
- Ensure all SQL scripts in `database/` directory are executed
- Check RLS policies for permission issues
- Verify foreign key relationships are properly set up

**Map Integration Issues:**
- Ensure Leaflet CSS is properly imported
- Check clinic latitude/longitude data exists
- Verify map container has defined dimensions

## File Structure Conventions

**Naming Patterns:**
- Components use PascalCase: `PatientDashboard.tsx`
- Services use camelCase: `patientService.ts`
- Utility files use camelCase: `envChecker.ts`
- Page components are organized by role: `patient/`, `clinic/`, `doctor/`

**Import Conventions:**
- Absolute imports use `@/` alias (configured in vite.config.ts)
- Services imported from `features/auth/utils/`
- Types imported from `types/index.ts`
- UI components from `components/ui/`

## Medical Data Handling

### HIPAA Compliance Considerations
- Medical data validation in `core/validation/MedicalValidation.ts`
- Secure storage patterns for sensitive information
- Audit logging for medical record access
- Role-based access controls for patient data

### Data Types
- Patient medical history, allergies, medications
- Insurance information with policy numbers
- Emergency contact management
- Appointment notes (patient, doctor, admin)

## Multi-Role Dashboard System

**Patient Dashboard:** Appointment booking, clinic search, medical history
**Clinic Dashboard:** Patient management, appointment scheduling, doctor management
**Doctor Dashboard:** Appointment management, patient information access

Each role has dedicated:
- Navigation components (`PatientNavbar`, `ClinicNavbar`, `DoctorNavbar`)
- Service layers with role-specific operations
- Dashboard layouts with appropriate functionality

## Location and Mapping Features

- Interactive maps using Leaflet for clinic discovery
- Geolocation-based clinic search
- Routing and navigation to clinic locations
- Clinic coordinate management in database

## Payment Integration

- PayMongo GCash integration for appointment payments
- Payment form components with secure handling
- Payment status tracking in appointments

## Development Guidelines

### Code Organization
- Keep functions under 50 lines for readability
- Follow TypeScript strict mode requirements
- Use single responsibility principle for components
- Implement proper error handling in all services

### Database Patterns
- Always use parameterized queries
- Implement proper RLS policies for new tables
- Include audit fields (created_at, updated_at) on all tables
- Use UUID primary keys consistently

### Component Development
- Extend the medical design system for healthcare-specific components
- Use the dependency injection container for service dependencies
- Implement proper loading and error states
- Follow accessibility guidelines for medical applications

## Important Notes

- The main application is in the `IgabayCare/` directory
- Database setup requires running SQL scripts in Supabase
- PayMongo integration requires test/production keys configuration
- Row Level Security policies are critical for data protection
- The core module provides extensible architecture for medical applications
