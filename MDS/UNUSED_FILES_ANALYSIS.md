# Unused Files Analysis

## Files that can be safely removed:

### 1. Unused Layout Components
- `src/components/layout/Header.tsx` - Not imported anywhere
- `src/components/layout/Navigation.tsx` - Not imported anywhere

### 2. Duplicate/Unused Patient Components
- `src/components/patient/PatientAppointments.tsx` - Duplicate of `src/pages/patient/PatientAppointments.tsx`
- `src/components/patient/NearbyClinic.tsx` - Duplicate of `src/pages/patient/NearbyClinic.tsx`

### 3. Unused Clinic Components
- `src/components/clinic/AssignDoctor.tsx` - Not imported anywhere
- `src/components/clinic/ClinicDoctors.tsx` - Not imported anywhere
- `src/components/clinic/ClinicPatients.tsx` - Not imported anywhere

### 4. Unused Auth Components
- `src/features/auth/hooks/useAuth.ts` - Not imported anywhere (AuthContext is used instead)

### 5. Unused Service Files
- `src/features/auth/utils/clinicAuthService.ts` - Not imported anywhere

### 6. Unused Utility Files
- `src/utils/testStorage.ts` - Only used in ProfilePicture.tsx for testing, can be removed if not needed

### 7. Unused Type Files
- `src/types/index.ts` - Contains basic types that may not be used

## Files that are used and should be kept:

### Core Application Files
- `src/App.tsx` - Main application router
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles
- `src/vite-env.d.ts` - Vite environment types

### UI Components (All Used)
- `src/components/ui/Button.tsx` - Used throughout
- `src/components/ui/Card.tsx` - Used throughout
- `src/components/ui/Input.tsx` - Used throughout
- `src/components/ui/ProfilePicture.tsx` - Used in PatientProfile
- `src/components/ui/FloatingChatBot.tsx` - Used in App.tsx
- `src/components/ui/SearchModal.tsx` - Used in Navbar
- `src/components/ui/Modal.tsx` - Used in multiple components
- `src/components/ui/ConfirmDialog.tsx` - Used in Sidebar

### Layout Components (Used)
- `src/components/layout/DashboardLayout.tsx` - Used in dashboards
- `src/components/layout/Sidebar.tsx` - Used in DashboardLayout
- `src/components/layout/Navbar.tsx` - Used in DashboardLayout

### Auth Components (All Used)
- `src/features/auth/components/SignInForm.tsx` - Used in SignInPage
- `src/features/auth/components/SignUpForm.tsx` - Used in SignUpPage
- `src/features/auth/components/ClinicSignInForm.tsx` - Used in ClinicSignInPage
- `src/features/auth/components/ClinicSignUpForm.tsx` - Used in ClinicSignUpPage
- `src/features/auth/components/DoctorSignInForm.tsx` - Used in DoctorSignInPage
- `src/features/auth/components/DoctorSignUpForm.tsx` - Used in DoctorSignUpPage

### Auth Pages (All Used)
- `src/features/auth/pages/SignInPage.tsx` - Used in App.tsx
- `src/features/auth/pages/SignUpPage.tsx` - Used in App.tsx
- `src/features/auth/pages/ClinicSignInPage.tsx` - Used in App.tsx
- `src/features/auth/pages/ClinicSignUpPage.tsx` - Used in App.tsx
- `src/features/auth/pages/DoctorSignInPage.tsx` - Used in App.tsx
- `src/features/auth/pages/DoctorSignUpPage.tsx` - Used in App.tsx
- `src/features/auth/pages/AuthCallback.tsx` - Used in App.tsx

### Service Files (All Used)
- `src/features/auth/utils/authService.ts` - Used in multiple components
- `src/features/auth/utils/patientService.ts` - Used in PatientProfile
- `src/features/auth/utils/clinicService.ts` - Used in multiple components
- `src/features/auth/utils/doctorService.ts` - Used in ClinicDoctors and AssignDoctor
- `src/features/auth/utils/storageService.ts` - Used in ProfilePicture
- `src/features/auth/utils/roleBasedAuthService.ts` - Used in multiple components
- `src/features/auth/utils/appointmentService.ts` - Used in PatientAppointments and BookAppointment
- `src/features/auth/utils/clinicSpecialtyService.ts` - Used in clinicService

### Context Files (Used)
- `src/contexts/AuthContext.tsx` - Used in Header and Navigation

### Type Files (Used)
- `src/types/appointments.ts` - Used in PatientAppointments and mockAppointments

### Utility Files (Used)
- `src/utils/mockAppointments.ts` - Used in PatientAppointments
- `src/lib/supabase.ts` - Used in multiple service files
- `src/lib/utils.ts` - Utility functions

### Pages (All Used)
- `src/pages/LandingPage.tsx` - Used in App.tsx
- `src/pages/LearnMore.tsx` - Used in App.tsx
- `src/pages/patient/PatientDashboard.tsx` - Used in App.tsx
- `src/pages/patient/PatientHome.tsx` - Used in PatientDashboard
- `src/pages/patient/PatientProfile.tsx` - Used in PatientDashboard
- `src/pages/patient/PatientAppointments.tsx` - Used in PatientDashboard
- `src/pages/patient/NearbyClinic.tsx` - Used in PatientDashboard
- `src/pages/clinic/ClinicDashboard.tsx` - Used in App.tsx
- `src/pages/clinic/ClinicHome.tsx` - Used in ClinicDashboard
- `src/pages/clinic/ClinicDoctors.tsx` - Used in ClinicDashboard
- `src/pages/clinic/ClinicPatients.tsx` - Used in ClinicDashboard
- `src/pages/clinic/ClinicSettings.tsx` - Used in ClinicDashboard
- `src/pages/clinic/ManageClinic.tsx` - Used in ClinicDashboard
- `src/pages/clinic/AppointmentSlots.tsx` - Used in ClinicDashboard
- `src/pages/doctor/DoctorDashboard.tsx` - Used in App.tsx

### Patient Components (Used)
- `src/components/patient/BookAppointment.tsx` - Used in NearbyClinic
- `src/components/patient/ClinicMap.tsx` - Used in NearbyClinic

### Clinic Components (Used)
- `src/components/clinic/ClinicAppointments.tsx` - Used in ClinicDashboard

## Summary
Total files that can be removed: 8 files
- 2 unused layout components
- 2 duplicate patient components
- 3 unused clinic components
- 1 unused auth hook
- 1 unused service file
- 1 unused utility file (optional)

This cleanup will reduce the codebase size and eliminate confusion from duplicate components. 