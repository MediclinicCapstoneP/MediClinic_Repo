import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService, validateSignUpData } from '../utils/authService';

interface SignUpFormProps {
  onSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const signUpData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: 'patient' as const,
    };

    const validation = validateSignUpData(signUpData);
    if (!validation.isValid) {
      setError(validation.errors[0]); // Show first error
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp(signUpData);
      
      if (result.success) {
        setSuccess('Patient registered successfully! Please check your email to verify your account.');
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 to-secondary-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-primary-100">
        <div className="text-center mb-8">
          <div className="mx-auto p-3 bg-gradient-secondary rounded-2xl w-fit mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Patient Account</h1>
          <p className="text-muted-foreground">Join iGabayAtiCare as a patient</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
            <Input
              type="text"
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
          </div>

          <Input
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            icon={<Mail size={20} className="text-gray-400" />}
            required
            placeholder="patient@example.com"
          />
          
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              icon={<Lock size={20} className="text-gray-400" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              icon={<Lock size={20} className="text-gray-400" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
                At least 8 characters
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                One uppercase letter
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`} />
                One number
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
              required
            />
            <label className="text-sm text-gray-600">
              I agree to the{' '}
              <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                Privacy Policy
              </button>
            </label>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            loading={loading}
          >
            Create Account
          </Button>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
              {success}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              type="button" 
              className="text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => window.location.href = '/signin'}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}; 