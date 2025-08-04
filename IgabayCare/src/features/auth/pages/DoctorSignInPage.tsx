import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorSignInForm } from '../components/DoctorSignInForm';

const DoctorSignInPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/doctors-dashboard');
  };

  return (
    <DoctorSignInForm onSuccess={handleSuccess} />
  );
};

export default DoctorSignInPage; 