import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicSignUpForm } from '../components/ClinicSignUpForm';

const ClinicSignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to clinic dashboard after successful registration
    navigate('/clinic/dashboard');
  };

  return (
    <ClinicSignUpForm onSuccess={handleSuccess} />
  );
};

export default ClinicSignUpPage; 