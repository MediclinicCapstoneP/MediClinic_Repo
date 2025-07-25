import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DateSelector } from '@/components/clinicCompo/appointments/DateSelector';
import { AppointmentList } from '@/components/clinicCompo/appointments/AppointmentList';
import { AppointmentDetailsModal } from '@/components/clinicCompo/appointments/AppointmentDetailsModal';

export const ClinicAppointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const mockAppointments = [
    {
      id: 1,
      patientName: "John Doe",
      date: "2024-06-10",
      time: "10:00 AM",
      status: "Scheduled"
    },
    // ...more mock appointments
  ];

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleMarkComplete = (id) => {
    console.log('Marking complete:', id);
  };

  const handleCancelAppointment = (id) => {
    console.log('Cancelling appointment:', id);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your clinic's appointment schedule</p>
      </div>

      <DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} total={mockAppointments.length} />

      <AppointmentList
        appointments={mockAppointments}
        onViewDetails={handleViewDetails}
        onMarkComplete={handleMarkComplete}
        onCancel={handleCancelAppointment}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
      />
    </div>
  );
};
