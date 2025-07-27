import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignUpForm } from '../components/SignUpForm';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Don't redirect automatically - user needs to verify email first
    // navigate('/patient/dashboard');
  };

  return (
    <SignUpForm onSuccess={handleSuccess} />
  );
};

export default SignUpPage; 