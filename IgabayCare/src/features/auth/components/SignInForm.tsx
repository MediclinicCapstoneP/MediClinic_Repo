import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, AlertCircle, Shield, Lock, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';

interface SignInFormProps {
  onSuccess?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting patient sign in with email:', formData.email);
      const result = await roleBasedAuthService.patient.signIn({
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        console.log('Patient sign in successful, redirecting to dashboard');
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect to patient dashboard
          navigate('/patient/dashboard');
        }
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Sign in to your patient dashboard</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-500">Secure HIPAA-compliant login</span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border border-blue-100 rounded-3xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Patient Sign In</h3>
            <p className="text-sm text-gray-600">Access your medical dashboard</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} action="#" className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center gap-3 animate-shake">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Sign in failed</div>
                    <div className="text-xs text-red-600 mt-1">{error}</div>
                  </div>
                </div>
              )}

              <div className={`space-y-2 transition-all duration-200 ${focusedField === 'email' ? 'transform scale-105' : ''}`}>
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className={`border-2 ${focusedField === 'email' ? 'border-blue-500 shadow-lg' : 'border-gray-200'} rounded-xl px-4 py-3 transition-all duration-200`}
                />
              </div>

              <div className={`space-y-2 transition-all duration-200 ${focusedField === 'password' ? 'transform scale-105' : ''}`}>
                <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Lock className="h-4 w-4 mr-2 text-blue-500" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={`border-2 pr-12 ${focusedField === 'password' ? 'border-blue-500 shadow-lg' : 'border-gray-200'} rounded-xl px-4 py-3 transition-all duration-200`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1 rounded-lg hover:bg-blue-50"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:scale-100"
                loading={isLoading}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-5 w-5" />
                Sign In Securely
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have a patient account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors underline decoration-2 hover:decoration-blue-500"
                  >
                    Register here
                  </Link>
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Are you a healthcare provider?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/clinic-signin"
                    className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 hover:shadow-md"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Clinic Portal
                  </Link>
                  <Link
                    to="/doctor-signin"
                    className="inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-all duration-200 hover:shadow-md"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Doctor Portal
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security badges */}
        <div className="flex items-center justify-center space-x-6 mt-6 text-xs text-gray-500">
          <div className="flex items-center">
            <Shield className="h-3 w-3 mr-1 text-green-500" />
            HIPAA Compliant
          </div>
          <div className="flex items-center">
            <Lock className="h-3 w-3 mr-1 text-blue-500" />
            End-to-End Encrypted
          </div>
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1 text-purple-500" />
            Verified Providers
          </div>
        </div>
      </div>

      {/* CSS-in-JS styles moved to inline for better compatibility */}
    </div>
  );
};
