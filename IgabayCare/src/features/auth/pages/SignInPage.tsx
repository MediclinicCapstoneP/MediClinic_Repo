import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInForm } from '../components/SignInForm';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to patient dashboard after successful login
    navigate('/patient/dashboard');
  };

  return (
    <SignInForm onSuccess={handleSuccess} />
  );
};

export default SignInPage; 