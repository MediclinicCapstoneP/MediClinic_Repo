import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpForm } from '../components/SignUpForm';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SignUpForm />
  );
};

export default SignUpPage; 