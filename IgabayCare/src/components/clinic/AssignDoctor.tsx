import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { User, UserCheck, AlertCircle } from 'lucide-react';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization?: string;
  status: string;
}

interface AssignDoctorProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  clinicId: string;
  onAssignSuccess: () => void;
  currentDoctorId?: string;
  currentDoctorName?: string;
}

export const AssignDoctor: React.FC<AssignDoctorProps> = ({
  isOpen,
  onClose,
  appointmentId,
  clinicId,
  onAssignSuccess,
  currentDoctorId,
  currentDoctorName
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentDoctorId || '');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClinicDoctors();
      setSelectedDoctorId(currentDoctorId || '');
      setError(null);
    }
  }, [isOpen, clinicId, currentDoctorId]);

  const fetchClinicDoctors = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('id, full_name, email, specialization, status')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('full_name');

      if (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors');
        return;
      }

      setDoctors(doctors || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) {
      setError('Please select a doctor');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      // Find selected doctor details
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      if (!selectedDoctor) {
        setError('Selected doctor not found');
        return;
      }

      // Update appointment with doctor assignment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          doctor_id: selectedDoctorId,
          doctor_name: selectedDoctor.full_name,
          doctor_specialty: selectedDoctor.specialization,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Error assigning doctor:', updateError);
        setError('Failed to assign doctor to appointment');
        return;
      }

      // Success - call the callback and close modal
      onAssignSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning doctor:', err);
      setError('Failed to assign doctor');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignDoctor = async () => {
    setAssigning(true);
    setError(null);

    try {
      // Remove doctor assignment from appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          doctor_id: null,
          doctor_name: null,
          doctor_specialty: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Error unassigning doctor:', updateError);
        setError('Failed to unassign doctor from appointment');
        return;
      }

      // Success - call the callback and close modal
      onAssignSuccess();
      onClose();
    } catch (err) {
      console.error('Error unassigning doctor:', err);
      setError('Failed to unassign doctor');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Doctor">
      <div className="space-y-6">
        {/* Current Assignment */}
        {currentDoctorId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <UserCheck size={16} />
              <span className="font-medium">Currently Assigned:</span>
            </div>
            <p className="text-blue-700 mt-1">{currentDoctorName}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={16} />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading doctors...</p>
          </div>
        ) : (
          <>
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Doctor
              </label>
              
              {doctors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No active doctors found for this clinic</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Unassigned Option */}
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="doctor"
                      value=""
                      checked={selectedDoctorId === ''}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="mr-3 text-emerald-600"
                    />
                    <div>
                      <p className="font-medium text-gray-700">Unassigned</p>
                      <p className="text-sm text-gray-500">No doctor assigned</p>
                    </div>
                  </label>

                  {/* Doctor Options */}
                  {doctors.map((doctor) => (
                    <label
                      key={doctor.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="doctor"
                        value={doctor.id}
                        checked={selectedDoctorId === doctor.id}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="mr-3 text-emerald-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {doctor.full_name}
                        </p>
                        <p className="text-sm text-gray-600">{doctor.email}</p>
                        {doctor.specialization && (
                          <p className="text-sm text-emerald-600">{doctor.specialization}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </Button>
          
          {currentDoctorId && (
            <Button
              variant="outline"
              onClick={handleUnassignDoctor}
              disabled={assigning || loading}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {assigning ? 'Unassigning...' : 'Unassign'}
            </Button>
          )}
          
          <Button
            onClick={handleAssignDoctor}
            disabled={assigning || loading || !selectedDoctorId}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {assigning ? 'Assigning...' : 'Assign Doctor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
