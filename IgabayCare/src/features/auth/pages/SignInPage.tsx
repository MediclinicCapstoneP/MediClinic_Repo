import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignInForm } from '../components/SignInForm';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get role from URL params (e.g., /signin?role=clinic)
  const roleParam = searchParams.get('role') as 'patient' | 'clinic' | null;
  const defaultRole = roleParam === 'clinic' ? 'clinic' : 'patient';

  const handleSuccess = () => {
    // Redirect based on role after successful login
    if (defaultRole === 'clinic') {
      navigate('/clinic/dashboard');
    } else {
      navigate('/patient/dashboard');
    }
  };

  return (
    <SignInForm 
      defaultRole={defaultRole}
      onSuccess={handleSuccess}
    />
  );
};

export default SignInPage; 