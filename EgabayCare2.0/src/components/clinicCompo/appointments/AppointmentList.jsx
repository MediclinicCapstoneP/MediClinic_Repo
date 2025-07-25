import React from 'react';
import { AppointmentCard } from './AppointmentCard';

export const AppointmentList = ({ appointments, onViewDetails, onMarkComplete, onCancel }) => (
  <div className="space-y-4">
    {appointments.map((appt) => (
      <AppointmentCard
        key={appt.id}
        appointment={appt}
        onViewDetails={onViewDetails}
        onMarkComplete={onMarkComplete}
        onCancel={onCancel}
      />
    ))}
  </div>
);
