import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const getStatusColor = (status) => {
  const map = {
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-green-100 text-green-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const AppointmentDetailsModal = ({ isOpen, onClose, appointment, selectedDate }) => {
  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
      <div className="space-y-6">
        {/* Patient Info */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div><p className="text-sm text-gray-600">Name</p><p className="font-medium">{appointment.patient.name}</p></div>
            <div><p className="text-sm text-gray-600">Age</p><p className="font-medium">{appointment.patient.age}</p></div>
            <div><p className="text-sm text-gray-600">Phone</p><p className="font-medium">{appointment.patient.phone}</p></div>
            <div><p className="text-sm text-gray-600">Email</p><p className="font-medium">{appointment.patient.email}</p></div>
          </div>
        </div>

        {/* Appointment Info */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div><p className="text-sm text-gray-600">Date & Time</p><p className="font-medium">{selectedDate} at {appointment.time}</p></div>
            <div><p className="text-sm text-gray-600">Duration</p><p className="font-medium">{appointment.duration} minutes</p></div>
            <div><p className="text-sm text-gray-600">Doctor</p><p className="font-medium">{appointment.doctor}</p></div>
            <div><p className="text-sm text-gray-600">Type</p><p className="font-medium">{appointment.type}</p></div>
            <div><p className="text-sm text-gray-600">Status</p><span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>{appointment.status}</span></div>
            <div><p className="text-sm text-gray-600">Fee</p><p className="font-medium">${appointment.fee}</p></div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Reason for Visit</h4>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{appointment.patient.reason}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
          <textarea
            defaultValue={appointment.notes}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add notes about this appointment..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button>Save Notes</Button>
        </div>
      </div>
    </Modal>
  );
};
