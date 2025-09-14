# IgabayCare - Healthcare Management System

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.0.5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-2.53.0-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

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

### 👥 Multi-Role Authentication System
- **Role-based Access Control**: Patient, Doctor, Clinic, Admin roles
- **Secure Authentication**: Email verification and password recovery
- **Profile Management**: Comprehensive user profiles with medical information

### 📅 Advanced Appointment Management
- **Smart Booking**: Real-time availability checking and conflict prevention
- **Multiple Appointment Types**: Consultation, follow-up, emergency, procedures
- **Status Tracking**: Scheduled → Confirmed → In Progress → Completed
- **Automated Notifications**: Email and SMS reminders
- **Prescription Integration**: Digital prescription creation and management

### 🏥 Comprehensive Clinic & Doctor Management
- **Clinic Discovery**: Interactive maps with nearby healthcare providers
- **Doctor Profiles**: Specializations, availability, ratings, and reviews
- **Service Catalog**: Comprehensive medical services with pricing
- **Scheduling System**: Flexible appointment slots and time management
- **Analytics Dashboard**: Patient statistics, appointment trends, revenue tracking

### 💳 Integrated Payment System
- **Adyen Payment Gateway**: Secure, PCI-compliant payment processing
- **Multiple Payment Methods**: 
  - Credit/Debit Cards (Visa, Mastercard, AMEX)
  - Digital Wallets (GCash, PayMaya, GrabPay)
  - Bank Transfers and Online Banking
- **Payment Tracking**: Transaction history and receipt management
- **Refund Management**: Automated refund processing for cancellations

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Patient statistics, appointment trends, revenue tracking
- **Medical Reports**: Comprehensive health summaries and progress tracking
- **Business Intelligence**: Clinic performance metrics and insights

### 🤖 AI-Powered Features
- **Medical Chatbot**: 24/7 health assistance and triage
- **Symptom Checker**: Preliminary health assessments
- **Smart Scheduling**: AI-optimized appointment recommendations

### 🔔 Notification System
- **Multi-Channel Notifications**: Email, SMS, and push notifications
- **Customizable Alerts**: Appointment reminders, prescription refills, health checkups
- **Real-time Updates**: Instant status changes and communications

### 🗺️ Location & Navigation
- **Interactive Maps**: Advanced clinic location visualization using Leaflet
- **Nearby Clinics**: Geolocation-based healthcare provider discovery
- **Routing & Navigation**: Integrated GPS navigation to clinics
- **Location Services**: Real-time location tracking for emergency services

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