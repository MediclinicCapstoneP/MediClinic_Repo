import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../utils/authService';

interface SignInFormProps {
  onSuccess?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authService.signIn({ email, password });
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 to-secondary-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-primary-100">
        <div className="text-center mb-8">
          <div className="mx-auto p-3 bg-gradient-primary rounded-2xl w-fit mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your patient account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} className="text-gray-400" />}
            required
            placeholder="patient@example.com"
          />
          
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Remember me
            </label>
            <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Forgot password?
            </button>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            loading={loading}
          >
            Sign In
          </Button>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              type="button" 
              className="text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => window.location.href = '/signup'}
            >
              Sign up here
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Are you a clinic?{' '}
            <button 
              type="button" 
              className="text-secondary-600 hover:text-secondary-700 font-medium"
              onClick={() => window.location.href = '/clinic-signin'}
            >
              Sign in to clinic portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}; 