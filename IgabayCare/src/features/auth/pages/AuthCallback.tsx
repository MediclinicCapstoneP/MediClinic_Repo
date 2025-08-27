import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../supabaseClient';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Email verification failed. Please try again or contact support.');
          return;
        }

        if (data.session) {
          console.log('Email verification successful, processing user profile...');
          
          // Check user role and create profile if needed
          const userRole = data.session.user.user_metadata?.role;
          
          if (userRole === 'clinic') {
            // For clinic users, try to create profile from stored registration data
            setMessage('Email verified! Setting up your clinic profile...');
            
            try {
              const profileResult = await roleBasedAuthService.clinic.createClinicProfileFromMetadata(data.session.user);
              
              if (profileResult.success) {
                console.log('Clinic profile created successfully from stored data');
                setStatus('success');
                setMessage('Email verified and clinic profile created successfully! You can now access your dashboard.');
              } else {
                console.error('Failed to create clinic profile:', profileResult.error);
                // Still consider verification successful, user can complete profile later
                setStatus('success');
                setMessage('Email verified successfully! Please complete your clinic profile to get started.');
              }
            } catch (profileError) {
              console.error('Exception during profile creation:', profileError);
              // Still consider verification successful
              setStatus('success');
              setMessage('Email verified successfully! Please complete your clinic profile to get started.');
            }
          } else {
            // For other user types (patient, doctor)
            setStatus('success');
            setMessage('Email verified successfully! You can now access your dashboard.');
          }
          
          const redirectPath = userRole === 'clinic' ? '/clinic/dashboard' : 
                              userRole === 'doctor' ? '/doctor/dashboard' : 
                              '/patient/dashboard';
          
          // Redirect to appropriate dashboard after 3 seconds
          setTimeout(() => {
            navigate(redirectPath);
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Verification link is invalid or has expired. Please try signing up again.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-primary-100 text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {getTitle()}
        </h1>
        
        <p className="text-muted-foreground mb-6">
          {message}
        </p>

        {status === 'success' && (
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-green-700 text-sm">
              Redirecting you to your dashboard in a few seconds...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Button 
              variant="gradient" 
              onClick={() => navigate('/signup')}
              className="w-full"
            >
              Try Signing Up Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/signin')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </div>
        )}

        {status === 'success' && (
          <Button 
            variant="gradient" 
            onClick={async () => {
              const { data: sessionData } = await supabase.auth.getSession();
              const userRole = sessionData.session?.user.user_metadata?.role;
              const redirectPath = userRole === 'clinic' ? '/clinic/dashboard' : 
                                 userRole === 'doctor' ? '/doctor/dashboard' : 
                                 '/patient/dashboard';
              navigate(redirectPath);
            }}
            className="w-full"
          >
            Go to Dashboard Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 