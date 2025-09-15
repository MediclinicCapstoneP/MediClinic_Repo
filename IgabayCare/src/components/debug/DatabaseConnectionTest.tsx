import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const DatabaseConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Basic connection
      console.log('🔌 Testing basic database connection...');
      const { error: connectionError } = await supabase.from('appointments').select('count', { count: 'exact', head: true });
      
      results.tests.basicConnection = {
        success: !connectionError,
        error: connectionError?.message
      };

      // Test 2: Get appointments count
      console.log('📊 Getting appointments count...');
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
      
      results.tests.appointmentsCount = {
        count: count || 0,
        error: countError?.message
      };

      // Test 3: Fetch first 5 appointments
      console.log('📋 Fetching sample appointments...');
      const { data: sampleAppointments, error: sampleError } = await supabase
        .from('appointments')
        .select('id, doctor_id, doctor_name, appointment_date, patient_id')
        .limit(5);

      results.tests.sampleAppointments = {
        count: sampleAppointments?.length || 0,
        data: sampleAppointments,
        error: sampleError?.message
      };

      // Test 4: Check doctors table
      console.log('👨‍⚕️ Testing doctors table...');
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .limit(5);

      results.tests.doctorsTable = {
        count: doctors?.length || 0,
        data: doctors,
        error: doctorsError?.message
      };

      // Test 5: Check patients table
      console.log('🤒 Testing patients table...');
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, full_name')
        .limit(5);

      results.tests.patientsTable = {
        count: patients?.length || 0,
        data: patients,
        error: patientsError?.message
      };

      // Test 6: Test specific doctor query
      console.log('🔍 Testing specific doctor query...');
      const { data: andrewDoctor, error: andrewError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', '415503c8-0340-4517-8ae1-7e62d75d5128')
        .single();

      results.tests.andrewDoctor = {
        found: !andrewError && andrewDoctor,
        data: andrewDoctor,
        error: andrewError?.message
      };

      // Test 7: Test appointments for specific doctor
      console.log('📅 Testing appointments for Andrew...');
      const { data: andrewAppointments, error: andrewApptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', '415503c8-0340-4517-8ae1-7e62d75d5128');

      results.tests.andrewAppointments = {
        count: andrewAppointments?.length || 0,
        data: andrewAppointments,
        error: andrewApptError?.message
      };

      // Test 8: Test appointments by doctor name
      console.log('👨‍⚕️ Testing appointments by doctor name...');
      const { data: nameAppointments, error: nameError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_name', 'Andrew');

      results.tests.appointmentsByName = {
        count: nameAppointments?.length || 0,
        data: nameAppointments,
        error: nameError?.message
      };

    } catch (error) {
      results.error = (error as Error).message;
      console.error('❌ Database connection test failed:', error);
    }

    console.log('🔬 Full database test results:', results);
    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
        
        {loading && (
          <div className="text-center py-4">
            <div className="text-blue-600">Running comprehensive database tests...</div>
          </div>
        )}

        {testResults && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Test run at: {new Date(testResults.timestamp).toLocaleString()}
            </div>

            {testResults.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-red-800 font-medium">Global Error:</div>
                <div className="text-red-700 text-sm">{testResults.error}</div>
              </div>
            )}

            <div className="grid gap-3">
              {Object.entries(testResults.tests || {}).map(([testName, testResult]: [string, any]) => (
                <div key={testName} className={`border rounded p-3 ${
                  testResult.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">
                      {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <div className={`px-2 py-1 rounded text-xs ${
                      testResult.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {testResult.error ? '❌ Failed' : '✅ Success'}
                    </div>
                  </div>

                  {testResult.error && (
                    <div className="text-red-700 text-sm mb-2">
                      Error: {testResult.error}
                    </div>
                  )}

                  {testResult.count !== undefined && (
                    <div className="text-sm">
                      <strong>Count:</strong> {testResult.count}
                    </div>
                  )}

                  {testResult.found !== undefined && (
                    <div className="text-sm">
                      <strong>Found:</strong> {testResult.found ? 'Yes' : 'No'}
                    </div>
                  )}

                  {testResult.data && testResult.data.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600">
                        Show sample data ({testResult.data.length} items)
                      </summary>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(testResult.data.slice(0, 2), null, 2)}
                      </pre>
                    </details>
                  )}

                  {testResult.data && !Array.isArray(testResult.data) && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600">
                        Show data
                      </summary>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={runConnectionTest} disabled={loading} size="sm">
                Re-run Tests
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔬 Full Database Test Results:', testResults);
                  alert('Full test results logged to console');
                }}
                variant="outline"
                size="sm"
              >
                Export to Console
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionTest;