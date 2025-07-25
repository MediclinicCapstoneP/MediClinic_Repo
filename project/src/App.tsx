import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { ClinicRegisterForm } from './components/auth/ClinicRegisterForm';
import { ClinicLoginForm } from './components/auth/ClinicLoginForm';
import { PatientSignUpForm } from './components/auth/PatientSignUpForm';
import { PatientLoginForm } from './components/auth/PatientLoginForm';

// Placeholder page
const Home = () => (
  <main className="max-w-4xl mx-auto py-16 px-4">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to iGabayAtiCare</h1>
    <p className="text-lg text-gray-700 mb-8">
      Your one-stop platform for patients and clinics. Book appointments, manage your health, and connect with clinics easily.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">For Patients</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>Sign up and log in to manage your appointments</li>
          <li>Find clinics and book visits easily</li>
          <li>Access your health records</li>
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">For Clinics</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>Register your clinic to reach more patients</li>
          <li>Log in to manage appointments and schedules</li>
          <li>Grow your healthcare business</li>
        </ul>
      </div>
    </div>
  </main>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinic-register" element={<ClinicRegisterForm />} />
          <Route path="/clinic-login" element={<ClinicLoginForm />} />
          <Route path="/signup" element={<PatientSignUpForm />} />
          <Route path="/login" element={<PatientLoginForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;