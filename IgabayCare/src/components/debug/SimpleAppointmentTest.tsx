import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SimpleAppointmentTestProps {
  doctorId?: string;
}

export const SimpleAppointmentTest: React.FC<SimpleAppointmentTestProps> = ({ doctorId }) => {
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    const testResults: any[] = [];

    try {
      // Test 1: Direct appointment search by known ID
      console.log('🔍 Testing direct appointment access...');
      try {
        const { data: directAppointment, error: directError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', 'd95262ea-5375-4cfb-876e-0e0147c7ec6b');

        testResults.push({
          test: '1. Direct Appointment Access',
          passed: !directError && directAppointment && directAppointment.length > 0,
          message: directError 
            ? `Error: ${directError.message}` 
            : `Found ${directAppointment?.length || 0} appointments`,
          data: directAppointment
        });
      } catch (error) {
        testResults.push({
          test: '1. Direct Appointment Access',
          passed: false,
          message: `Exception: ${error}`,
          data: null
        });
      }

      // Test 2: Search by doctor_name Andrew
      console.log('🔍 Testing doctor name search...');
      try {
        const { data: nameSearch, error: nameError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_name', 'Andrew');

        testResults.push({
          test: '2. Doctor Name Search (Andrew)',
          passed: !nameError,
          message: nameError 
            ? `Error: ${nameError.message}` 
            : `Found ${nameSearch?.length || 0} appointments`,
          data: nameSearch
        });
      } catch (error) {
        testResults.push({
          test: '2. Doctor Name Search (Andrew)',
          passed: false,
          message: `Exception: ${error}`,
          data: null
        });
      }

      // Test 3: Search by doctor_id
      console.log('🔍 Testing doctor ID search...');
      try {
        const { data: idSearch, error: idError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', '415503c8-0340-4517-8ae1-7e62d75d5128');

        testResults.push({
          test: '3. Doctor ID Search (415503c8...)',
          passed: !idError,
          message: idError 
            ? `Error: ${idError.message}` 
            : `Found ${idSearch?.length || 0} appointments`,
          data: idSearch
        });
      } catch (error) {
        testResults.push({
          test: '3. Doctor ID Search (415503c8...)',
          passed: false,
          message: `Exception: ${error}`,
          data: null
        });
      }

      // Test 4: Basic table access
      console.log('🔍 Testing basic table access...');
      try {
        const { data: basicAccess, error: basicError } = await supabase
          .from('appointments')
          .select('count')
          .limit(1);

        testResults.push({
          test: '4. Basic Appointments Table Access',
          passed: !basicError,
          message: basicError 
            ? `Error: ${basicError.message}` 
            : 'Table is accessible',
          data: basicAccess
        });
      } catch (error) {
        testResults.push({
          test: '4. Basic Appointments Table Access',
          passed: false,
          message: `Exception: ${error}`,
          data: null
        });
      }

      // Test 5: Check if provided doctorId exists in doctors table
      if (doctorId) {
        console.log('🔍 Testing provided doctor ID...');
        try {
          const { data: doctorExists, error: doctorError } = await supabase
            .from('doctors')
            .select('id, full_name, email')
            .eq('id', doctorId)
            .single();

          testResults.push({
            test: '5. Provided Doctor ID Lookup',
            passed: !doctorError && !!doctorExists,
            message: doctorError 
              ? `Error: ${doctorError.message}` 
              : `Doctor: ${doctorExists?.full_name} (${doctorExists?.email})`,
            data: doctorExists
          });
        } catch (error) {
          testResults.push({
            test: '5. Provided Doctor ID Lookup',
            passed: false,
            message: `Exception: ${error}`,
            data: null
          });
        }
      } else {
        testResults.push({
          test: '5. Provided Doctor ID Lookup',
          passed: false,
          message: 'No doctor ID provided',
          data: null
        });
      }

      // Test 6: Current user
      console.log('🔍 Testing current user...');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        testResults.push({
          test: '6. Current User Authentication',
          passed: !userError && !!user,
          message: userError 
            ? `Error: ${userError.message}` 
            : user
              ? `User: ${user.email}`
              : 'Not authenticated',
          data: user
        });
      } catch (error) {
        testResults.push({
          test: '6. Current User Authentication',
          passed: false,
          message: `Exception: ${error}`,
          data: null
        });
      }

      setResults(testResults);
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTest();
  }, [doctorId]);

  const getIcon = (passed: boolean) => {
    return passed ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card className="p-6 bg-red-50 border-2 border-red-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-medium text-red-900">🚨 Simple Appointment Test</h3>
          </div>
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            {isRunning ? 'Testing...' : 'Re-run Test'}
          </Button>
        </div>

        <div className="p-3 bg-white rounded border">
          <div className="text-sm">
            <div><strong>Expected:</strong> Appointment d95262ea-5375-4cfb-876e-0e0147c7ec6b should exist</div>
            <div><strong>Expected:</strong> Doctor ID 415503c8-0340-4517-8ae1-7e62d75d5128 should have appointments</div>
            <div><strong>Provided Doctor ID:</strong> {doctorId || 'None'}</div>
          </div>
        </div>

        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white border rounded">
              {getIcon(result.passed)}
              <div className="flex-1">
                <div className="font-medium text-sm">{result.test}</div>
                <div className="text-sm text-gray-600">{result.message}</div>
                {result.data && (
                  <details className="mt-1">
                    <summary className="text-xs text-blue-600 cursor-pointer">Show data</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-32 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm text-yellow-800">
              <strong>Summary:</strong> {results.filter(r => r.passed).length}/{results.length} tests passed
              {results.filter(r => !r.passed).length > 0 && (
                <div className="mt-1">
                  <strong>Issues:</strong> {results.filter(r => !r.passed).map(r => r.test).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};