/**
 * Authentication Debug Component
 * Temporary component to help diagnose and fix authentication issues
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { testDataService, TEST_USERS } from '../../utils/testDataService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { supabase } from '../../supabaseClient';

export const AuthDebugComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const checkSupabaseConnection = async () => {
    addResult('Checking Supabase connection...', 'info');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addResult(`Supabase connection error: ${error.message}`, 'error');
        setSupabaseStatus({ connected: false, error: error.message });
      } else {
        addResult('✅ Supabase connection successful', 'success');
        setSupabaseStatus({ connected: true, session: data.session });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Supabase connection exception: ${errorMessage}`, 'error');
      setSupabaseStatus({ connected: false, error: errorMessage });
    }
  };

  const createTestUsers = async () => {
    setIsLoading(true);
    addResult('Starting test user creation...', 'info');
    
    try {
      const results = await testDataService.createAllTestUsers();
      
      if (results.patient?.success) {
        addResult('✅ Patient test user created successfully', 'success');
      } else {
        addResult(`❌ Patient creation failed: ${results.patient?.error}`, 'error');
      }

      if (results.clinic?.success) {
        addResult('✅ Clinic test user created successfully', 'success');
      } else {
        addResult(`❌ Clinic creation failed: ${results.clinic?.error}`, 'error');
      }

      if (results.doctor?.success) {
        addResult('✅ Doctor test user created successfully', 'success');
      } else {
        addResult(`❌ Doctor creation failed: ${results.doctor?.error}`, 'error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Exception during user creation: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testSignIns = async () => {
    setIsLoading(true);
    addResult('Testing sign-ins...', 'info');
    
    try {
      const results = await testDataService.testAllSignIns();
      
      if (results.patient?.success) {
        addResult('✅ Patient sign-in successful', 'success');
      } else {
        addResult(`❌ Patient sign-in failed: ${results.patient?.error}`, 'error');
      }

      if (results.clinic?.success) {
        addResult('✅ Clinic sign-in successful', 'success');
      } else {
        addResult(`❌ Clinic sign-in failed: ${results.clinic?.error}`, 'error');
      }

      if (results.doctor?.success) {
        addResult('✅ Doctor sign-in successful', 'success');
      } else {
        addResult(`❌ Doctor sign-in failed: ${results.doctor?.error}`, 'error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Exception during sign-in testing: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    addResult('Checking current user...', 'info');
    try {
      const userData = await roleBasedAuthService.getCurrentUser();
      if (userData) {
        addResult(`✅ Current user: ${userData.user.email} (Role: ${userData.role})`, 'success');
      } else {
        addResult('ℹ️ No user currently signed in', 'info');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Error checking current user: ${errorMessage}`, 'error');
    }
  };

  const signOut = async () => {
    addResult('Signing out...', 'info');
    try {
      const result = await roleBasedAuthService.signOut();
      if (result.success) {
        addResult('✅ Sign out successful', 'success');
      } else {
        addResult(`❌ Sign out failed: ${result.error}`, 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Exception during sign out: ${errorMessage}`, 'error');
    }
  };

  const displayCredentials = () => {
    addResult('=== TEST CREDENTIALS ===', 'info');
    addResult(`Patient: ${TEST_USERS.patient.email} / ${TEST_USERS.patient.password}`, 'info');
    addResult(`Clinic: ${TEST_USERS.clinic.email} / ${TEST_USERS.clinic.password}`, 'info');
    addResult(`Doctor: ${TEST_USERS.doctor.email} / ${TEST_USERS.doctor.password}`, 'info');
    addResult('========================', 'info');
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Authentication Debug Tool</h2>
          <p className="text-gray-600">Use this tool to diagnose and fix authentication issues</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              onClick={checkSupabaseConnection}
              variant="outline"
              disabled={isLoading}
            >
              Check Connection
            </Button>
            
            <Button 
              onClick={createTestUsers}
              variant="medical"
              disabled={isLoading}
              loading={isLoading}
            >
              Create Test Users
            </Button>
            
            <Button 
              onClick={testSignIns}
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
            >
              Test Sign-ins
            </Button>
            
            <Button 
              onClick={checkCurrentUser}
              variant="outline"
              disabled={isLoading}
            >
              Check Current User
            </Button>
            
            <Button 
              onClick={signOut}
              variant="outline"
              disabled={isLoading}
            >
              Sign Out
            </Button>
            
            <Button 
              onClick={displayCredentials}
              variant="ghost"
              disabled={isLoading}
            >
              Show Credentials
            </Button>
          </div>

          {/* Clear Results Button */}
          <div className="flex justify-end">
            <Button 
              onClick={clearResults}
              variant="ghost"
              size="sm"
            >
              Clear Results
            </Button>
          </div>

          {/* Supabase Status */}
          {supabaseStatus && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold">Supabase Status</h3>
              </CardHeader>
              <CardContent>
                <div className={`p-3 rounded-lg border ${supabaseStatus.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`font-medium ${supabaseStatus.connected ? 'text-green-700' : 'text-red-700'}`}>
                    {supabaseStatus.connected ? '✅ Connected' : '❌ Connection Failed'}
                  </p>
                  {supabaseStatus.error && (
                    <p className="text-red-600 text-sm mt-1">Error: {supabaseStatus.error}</p>
                  )}
                  {supabaseStatus.session && (
                    <p className="text-green-600 text-sm mt-1">Session: Active</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {results.length > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold">Debug Results</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-2 rounded-lg border text-sm ${getResultColor(result.type)}`}
                    >
                      <span className="text-xs text-gray-500">[{result.timestamp}]</span>
                      <span className="ml-2">{result.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Instructions</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Steps to fix authentication issues:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>First, check the Supabase connection</li>
              <li>Create test users (this will create users with confirmed emails)</li>
              <li>Test sign-ins to verify authentication is working</li>
              <li>If issues persist, check the browser console for detailed errors</li>
              <li>Make sure your Supabase environment variables are correctly set</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> This debug component should only be used in development. 
              Remove it before deploying to production.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};