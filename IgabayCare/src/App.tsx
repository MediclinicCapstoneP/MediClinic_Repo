import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LearnMore from './pages/LearnMore';
import SignInPage from './features/auth/pages/SignInPage';
import SignUpPage from './features/auth/pages/SignUpPage';
import ClinicSignInPage from './features/auth/pages/ClinicSignInPage';
import ClinicSignUpPage from './features/auth/pages/ClinicSignUpPage';
import AuthCallback from './features/auth/pages/AuthCallback';
import PatientDashboard from './pages/patient/PatientDashboard';
import { ClinicDashboard } from './pages/clinic/ClinicDashboard';
import { FloatingChatBot } from './components/ui/FloatingChatBot';
import DoctorSignUpPage from './features/auth/pages/DoctorSignUpPage';
import DoctorSignInPage from './features/auth/pages/DoctorSignInPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { MedicalThemeProvider } from './core/providers/MedicalThemeProvider';
import DebugPage from './pages/DebugPage';

// Import environment checker in development
if (import.meta.env.DEV) {
  import('./utils/envChecker');
}

// Placeholder page
const App: React.FC = () => {
  return (
    <MedicalThemeProvider defaultTheme="light" defaultRole="patient">
      <Router>
        <div className="min-h-screen bg-gray-50">
      
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/clinic-signin" element={<ClinicSignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/clinic-signup" element={<ClinicSignUpPage />} />
            <Route path="/doctor-signup" element={<DoctorSignUpPage />} />
            <Route path="/doctor-signin" element={<DoctorSignInPage />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
            <Route path="/doctors-dashboard" element={<DoctorDashboard />} />
            {/* Debug route - remove in production */}
            {import.meta.env.DEV && <Route path="/debug" element={<DebugPage />} />}
          </Routes>
          
          {/* Global Floating ChatBot */}
          <FloatingChatBot />
        </div>
      </Router>
    </MedicalThemeProvider>
  );
};

export default App;