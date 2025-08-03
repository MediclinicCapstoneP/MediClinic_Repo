import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorSignUpForm } from '../components/DoctorSignUpForm';

const DoctorSignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Don't redirect automatically - user needs to verify email first
    // navigate('/doctor/dashboard');
  };

  return (
    <DoctorSignUpForm />
  );
};

export default DoctorSignUpPage; 