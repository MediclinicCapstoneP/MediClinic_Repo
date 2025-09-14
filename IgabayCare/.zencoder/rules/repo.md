---
description: Repository Information Overview
alwaysApply: true
---

# IgabayCare Information

## Summary
IgabayCare is a comprehensive healthcare platform designed to streamline interactions between patients, doctors, and clinics. The platform simplifies appointment booking, improves clinic visibility, and enhances communication between patients and healthcare providers. It's built with React, TypeScript, and Vite, using Supabase as the backend service.

## Structure
- **src/**: Main application source code
  - **components/**: Reusable UI components (clinic, dashboard, layout, patient, ui)
  - **contexts/**: React Context providers
  - **core/**: Core architecture modules
  - **features/**: Feature-based modules
  - **lib/**: External library configurations
  - **pages/**: Page components
  - **tests/**: Test files
- **database/**: Database scripts and documentation
- **supabase/**: Supabase functions and configurations
- **public/**: Static assets

## Language & Runtime
**Language**: TypeScript 5.5.3
**Runtime**: Node.js 18+
**Build System**: Vite 7.0.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.3.1
- React Router 7.7.0
- Supabase 2.53.0
- Leaflet 1.9.4 (Maps & Geolocation)
- Chart.js 4.5.0 (Data visualization)
- Adyen Web 6.21.0 (Payment processing)
- Resend 4.7.0 (Email service)

**Development Dependencies**:
- TypeScript 5.5.3
- ESLint 9.9.1
- TailwindCSS 3.4.1
- PostCSS 8.4.35
- Autoprefixer 10.4.18

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Code linting
npm run lint
```

## Backend Services
**Supabase**: Backend-as-a-Service with PostgreSQL database
- Authentication with JWT-based sessions
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live data
- Edge Functions for serverless backend logic

**Database Schema**:
- **patients**: Patient profiles and medical information
- **clinics**: Clinic information and business details
- **appointments**: Appointment scheduling and management
- **clinic_services**: Services offered by clinics
- **payments**: Payment processing and tracking

## Testing
**Framework**: Custom integration testing
**Test Location**: src/tests/
**Test Files**: 
- appointmentBookingIntegration.test.ts
- core-exports.test.ts

**Testing Areas**:
- Appointment booking flow
- Payment processing
- Notification system
- Email service
- Reminder system

## Configuration
**Environment Variables**:
- Supabase credentials (URL, API keys)
- Adyen payment configuration
- Email service settings
- Notification service settings

**TailwindCSS**:
- Custom medical design system with specialized colors
- Medical-specific animations and components
- Responsive design for all device types