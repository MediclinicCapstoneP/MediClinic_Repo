import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ClinicLoginForm: React.FC = () => {
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
      // TODO: Replace with actual login logic (e.g., call Supabase login with clinic role)
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Login</h1>
          <p className="text-gray-600">Sign in to your clinic account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Clinic Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} className="text-gray-400" />}
            required
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
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Login
          </Button>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </form>
      </div>
    </div>
  );
}; 