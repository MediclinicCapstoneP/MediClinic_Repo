import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClinicSignInForm } from '../components/ClinicSignInForm';

const ClinicSignInPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to clinic dashboard after successful login
    navigate('/clinic/dashboard');
  };

  return (
    <ClinicSignInForm onSuccess={handleSuccess} />
  );
};

export default ClinicSignInPage; 