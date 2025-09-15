import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { doctorDashboardService } from '../../features/auth/utils/doctorDashboardService';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, User } from 'lucide-react';

interface ValidationResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

interface ComprehensiveAppointmentValidatorProps {
  doctorId?: string;
}

export const ComprehensiveAppointmentValidator: React.FC<ComprehensiveAppointmentValidatorProps> = ({ doctorId }) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ passed: number; failed: number; warnings: number }>({ passed: 0, failed: 0, warnings: 0 });

  const runValidation = async () => {
    setIsRunning(true);
    const results: ValidationResult[] = [];

    try {
      // Test 1: Database Connection
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('appointments')
          .select('count')
          .limit(1);
        
        results.push({
          test: 'Database Connection',
          passed: !connectionError,
          message: connectionError ? `Connection failed: ${connectionError.message}` : 'Database connection successful'
        });
      } catch (error) {
        results.push({
          test: 'Database Connection',
          passed: false,
          message: `Connection error: ${error}`
        });
      }

      // Test 2: Appointments Table Structure
      try {
        const { data: structureTest, error: structureError } = await supabase
          .from('appointments')
          .select('id, doctor_id, doctor_name, patient_id, patient_name, appointment_date, appointment_time, status')
          .limit(1);
        
        results.push({
          test: 'Appointments Table Structure',
          passed: !structureError,
          message: structureError ? `Structure issue: ${structureError.message}` : 'Table structure is correct',
          data: structureTest
        });
      } catch (error) {
        results.push({
          test: 'Appointments Table Structure',
          passed: false,
          message: `Structure error: ${error}`
        });
      }

      // Test 3: Doctor Table Accessibility
      try {
        const { data: doctorsTest, error: doctorsError } = await supabase
          .from('doctors')
          .select('id, full_name, email, specialization')
          .limit(5);
        
        results.push({
          test: 'Doctors Table Access',
          passed: !doctorsError,
          message: doctorsError ? `Doctors table error: ${doctorsError.message}` : `Found ${doctorsTest?.length || 0} doctor records`,
          data: doctorsTest
        });
      } catch (error) {
        results.push({
          test: 'Doctors Table Access',
          passed: false,
          message: `Doctors table error: ${error}`
        });
      }

      // Test 4: Patients Table Accessibility
      try {
        const { data: patientsTest, error: patientsError } = await supabase
          .from('patients')
          .select('id, first_name, last_name, email')
          .limit(5);
        
        results.push({
          test: 'Patients Table Access',
          passed: !patientsError,
          message: patientsError ? `Patients table error: ${patientsError.message}` : `Found ${patientsTest?.length || 0} patient records`,
          data: patientsTest
        });
      } catch (error) {
        results.push({
          test: 'Patients Table Access',
          passed: false,
          message: `Patients table error: ${error}`
        });
      }

      // Test 5: Appointments Data Analysis
      try {
        const { data: appointmentsAnalysis, error: analysisError } = await supabase
          .from('appointments')
          .select('id, doctor_id, doctor_name, patient_id, patient_name');
        
        if (!analysisError && appointmentsAnalysis) {
          const totalAppointments = appointmentsAnalysis.length;
          const withDoctorId = appointmentsAnalysis.filter(apt => apt.doctor_id).length;
          const withDoctorName = appointmentsAnalysis.filter(apt => apt.doctor_name).length;
          const withPatientId = appointmentsAnalysis.filter(apt => apt.patient_id).length;
          const withPatientName = appointmentsAnalysis.filter(apt => apt.patient_name).length;
          
          results.push({
            test: 'Appointments Data Analysis',
            passed: withDoctorId > 0,
            message: `Total: ${totalAppointments}, Doctor IDs: ${withDoctorId}, Doctor Names: ${withDoctorName}, Patient IDs: ${withPatientId}, Patient Names: ${withPatientName}`,
            data: {
              totalAppointments,
              withDoctorId,
              withDoctorName,
              withPatientId,
              withPatientName,
              doctorIdPercentage: totalAppointments > 0 ? ((withDoctorId / totalAppointments) * 100).toFixed(1) : '0'
            }
          });
        } else {
          results.push({
            test: 'Appointments Data Analysis',
            passed: false,
            message: `Analysis failed: ${analysisError?.message}`
          });
        }
      } catch (error) {
        results.push({
          test: 'Appointments Data Analysis',
          passed: false,
          message: `Analysis error: ${error}`
        });
      }

      // Test 6: Stored Procedure Test (if available)
      if (doctorId) {
        try {
          const { data: procedureTest, error: procedureError } = await supabase
            .rpc('get_doctor_appointments', {
              input_doctor_id: doctorId,
              filter_status: null,
              filter_date: null,
              limit_results: 5
            });
          
          results.push({
            test: 'Stored Procedure (get_doctor_appointments)',
            passed: !procedureError,
            message: procedureError ? `Procedure unavailable: ${procedureError.message}` : `Procedure works, returned ${procedureTest?.length || 0} appointments`,
            data: procedureTest
          });
        } catch (error) {
          results.push({
            test: 'Stored Procedure (get_doctor_appointments)',
            passed: false,
            message: `Procedure error: ${error}`
          });
        }
      }

      // Test 7: View Test (if available)
      try {
        const { data: viewTest, error: viewError } = await supabase
          .from('doctor_appointments_view')
          .select('*')
          .limit(5);
        
        results.push({
          test: 'Doctor Appointments View',
          passed: !viewError,
          message: viewError ? `View unavailable: ${viewError.message}` : `View works, returned ${viewTest?.length || 0} records`,
          data: viewTest
        });
      } catch (error) {
        results.push({
          test: 'Doctor Appointments View',
          passed: false,
          message: `View error: ${error}`
        });
      }

      // Test 8: Service Layer Test
      if (doctorId) {
        try {
          const serviceResult = await doctorDashboardService.getDoctorAppointments(doctorId);
          
          results.push({
            test: 'Doctor Dashboard Service',
            passed: serviceResult.success,
            message: serviceResult.success ? 
              `Service returned ${serviceResult.appointments?.length || 0} appointments` : 
              `Service failed: ${serviceResult.error}`,
            data: serviceResult
          });
        } catch (error) {
          results.push({
            test: 'Doctor Dashboard Service',
            passed: false,
            message: `Service error: ${error}`
          });
        }
      }

      // Test 9: Specific Doctor Lookup
      if (doctorId) {
        try {
          const { data: doctorInfo, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', doctorId)
            .single();
          
          results.push({
            test: 'Specific Doctor Lookup',
            passed: !doctorError && !!doctorInfo,
            message: doctorError ? 
              `Doctor lookup failed: ${doctorError.message}` : 
              `Found doctor: ${doctorInfo?.full_name} (${doctorInfo?.email})`,
            data: doctorInfo
          });
          
          // Test 10: Appointments for Specific Doctor
          if (!doctorError && doctorInfo) {
            const { data: doctorAppointments, error: appointmentsError } = await supabase
              .from('appointments')
              .select('*')
              .eq('doctor_id', doctorId)
              .limit(10);
            
            results.push({
              test: 'Doctor-Specific Appointments',
              passed: !appointmentsError,
              message: appointmentsError ? 
                `Failed to get appointments: ${appointmentsError.message}` : 
                `Found ${doctorAppointments?.length || 0} appointments for ${doctorInfo.full_name}`,
              data: doctorAppointments
            });
          }
        } catch (error) {
          results.push({
            test: 'Specific Doctor Lookup',
            passed: false,
            message: `Doctor lookup error: ${error}`
          });
        }
      }

      // Test 11: Trigger Function Test
      try {
        const { data: triggerTest, error: triggerError } = await supabase
          .rpc('resolve_doctor_id_from_name', { input_doctor_name: 'Andrew' });
        
        results.push({
          test: 'Doctor Name Resolution Function',
          passed: !triggerError,
          message: triggerError ? 
            `Function unavailable: ${triggerError.message}` : 
            `Function works, resolved to: ${triggerTest || 'No match'}`,
          data: triggerTest
        });
      } catch (error) {
        results.push({
          test: 'Doctor Name Resolution Function',
          passed: false,
          message: `Function error: ${error}`
        });
      }

      // Calculate summary
      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => !r.passed).length;
      const warnings = results.filter(r => r.message.includes('unavailable') || r.message.includes('warning')).length;
      
      setSummary({ passed, failed, warnings });
      setValidationResults(results);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      runValidation();
    }
  }, [doctorId]);

  const getStatusIcon = (passed: boolean, message: string) => {
    if (message.includes('unavailable') || message.includes('warning')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return passed ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Comprehensive Appointment Validation</h3>
          </div>
          <Button 
            onClick={runValidation} 
            disabled={isRunning}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>

        {/* Summary */}
        {validationResults.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
        )}

        {/* Doctor Info */}
        {doctorId && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Testing Doctor ID: {doctorId}</span>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {validationResults.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(result.passed, result.message)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{result.test}</div>
                <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer">View Data</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        {validationResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm">Click "Run Tests" to validate the appointment system.</p>
            {!doctorId && <p className="text-xs mt-1">Note: Some tests require a doctor ID to run.</p>}
          </div>
        )}
      </div>
    </Card>
  );
};
