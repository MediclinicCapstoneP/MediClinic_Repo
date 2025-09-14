# MediClinic Healthcare Management System

<div align="center">
  <h2>🏥 Complete Healthcare Management Ecosystem</h2>
  <p><em>Connecting patients, doctors, and clinics through modern digital solutions</em></p>
  
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-green?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Healthcare-HIPAA%20Compliant-red?style=for-the-badge" alt="HIPAA" />
</div>

---

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [🏗️ Repository Structure](#️-repository-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [📱 Applications](#-applications)
- [🔧 Development Setup](#-development-setup)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Project Overview

**MediClinic** is a comprehensive healthcare management system designed to streamline medical operations through two integrated applications:

- **🌐 IgabayCare Web Platform** - A React-based web application for healthcare providers
- **📱 MediClinic Mobile App** - A React Native mobile application for patients and on-the-go access

Our platform facilitates seamless interaction between patients, doctors, and healthcare facilities while maintaining the highest standards of data security and HIPAA compliance.

### ✨ Key Features

- **👥 Multi-role Support**: Patients, Doctors, Clinic Administrators
- **📅 Appointment Management**: Scheduling, reminders, and calendar integration
- **📋 Electronic Health Records**: Secure patient data management
- **💊 Prescription Management**: Digital prescriptions and medication tracking
- **📊 Analytics Dashboard**: Healthcare insights and reporting
- **🔒 Security First**: End-to-end encryption and HIPAA compliance
- **📱 Cross-platform**: Unified experience across web and mobile

---

## 🏗️ Repository Structure

```
MediClinic_Repo/
├── 🌐 IgabayCare/          # Web Application (React + TypeScript)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages/routes
│   │   ├── services/      # API services and integrations
│   │   ├── utils/         # Helper functions and utilities
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   ├── package.json       # Web app dependencies
│   └── README.md          # Web app documentation
│
├── 📱 project/            # Mobile Application (React Native + Expo)
│   ├── app/              # App screens and navigation
│   ├── components/       # Shared mobile components
│   ├── services/         # Mobile API services
│   ├── assets/           # Images, fonts, and media
│   ├── package.json      # Mobile app dependencies
│   └── README.md         # Mobile app documentation
│
├── 📚 docs/              # Project documentation
├── 🔧 scripts/           # Build and deployment scripts
├── .gitignore            # Git ignore patterns
└── README.md             # This file
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Expo CLI** for mobile development (optional)

### 🌐 Web Application Setup

```bash
# Navigate to the web app directory
cd IgabayCare

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

**Access at**: `http://localhost:3000`

### 📱 Mobile Application Setup

```bash
# Navigate to the mobile app directory
cd project

# Install dependencies
npm install

# Start the Expo development server
npm start
```

**Scan QR code** with Expo Go app or run on simulator

---

## 📱 Applications

### 🌐 IgabayCare Web Platform

**Technology Stack:**
- ⚛️ **React 18** with TypeScript
- 🎨 **Tailwind CSS** for styling
- 🗃️ **Supabase** for backend services
- 🔄 **React Query** for state management
- 🧭 **React Router** for navigation

**Key Features:**
- Responsive dashboard for healthcare providers
- Real-time appointment management
- Patient record management
- Analytics and reporting tools
- Multi-clinic support

[📖 **View Web App Documentation**](./IgabayCare/README.md)

### 📱 MediClinic Mobile App

**Technology Stack:**
- ⚛️ **React Native** with Expo
- 🎨 **NativeBase** UI components
- 🗃️ **Supabase** for backend services
- 🧭 **Expo Router** for navigation
- 📱 **Expo Location** for geolocation

**Key Features:**
- Patient-focused mobile interface
- Appointment booking and management
- Medication reminders
- Health record access
- Clinic locator with maps

[📖 **View Mobile App Documentation**](./project/README.md)

---

## 🔧 Development Setup

### Environment Configuration

Both applications require environment variables for proper configuration:

#### Web Application (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ENV=development
```

#### Mobile Application (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_ENV=development
```

### 🔗 Shared Services

Both applications share:
- **Supabase Backend**: Authentication, database, real-time subscriptions
- **Common APIs**: Patient data, appointments, prescriptions
- **Shared Types**: TypeScript interfaces and models
- **Security Policies**: HIPAA-compliant data handling

### 🛠️ Development Commands

| Command | Web App | Mobile App | Description |
|---------|---------|------------|--------------|
| `npm install` | ✅ | ✅ | Install dependencies |
| `npm run dev` | ✅ | - | Start dev server |
| `npm start` | - | ✅ | Start Expo dev server |
| `npm run build` | ✅ | ✅ | Build for production |
| `npm run lint` | ✅ | ✅ | Run linting checks |
| `npm test` | ✅ | ✅ | Run test suites |

---

## 📚 Documentation

- **[🌐 Web App Documentation](./IgabayCare/README.md)** - Detailed web application guide
- **[📱 Mobile App Documentation](./project/README.md)** - Mobile development guide
- **[🔐 Security Guidelines](./docs/SECURITY.md)** - HIPAA compliance and security
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment
- **[🔧 API Documentation](./docs/API.md)** - Backend API reference

---

## 🤝 Contributing

We welcome contributions to the MediClinic project! Please follow our contribution guidelines:

### 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and consistent commit messages:

```
type(scope): brief description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(appointments): add patient appointment booking"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs(readme): update setup instructions"
```

### 🔀 Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/amazing-feature`
3. **Commit** your changes using conventional commits
4. **Push** to your branch: `git push origin feat/amazing-feature`
5. **Submit** a Pull Request

### 🧪 Testing Requirements

- Write tests for new features
- Ensure existing tests pass
- Maintain code coverage above 80%
- Test across different devices and browsers

### 🔒 Security & Compliance

- Follow HIPAA compliance guidelines
- Never commit sensitive data or API keys
- Use environment variables for configuration
- Implement proper error handling
- Follow secure coding practices

---

## 📞 Support & Contact

- **📧 Email**: support@mediclinic.com
- **🐛 Issues**: [GitHub Issues](https://github.com/your-org/mediclinic/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-org/mediclinic/discussions)
- **📚 Wiki**: [Project Wiki](https://github.com/your-org/mediclinic/wiki)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ for healthcare professionals and patients worldwide</p>
  <p><strong>MediClinic Team</strong></p>
  
  <br>
  
  <img src="https://img.shields.io/badge/Health-First-green" alt="Health First" />
  <img src="https://img.shields.io/badge/Privacy-Protected-blue" alt="Privacy Protected" />
  <img src="https://img.shields.io/badge/Quality-Assured-yellow" alt="Quality Assured" />
</div>
