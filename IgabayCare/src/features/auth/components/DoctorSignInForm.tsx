import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';

interface DoctorSignInFormProps {
  onSuccess?: () => void;
}

export const DoctorSignInForm: React.FC<DoctorSignInFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      console.log('DoctorSignInForm: handleSubmit called');
      e.preventDefault();
      
      if (isLoading) {
        console.log('DoctorSignInForm: Already loading, ignoring submit');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      console.log('DoctorSignInForm: Starting sign in process with email:', formData.email);
      const result = await roleBasedAuthService.doctor.signIn(formData);
      
      if (result.success) {
        console.log('Doctor sign in successful');
        onSuccess?.();
      } else {
        console.error('Doctor sign in failed:', result.error);
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Doctor</h2>
          <p className="text-gray-600">Sign in to your medical dashboard</p>
        </div>

        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <h3 className="text-xl font-semibold text-gray-900">Doctor Sign In</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} action="#" className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isLoading}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Forgot password?{' '}
                <Link
                  to="#"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Click here to reset
                </Link>
              </p>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Doctor accounts are created by clinic administrators
                </p>
                <p className="text-sm text-gray-600">
                  Are you a patient?{' '}
                  <Link
                    to="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Patient Sign In
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 