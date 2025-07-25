import React from 'react';
import { User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

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

export const AppointmentCard = ({ appointment, onViewDetails, onMarkComplete, onCancel }) => (
  <Card hover>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{appointment.time}</div>
            <div className="text-xs text-gray-500">{appointment.duration} min</div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{appointment.patient.name}</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Age: {appointment.patient.age} • {appointment.doctor}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>{appointment.patient.phone}</span>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <p><strong>Reason:</strong> {appointment.patient.reason}</p>
              <p><strong>Type:</strong> {appointment.type} • <strong>Fee:</strong> ${appointment.fee}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(appointment)}>
            View Details
          </Button>

          {(appointment.status === 'waiting' || appointment.status === 'in-progress') && (
            <Button size="sm" onClick={() => onMarkComplete(appointment.id)}>
              <CheckCircle size={16} className="mr-1" /> Complete
            </Button>
          )}

          {(appointment.status === 'confirmed' || appointment.status === 'waiting') && (
            <Button variant="danger" size="sm" onClick={() => onCancel(appointment.id)}>
              <XCircle size={16} className="mr-1" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);
