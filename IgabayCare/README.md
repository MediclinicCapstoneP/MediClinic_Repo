# IgabayCare - Healthcare Platform

![IgabayCare](https://img.shields.io/badge/Healthcare-Platform-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.0.5-purple.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.53.0-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🏥 Overview

IgabayCare is a comprehensive healthcare platform designed to streamline interactions between patients, doctors, and clinics. The platform simplifies appointment booking, improves clinic visibility, and enhances communication between patients and healthcare providers.

### 🎯 Core Problems Solved

- **Simplified Appointment Booking**: Patients can easily find and book appointments with nearby clinics
- **Enhanced Clinic Visibility**: Clinics can showcase their services and reach more patients
- **Improved Communication**: Streamlined communication between patients and healthcare providers
- **Centralized Healthcare Management**: Unified platform for managing medical appointments and records

### 👥 Target Users

- **Patients**: Individuals seeking medical care and appointment booking
- **Doctors**: Healthcare professionals managing their appointments and patient interactions
- **Clinic Administrators**: Healthcare facilities managing their operations and staff

## ✨ Features

### 🔐 Authentication & Authorization
- **Role-based Access Control**: Separate interfaces for patients, doctors, and clinics
- **Secure Authentication**: Email verification and password reset functionality
- **Profile Management**: Comprehensive user profile management for all user types

### 📅 Appointment Management
- **Easy Booking**: Intuitive appointment booking system
- **Real-time Availability**: Live appointment slot availability
- **Appointment History**: Complete history of past and upcoming appointments
- **Cancellation & Rescheduling**: Flexible appointment management

### 🏥 Clinic Management
- **Clinic Dashboard**: Comprehensive dashboard for clinic administrators
- **Doctor Management**: Add and manage doctors within clinics
- **Service Management**: Define and update clinic services and specialties
- **Patient Management**: View and manage patient information

### 👨‍⚕️ Doctor Interface
- **Doctor Dashboard**: Dedicated interface for healthcare professionals
- **Appointment Management**: View and manage doctor appointments
- **Patient Information**: Access to relevant patient details

### 🗺️ Location & Navigation
- **Interactive Maps**: Clinic location visualization using Leaflet
- **Nearby Clinics**: Find clinics in proximity to patient location
- **Routing**: Integrated routing for navigation to clinics

### 💊 Additional Features
- **Prescription Management**: Handle prescriptions within the system
- **Review System**: Patient reviews and feedback for clinics
- **Medical Records**: Secure storage and management of medical information

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript 5.5.3**: Type-safe development with strict mode enabled
- **Vite 7.0.5**: Fast development server and build tool
- **TailwindCSS 3.4.1**: Utility-first CSS framework
- **React Router v7**: Client-side routing and navigation
- **Lucide React**: Beautiful and customizable icons

### Backend & Database
- **Supabase 2.53.0**: Backend-as-a-Service with PostgreSQL database
- **PostgreSQL**: Robust relational database with Row Level Security (RLS)
- **Real-time Subscriptions**: Live data synchronization

### Maps & Geolocation
- **Leaflet 1.9.4**: Interactive map library
- **React-Leaflet 4.2.1**: React components for Leaflet
- **Leaflet Routing Machine**: Navigation and routing capabilities

### Development Tools
- **ESLint**: Code linting and style enforcement
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic vendor prefix handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **npm or yarn**: Package manager (npm comes with Node.js)
- **Git**: Version control system
- **Supabase Account**: [Sign up here](https://supabase.com)

### Optional Tools
- **VS Code**: Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - TailwindCSS IntelliSense
  - Prettier
- **PostgreSQL Client**: For direct database access (optional)
- **Postman**: For API testing (optional)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd IgabayCare
```

### 2. Install Dependencies

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## ⚙️ Configuration

### 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to **Settings > API** and copy:
   - Project URL
   - Anon/Public key
3. Update your `.env` file with these credentials

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the database schema:

```bash
# Copy and paste the contents of database/schema.sql into the SQL Editor
```

### 3. Authentication Configuration

1. Go to **Authentication > Settings** in Supabase dashboard
2. Configure the following:

**Site URL**: `http://localhost:5173` (for development)

**Redirect URLs**:
- `http://localhost:5173/signin`
- `http://localhost:5173/signup`
- `http://localhost:5173/patient/dashboard`
- `http://localhost:5173/clinic/dashboard`
- `http://localhost:5173/doctor/dashboard`

### 4. Storage Configuration

1. Go to **Storage** in Supabase dashboard
2. Create necessary buckets as defined in `database/fix_storage_policies.sql`
3. Apply storage policies for secure file handling

## 🎮 Usage

### Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Create a production build:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Code Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
IgabayCare/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── clinic/         # Clinic-specific components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── layout/         # Layout components (Navbar, Sidebar, etc.)
│   │   ├── patient/        # Patient-specific components
│   │   └── ui/            # Generic UI components (Button, Card, etc.)
│   ├── contexts/           # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── core/              # Core architecture modules
│   │   ├── components/    # Extensible components
│   │   ├── container/     # Dependency injection
│   │   ├── design/        # Medical design system
│   │   ├── factories/     # Component factories
│   │   ├── interfaces/    # Core interfaces
│   │   ├── layouts/       # Medical layouts
│   │   ├── providers/     # Theme providers
│   │   └── validation/    # Medical validation
│   ├── features/          # Feature-based modules
│   │   └── auth/         # Authentication feature
│   │       ├── components/ # Auth components
│   │       ├── pages/     # Auth pages
│   │       └── utils/     # Auth services
│   ├── lib/               # External library configurations
│   │   └── supabase.ts   # Supabase client setup
│   ├── pages/             # Page components
│   │   ├── clinic/       # Clinic dashboard pages
│   │   ├── doctor/       # Doctor dashboard pages
│   │   └── patient/      # Patient dashboard pages
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── database/              # Database scripts and documentation
│   ├── schema.sql        # Main database schema
│   ├── *.sql            # Migration and setup scripts
│   └── *.md             # Database documentation
├── public/               # Static assets
├── package.json          # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 📚 API Documentation

### Authentication Endpoints

The application uses Supabase Auth for user management:

- **Sign Up**: Create new user accounts with email verification
- **Sign In**: Authenticate users and create sessions
- **Sign Out**: Terminate user sessions
- **Password Reset**: Email-based password recovery

### Core Services

#### Patient Service (`patientService.ts`)
- `createPatient()`: Create new patient profiles
- `getPatient()`: Retrieve patient information
- `updatePatient()`: Update patient details
- `getPatientAppointments()`: Get patient's appointments

#### Clinic Service (`clinicService.ts`)
- `createClinic()`: Register new clinics
- `getClinic()`: Retrieve clinic information
- `updateClinic()`: Update clinic details
- `getClinicAppointments()`: Get clinic's appointments

#### Appointment Service (`appointmentService.ts`)
- `createAppointment()`: Book new appointments
- `getAppointments()`: Retrieve appointments
- `updateAppointment()`: Modify appointment details
- `cancelAppointment()`: Cancel appointments

### Database Schema

#### Key Tables

**Users Table (Supabase Auth)**
- Handles authentication and basic user information

**Patients Table**
- Patient profiles and medical information
- Linked to auth.users via user_id

**Clinics Table**
- Clinic information and business details
- Services, specialties, and operating hours

**Appointments Table**
- Appointment scheduling and management
- Links patients with clinics

**Row Level Security (RLS)**
- Ensures data privacy and access control
- Users can only access their own data

## 🔒 Security

### Authentication & Authorization
- **JWT-based Sessions**: Secure token-based authentication
- **Email Verification**: Required for account activation
- **Role-based Access Control**: Separate permissions for different user types
- **Password Security**: Secure password hashing and storage

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **HIPAA Compliance**: Medical data validation following HIPAA guidelines
- **Input Validation**: Client-side and server-side validation
- **Data Encryption**: Secure storage of sensitive information

### Security Best Practices
- **Environment Variables**: Sensitive credentials stored securely
- **HTTPS Enforcement**: Secure data transmission
- **Regular Security Updates**: Keep dependencies up to date
- **Error Handling**: Secure error messages without information leakage

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript strict mode and ESLint rules
2. **Function Size**: Keep functions under 50 lines for readability
3. **SOLID Principles**: Follow SOLID principles for maintainable architecture
4. **Component Design**: Use single responsibility principle for components
5. **Testing**: Write comprehensive tests for new features

### Commit Message Guidelines

Use clear, descriptive commit messages:

```bash
# Good examples
git commit -m "feat: add patient appointment booking functionality"
git commit -m "fix: resolve infinite re-render in clinic signup form"
git commit -m "docs: update API documentation for appointment service"
git commit -m "refactor: extract reusable UI components"

# Avoid
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "wip"
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the guidelines
4. Write or update tests as needed
5. Update documentation if necessary
6. Submit a pull request with a clear description

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid API key" Error
**Cause**: Incorrect Supabase credentials
**Solution**: 
- Verify `.env` file has correct Supabase URL and anon key
- Ensure environment variables are prefixed with `VITE_`
- Restart development server after updating `.env`

#### 2. "Table does not exist" Error
**Cause**: Database schema not applied
**Solution**:
- Run the SQL schema in Supabase SQL Editor
- Check that all tables were created successfully
- Verify database migrations are complete

#### 3. "RLS policy violation" Error
**Cause**: Row Level Security permissions issue
**Solution**:
- Ensure you're signed in with a valid user account
- Check that the user has the correct role (patient/clinic/doctor)
- Verify RLS policies are correctly configured

#### 4. Email Verification Not Working
**Cause**: Email configuration issues
**Solution**:
- Check Supabase Authentication settings
- Verify email templates are configured
- Check spam folder for verification emails
- Ensure redirect URLs are correctly set

#### 5. Map Not Loading
**Cause**: Leaflet CSS or JavaScript not loaded
**Solution**:
- Verify Leaflet CSS is imported in the main component
- Check browser console for JavaScript errors
- Ensure map container has defined height and width

### Getting Help

1. **Check Logs**: Review Supabase dashboard logs for errors
2. **Environment Variables**: Verify all required variables are set
3. **Browser Console**: Check for JavaScript errors and warnings
4. **Network Tab**: Inspect API requests and responses
5. **Documentation**: Refer to specific feature documentation in `/database/` folder

### Debugging Tips

- Use the **AuthDebugComponent** for authentication issues
- Check the **browser developer tools** for network and console errors
- Review **Supabase dashboard** for database and auth logs
- Test with a **fresh user account** to isolate user-specific issues

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase**: For providing an excellent backend-as-a-service platform
- **React Team**: For the amazing React framework
- **Leaflet**: For the interactive mapping capabilities
- **TailwindCSS**: For the utility-first CSS framework
- **TypeScript**: For type safety and developer experience

---

**Built with ❤️ by the IgabayCare Team**

For more detailed setup instructions, see [SETUP.md](SETUP.md)