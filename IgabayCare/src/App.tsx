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
import PaymentReturn from './pages/patient/PaymentReturn';
import { ClinicDashboard } from './pages/clinic/ClinicDashboard';
// Voiceflow chatbot now integrated via HTML script - removing old FloatingChatBot
// import { FloatingChatBot } from './components/ui/FloatingChatBot';
import DoctorSignUpPage from './features/auth/pages/DoctorSignUpPage';
import DoctorSignInPage from './features/auth/pages/DoctorSignInPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { MedicalThemeProvider } from './core/providers/MedicalThemeProvider';
import { EnhancedFloatingChatButton } from './components/chatbot/EnhancedFloatingChatButton';
import ChatPage from './pages/ChatPage';
import DebugPage from './pages/DebugPage';
import ChatbotTestPage from './pages/ChatbotTestPage';
import AppointmentDisplayTestPage from './pages/AppointmentDisplayTestPage';
import PaymentDebugPage from './pages/PaymentDebugPage';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import PushNotificationTest from './pages/PushNotificationTest';
import { NotificationProvider } from './contexts/NotificationContext';

// Import environment checker in development
if (import.meta.env.DEV) {
  import('./utils/envChecker');
}

// Placeholder page
const App: React.FC = () => {
  return (
    <MedicalThemeProvider defaultTheme="light" defaultRole="patient">
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-blue-50">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative">
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
                <Route path="/patient/medical-history" element={<MedicalHistoryPage />} />
                <Route path="/patient/payment-return" element={<PaymentReturn />} />
                <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
                <Route path="/doctors-dashboard" element={<DoctorDashboard />} />
                {/* Debug route - remove in production */}
                {import.meta.env.DEV && <Route path="/debug" element={<DebugPage />} />}
                {/* Appointment display test route - remove in production */}
                {import.meta.env.DEV && <Route path="/appointment-display-test" element={<AppointmentDisplayTestPage />} />}
                {/* Payment debug route - remove in production */}
                {import.meta.env.DEV && <Route path="/payment-debug" element={<PaymentDebugPage />} />}
                {import.meta.env.DEV && <Route path="/chat" element={<ChatPage />} />}
                {import.meta.env.DEV && <Route path="/chatbot-test" element={<ChatbotTestPage />} />}
                {import.meta.env.DEV && <Route path="/push-notification-test" element={<PushNotificationTest />} />}
              </Routes>
              <EnhancedFloatingChatButton />
            </div>
          </div>
        </Router>
      </NotificationProvider>
    </MedicalThemeProvider>
  );
};

export default App;