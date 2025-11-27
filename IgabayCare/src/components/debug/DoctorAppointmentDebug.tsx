import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface DoctorAppointmentDebugProps {
  doctorId: string;
  doctorName?: string;
}

export const DoctorAppointmentDebug: React.FC<DoctorAppointmentDebugProps> = ({ 
  doctorId, 
  doctorName 
}) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugAnalysis = async () => {
    setLoading(true);
    try {
      const analysis: any = {
        doctorId,
        doctorName,
        timestamp: new Date().toISOString(),
        queries: {}
      };

      // 1. Check if doctor exists in doctors table
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      analysis.doctorExists = !doctorError && doctorData;
      analysis.doctorData = doctorData;
      analysis.doctorError = doctorError?.message;

      if (doctorData) {
        console.log('🔍 Doctor found in database:', {
          id: doctorData.id,
          full_name: doctorData.full_name,
          first_name: doctorData.first_name,
          last_name: doctorData.last_name,
          email: doctorData.email,
          status: doctorData.status
        });
      }

      // 2. Check appointments by doctor_id
      const { data: appointmentsByID, error: appointmentsByIDError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId);

      analysis.queries.byDoctorId = {
        count: appointmentsByID?.length || 0,
        appointments: appointmentsByID,
        error: appointmentsByIDError?.message
      };

      // 3. Check appointments by doctor_name (if we have doctor info)
      if (doctorData && doctorData.full_name) {
        const names = [
          doctorData.full_name,
          `Dr. ${doctorData.full_name}`,
          `Dr.${doctorData.full_name}`
        ].filter(Boolean);

        for (const name of names) {
          const { data: appointmentsByName, error: appointmentsByNameError } = await supabase
            .from('appointments')
            .select('*')
            .ilike('doctor_name', `%${name}%`);

          analysis.queries[`byName_${name}`] = {
            count: appointmentsByName?.length || 0,
            appointments: appointmentsByName,
            error: appointmentsByNameError?.message
          };
        }
      }

      // 4. Check all appointments (for reference)
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('id, doctor_id, doctor_name, appointment_date, patient_id')
        .limit(50);

      analysis.queries.allAppointments = {
        count: allAppointments?.length || 0,
        sample: allAppointments?.slice(0, 10),
        error: allError?.message,
        fullData: allAppointments // Include full data for debugging
      };

      // 4.5. Check specifically for Andrew appointments
      const { data: andrewAppointments, error: andrewError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_name', 'Andrew');

      analysis.queries.andrewSpecific = {
        count: andrewAppointments?.length || 0,
        appointments: andrewAppointments,
        error: andrewError?.message
      };

      // 4.6. Test database connection with a simple count
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      analysis.queries.totalCount = {
        count: count || 0,
        error: countError?.message
      };

      // 5. Check for appointments with this doctor's name variations
      const { data: nameVariations, error: nameError } = await supabase
        .from('appointments')
        .select('id, doctor_name, doctor_id, appointment_date')
        .not('doctor_name', 'is', null);

      analysis.queries.nameVariations = {
        count: nameVariations?.length || 0,
        uniqueNames: [...new Set(nameVariations?.map(apt => apt.doctor_name))],
        error: nameError?.message
      };

      setDebugInfo(analysis);

      // Log detailed analysis
      console.group('🔬 Doctor Appointment Debug Analysis');
      console.log('Doctor ID:', doctorId);
      console.log('Doctor exists:', analysis.doctorExists);
      console.log('Doctor data:', doctorData);
      console.log('Appointments by doctor_id:', appointmentsByID?.length || 0);
      console.log('All doctor names in appointments:', analysis.queries.nameVariations.uniqueNames);
      console.groupEnd();

    } catch (error) {
      console.error('Debug analysis error:', error);
      setDebugInfo({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      runDebugAnalysis();
    }
  }, [doctorId]);

  if (!debugInfo) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <Button onClick={runDebugAnalysis} disabled={loading}>
              {loading ? 'Running Analysis...' : 'Run Debug Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Doctor Appointment Debug Analysis</h3>
        
        <div className="space-y-4">
          {/* Doctor Info */}
          <div>
            <h4 className="font-medium mb-2">Doctor Information</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div><strong>ID:</strong> {debugInfo.doctorId}</div>
              <div><strong>Exists:</strong> {debugInfo.doctorExists ? '✅ Yes' : '❌ No'}</div>
              {debugInfo.doctorData && (
                <>
                  <div><strong>Full Name:</strong> {debugInfo.doctorData.full_name}</div>
                  <div><strong>Specialization:</strong> {debugInfo.doctorData.specialization}</div>
                  <div><strong>Email:</strong> {debugInfo.doctorData.email}</div>
                  <div><strong>Status:</strong> {debugInfo.doctorData.status}</div>
                  <div><strong>Clinic ID:</strong> {debugInfo.doctorData.clinic_id}</div>
                </>
              )}
              {debugInfo.doctorError && (
                <div className="text-red-600"><strong>Error:</strong> {debugInfo.doctorError}</div>
              )}
            </div>
          </div>

          {/* Query Results */}
          <div>
            <h4 className="font-medium mb-2">Appointment Queries</h4>
            <div className="space-y-2">
              {Object.entries(debugInfo.queries).map(([queryName, queryResult]: [string, any]) => (
                <div key={queryName} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <strong className="text-sm">{queryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                    <span className={`px-2 py-1 rounded text-xs ${
                      queryResult.count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {queryResult.count} results
                    </span>
                  </div>
                  
                  {queryResult.error && (
                    <div className="text-red-600 text-xs mb-2">Error: {queryResult.error}</div>
                  )}
                  
                  {queryResult.appointments && queryResult.appointments.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Sample appointments:</div>
                      {queryResult.appointments.slice(0, 3).map((apt: any) => (
                        <div key={apt.id} className="ml-2">
                          • {apt.id.substring(0, 8)} - {apt.appointment_date} ({apt.doctor_name || 'No name'})
                        </div>
                      ))}
                    </div>
                  )}

                  {queryResult.uniqueNames && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Unique doctor names found:</div>
                      <div className="ml-2">
                        {queryResult.uniqueNames.map((name: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1 text-xs">
                            "{name}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <div className="bg-yellow-50 p-3 rounded text-sm">
              {debugInfo.queries.byDoctorId.count === 0 ? (
                <div>
                  <strong>❌ No appointments found by doctor_id.</strong>
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Check if the doctor_id is correct</li>
                    <li>Look for appointments with matching doctor_name</li>
                    <li>Run the database fix script to populate missing doctor_ids</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <strong>✅ Found {debugInfo.queries.byDoctorId.count} appointments by doctor_id.</strong>
                </div>
              )}

              {debugInfo.queries.nameVariations.uniqueNames.length > 0 && (
                <div className="mt-2">
                  <strong>Names to match:</strong> Consider updating appointments with these doctor names to include the correct doctor_id.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runDebugAnalysis} disabled={loading} size="sm">
              Re-run Analysis
            </Button>
            <Button 
              onClick={() => {
                console.log('Full Debug Info:', debugInfo);
                alert('Check browser console for full debug information');
              }}
              variant="outline"
              size="sm"
            >
              Export to Console
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorAppointmentDebug;