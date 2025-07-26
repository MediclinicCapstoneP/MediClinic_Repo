import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LearnMore from './pages/LearnMore';
import SignInPage from './features/auth/pages/SignInPage';
import SignUpPage from './features/auth/pages/SignUpPage';
import ClinicSignUpPage from './features/auth/pages/ClinicSignUpPage';
import { ClinicHome } from './pages/clinic/ClinicHome';

// Placeholder page
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
    
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/clinic-signup" element={<ClinicSignUpPage />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/clinic-home" element={<ClinicHome />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;