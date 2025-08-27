import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';

export const ClinicSignInForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await roleBasedAuthService.clinic.signIn(formData);
      
      if (result.success) {
        console.log('Clinic sign in successful');
        navigate('/clinic/dashboard');
      } else {
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
          <div className="mx-auto h-16 w-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-secondary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your clinic dashboard</p>
        </div>

        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <h3 className="text-xl font-semibold text-gray-900">Clinic Sign In</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have a clinic account?{' '}
                <Link
                  to="/clinic-signup"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Register your clinic
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 