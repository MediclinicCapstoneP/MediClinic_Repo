import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, Database, Search, CheckCircle, XCircle } from 'lucide-react';

interface DoctorAppointmentDiagnosticProps {
  doctorId?: string;
}

export const DoctorAppointmentDiagnostic: React.FC<DoctorAppointmentDiagnosticProps> = ({ doctorId }) => {
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results: any[] = [];

    try {
      // Test 1: Check the doctorId being passed
      results.push({
        test: 'Doctor ID Parameter',
        status: doctorId ? 'passed' : 'failed',
        message: `Doctor ID provided: ${doctorId || 'None'}`,
        data: { providedDoctorId: doctorId }
      });

      // Test 2: Check if this exact doctor exists
      if (doctorId) {
        try {
          const { data: doctorCheck, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', doctorId)
            .single();

          results.push({
            test: 'Doctor Existence Check',
            status: !doctorError && doctorCheck ? 'passed' : 'failed',
            message: doctorError 
              ? `Doctor not found: ${doctorError.message}`
              : `Doctor found: ${doctorCheck?.full_name} (${doctorCheck?.email})`,
            data: doctorCheck || { error: doctorError }
          });
        } catch (error) {
          results.push({
            test: 'Doctor Existence Check',
            status: 'failed',
            message: `Error checking doctor: ${error}`,
            data: { error }
          });
        }
      }

      // Test 3: Look for the specific appointment from your database
      const knownAppointmentId = 'd95262ea-5375-4cfb-876e-0e0147c7ec6b';
      try {
        const { data: knownAppointment, error: knownError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', knownAppointmentId)
          .single();

        results.push({
          test: 'Known Appointment Check',
          status: !knownError && knownAppointment ? 'passed' : 'failed',
          message: knownError 
            ? `Known appointment not accessible: ${knownError.message}`
            : `Known appointment found: Doctor ID = ${knownAppointment?.doctor_id}, Doctor Name = ${knownAppointment?.doctor_name}`,
          data: knownAppointment || { error: knownError }
        });
      } catch (error) {
        results.push({
          test: 'Known Appointment Check',
          status: 'failed',
          message: `Error accessing known appointment: ${error}`,
          data: { error }
        });
      }

      // Test 4: Search for appointments with doctor_name "Andrew"
      try {
        const { data: andrewAppointments, error: andrewError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_name', 'Andrew');

        results.push({
          test: 'Andrew Appointments Search',
          status: !andrewError ? 'passed' : 'failed',
          message: andrewError 
            ? `Error searching for Andrew appointments: ${andrewError.message}`
            : `Found ${andrewAppointments?.length || 0} appointments for doctor name "Andrew"`,
          data: { count: andrewAppointments?.length || 0, appointments: andrewAppointments }
        });
      } catch (error) {
        results.push({
          test: 'Andrew Appointments Search',
          status: 'failed',
          message: `Error searching Andrew appointments: ${error}`,
          data: { error }
        });
      }

      // Test 5: Search by the specific doctor_id from the database
      const knownDoctorId = '415503c8-0340-4517-8ae1-7e62d75d5128';
      try {
        const { data: doctorIdAppointments, error: doctorIdError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', knownDoctorId);

        results.push({
          test: 'Known Doctor ID Appointments',
          status: !doctorIdError ? 'passed' : 'failed',
          message: doctorIdError 
            ? `Error searching by doctor_id: ${doctorIdError.message}`
            : `Found ${doctorIdAppointments?.length || 0} appointments for doctor_id "${knownDoctorId}"`,
          data: { 
            searchedDoctorId: knownDoctorId,
            count: doctorIdAppointments?.length || 0, 
            appointments: doctorIdAppointments,
            matchesProvidedId: doctorId === knownDoctorId
          }
        });
      } catch (error) {
        results.push({
          test: 'Known Doctor ID Appointments',
          status: 'failed',
          message: `Error searching by known doctor_id: ${error}`,
          data: { error }
        });
      }

      // Test 6: Check RLS policies on appointments table
      try {
        const { data: rlsCheck, error: rlsError } = await supabase
          .from('appointments')
          .select('count');

        results.push({
          test: 'Appointments Table RLS Check',
          status: !rlsError ? 'passed' : 'warning',
          message: rlsError 
            ? `RLS may be blocking access: ${rlsError.message}`
            : 'Can access appointments table (RLS allows access)',
          data: { error: rlsError, canAccess: !rlsError }
        });
      } catch (error) {
        results.push({
          test: 'Appointments Table RLS Check',
          status: 'failed',
          message: `RLS check failed: ${error}`,
          data: { error }
        });
      }

      // Test 7: Compare provided doctorId vs known doctorId
      if (doctorId) {
        results.push({
          test: 'Doctor ID Comparison',
          status: doctorId === knownDoctorId ? 'passed' : 'warning',
          message: doctorId === knownDoctorId 
            ? 'Provided doctor ID matches the appointment doctor ID'
            : `ID mismatch: Provided="${doctorId}", Expected="${knownDoctorId}"`,
          data: {
            providedDoctorId: doctorId,
            knownDoctorId: knownDoctorId,
            matches: doctorId === knownDoctorId
          }
        });
      }

      // Test 8: Check current user authentication
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        results.push({
          test: 'Authentication Status',
          status: !authError && user ? 'passed' : 'warning',
          message: authError 
            ? `Auth error: ${authError.message}`
            : user 
              ? `Authenticated as: ${user.email} (ID: ${user.id})`
              : 'Not authenticated',
          data: { 
            user: user ? { id: user.id, email: user.email } : null,
            error: authError 
          }
        });
      } catch (error) {
        results.push({
          test: 'Authentication Status',
          status: 'failed',
          message: `Auth check failed: ${error}`,
          data: { error }
        });
      }

      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, [doctorId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="p-6 border-2 border-orange-200 bg-orange-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-medium text-orange-900">Doctor Appointment Diagnostic</h3>
          </div>
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            size="sm"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Database className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Diagnosing...' : 'Re-run Diagnostic'}
          </Button>
        </div>

        {/* Key Info */}
        <div className="p-3 bg-white rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 mb-2">Expected vs Actual</h4>
          <div className="text-sm space-y-1">
            <div><strong>Expected Doctor ID:</strong> 415503c8-0340-4517-8ae1-7e62d75d5128</div>
            <div><strong>Expected Appointment ID:</strong> d95262ea-5375-4cfb-876e-0e0147c7ec6b</div>
            <div><strong>Provided Doctor ID:</strong> {doctorId || 'None'}</div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {diagnosticResults.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
              {getStatusIcon(result.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{result.test}</div>
                <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-orange-600 cursor-pointer">View Raw Data</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">🔍 Diagnostic Recommendations</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Check if the provided doctorId matches the expected ID (415503c8-0340-4517-8ae1-7e62d75d5128)</li>
            <li>• Verify that Row Level Security (RLS) is not blocking appointments access</li>
            <li>• Ensure the user has proper authentication and permissions</li>
            <li>• Run the database fix scripts if appointments aren't being found</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};