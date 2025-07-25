import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Building } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../supabaseClient'; // adjust path if needed

export const ClinicRegisterForm: React.FC = () => {
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!clinicName.trim()) {
      setError('Clinic name is required');
      return;
    }

    setLoading(true);

    try {
      // 1. Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);

      // 2. Store clinic info in 'clinics' table
      const { data: insertData, error: insertError } = await supabase
        .from('clinics')
        .insert([
          {
            id: authData.user?.id, // optional: use auth UID as reference
            clinic_name: clinicName,
            email: email,
          },
        ]);

      if (insertError) throw new Error(insertError.message);

      setSuccess('Clinic registered successfully!');
      setClinicName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Registration</h1>
          <p className="text-gray-600">Register your clinic on iGabayAtiCare</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="Clinic Name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            icon={<Building size={20} className="text-gray-400" />}
            required
          />
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
          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={20} className="text-gray-400" />}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Register Clinic
          </Button>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        </form>
      </div>
    </div>
  );
};
