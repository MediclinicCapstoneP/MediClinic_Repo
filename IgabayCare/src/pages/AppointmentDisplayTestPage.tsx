import React, { useState, useEffect } from 'react';
import { AppointmentDisplay, displaySpecificAppointment } from '../utils/appointmentDisplayUtils';
import AppointmentWithPatientDisplay from '../components/patient/AppointmentWithPatientDisplay';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const AppointmentDisplayTestPage: React.FC = () => {
  const [appointmentData, setAppointmentData] = useState<AppointmentDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The specific appointment ID from your query
  const APPOINTMENT_ID = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading appointment with ID:', APPOINTMENT_ID);
      
      // Use the utility function to fetch and display
      const appointment = await displaySpecificAppointment();
      
      if (appointment) {
        setAppointmentData(appointment);
        console.log('✅ Appointment loaded successfully');
      } else {
        setError('Appointment not found');
        console.log('❌ Appointment not found');
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Display Test
          </h1>
          <p className="text-gray-600">
            Displaying appointment information with patient name for ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{APPOINTMENT_ID}</code>
          </p>
        </div>

        <div className="space-y-6">
          {/* Control Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Controls</h2>
              <Button 
                onClick={loadAppointment}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Loading...' : 'Refresh Appointment'}
              </Button>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="text-red-800">
                <h3 className="font-semibold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading appointment data...</span>
              </div>
            </Card>
          )}

          {/* Appointment Display Using Component */}
          {!loading && !error && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Appointment Component Display
              </h2>
              <AppointmentWithPatientDisplay 
                appointmentId={APPOINTMENT_ID}
                showFullDetails={true}
                className="mb-6"
              />
            </div>
          )}

          {/* Raw Data Display */}
          {appointmentData && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Raw Appointment Data
              </h2>
              <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(appointmentData, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {/* Patient Information Breakdown */}
          {appointmentData && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Patient Information Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Patient Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Full Name:</dt>
                      <dd className="font-medium text-green-600">{appointmentData.patientName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email:</dt>
                      <dd className="font-medium">{appointmentData.patientEmail}</dd>
                    </div>
                    {appointmentData.patientPhone && (
                      <div>
                        <dt className="text-gray-500">Phone:</dt>
                        <dd className="font-medium">{appointmentData.patientPhone}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Date:</dt>
                      <dd className="font-medium">{appointmentData.appointmentDate}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Time:</dt>
                      <dd className="font-medium">{appointmentData.appointmentTime}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Type:</dt>
                      <dd className="font-medium capitalize">{appointmentData.appointmentType}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status:</dt>
                      <dd className="font-medium">{appointmentData.status}</dd>
                    </div>
                    {appointmentData.doctorName && (
                      <div>
                        <dt className="text-gray-500">Doctor:</dt>
                        <dd className="font-medium">{appointmentData.doctorName}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Clinic:</dt>
                      <dd className="font-medium">{appointmentData.clinicName}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              How to Use This Information
            </h2>
            <div className="space-y-3 text-blue-800">
              <p>
                <strong>1. Database Query:</strong> Run the SQL script in <code>database/display_patient_name_for_appointment.sql</code> to populate patient names in the database.
              </p>
              <p>
                <strong>2. Component Usage:</strong> Use the <code>AppointmentWithPatientDisplay</code> component to display appointment information with patient names.
              </p>
              <p>
                <strong>3. Utility Functions:</strong> Use functions from <code>utils/appointmentDisplayUtils.ts</code> to fetch and format appointment data with patient information.
              </p>
              <p>
                <strong>4. Console Output:</strong> Check the browser console for detailed logs about the appointment fetching process.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDisplayTestPage;