import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicSignUpForm } from '../components/ClinicSignUpForm';

const ClinicSignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Don't redirect automatically - user needs to verify email first
    // navigate('/clinic/dashboard');
  };

  return (
    <ClinicSignUpForm onSuccess={handleSuccess} />
  );
};

export default ClinicSignUpPage; 