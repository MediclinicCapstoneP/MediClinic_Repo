import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignUpForm } from '../components/SignUpForm';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to patient dashboard after successful registration
    navigate('/patient/dashboard');
  };

  return (
    <SignUpForm onSuccess={handleSuccess} />
  );
};

export default SignUpPage; 