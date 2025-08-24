/**
 * Medical-specific UI Components
 * Following Single Responsibility Principle - each component has one specific medical purpose
 */

import React from 'react';
import { Activity, Heart, Thermometer, Clock, AlertTriangle, CheckCircle, Calendar, User, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { IMedicalInfoDisplayComponent } from '../../core/interfaces/IUIComponents';
import { useMedicalTheme } from '../../core/providers/MedicalThemeProvider';

// Vital Signs Display Component (SRP: Display medical vital signs)
export const VitalSignsDisplay: React.FC<{
  vitals: {
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    temperature?: number;
    oxygenSaturation?: number;
  };
  lastUpdated?: string;
}> = ({ vitals, lastUpdated }) => {
  const vitalItems = [
    {
      label: 'Heart Rate',
      value: vitals.heartRate,
      unit: 'bpm',
      icon: Heart,
      normalRange: { min: 60, max: 100 },
      color: 'text-emergency-600'
    },
    {
      label: 'Blood Pressure',
      value: vitals.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : undefined,
      unit: 'mmHg',
      icon: Activity,
      color: 'text-primary-600'
    },
    {
      label: 'Temperature',
      value: vitals.temperature,
      unit: '°F',
      icon: Thermometer,
      normalRange: { min: 97, max: 99 },
      color: 'text-warning-600'
    },
    {
      label: 'O2 Saturation',
      value: vitals.oxygenSaturation,
      unit: '%',
      icon: Activity,
      normalRange: { min: 95, max: 100 },
      color: 'text-clinical-600'
    }
  ];

  return (
    <Card className="vital-signs-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary-600" />
          Vital Signs
          {lastUpdated && (
            <span className="ml-auto text-xs text-neutral-500 font-normal">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {vitalItems.map((vital, index) => (
            <MedicalInfoDisplay
              key={index}
              title={vital.label}
              value={vital.value?.toString() || 'N/A'}
              unit={vital.unit}
              icon={<vital.icon className={`h-4 w-4 ${vital.color}`} />}
              status={
                vital.normalRange && vital.value && typeof vital.value === 'number'
                  ? vital.value >= vital.normalRange.min && vital.value <= vital.normalRange.max
                    ? 'normal'
                    : 'warning'
                  : undefined
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Medical Information Display Component (SRP: Display single medical metric)
export const MedicalInfoDisplay: React.FC<IMedicalInfoDisplayComponent> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status = 'normal',
  className = ''
}) => {
  const statusStyles = {
    normal: 'text-clinical-600 bg-clinical-50 border-clinical-200',
    warning: 'text-warning-600 bg-warning-50 border-warning-200',
    critical: 'text-emergency-600 bg-emergency-50 border-emergency-200'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className={`medical-info-display p-3 rounded-lg border ${statusStyles[status]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          <span className="text-xs font-medium text-neutral-600">{title}</span>
        </div>
        {status !== 'normal' && (
          <AlertTriangle className="h-3 w-3 text-current" />
        )}
      </div>
      <div className="mt-1 flex items-baseline">
        <span className="text-lg font-semibold text-current">{value}</span>
        {unit && <span className="ml-1 text-xs text-neutral-500">{unit}</span>}
        {trend && trendValue && (
          <span className="ml-2 text-xs text-neutral-500">
            {trendIcons[trend]} {trendValue}%
          </span>
        )}
      </div>
    </div>
  );
};

// Appointment Status Component (SRP: Display appointment status)
export const AppointmentStatus: React.FC<{
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  appointmentTime?: string;
  estimatedWaitTime?: number;
}> = ({ status, appointmentTime, estimatedWaitTime }) => {
  const statusConfig = {
    scheduled: {
      color: 'bg-primary-50 text-primary-700 border-primary-200',
      icon: Calendar,
      label: 'Scheduled'
    },
    confirmed: {
      color: 'bg-clinical-50 text-clinical-700 border-clinical-200',
      icon: CheckCircle,
      label: 'Confirmed'
    },
    'in-progress': {
      color: 'bg-warning-50 text-warning-700 border-warning-200',
      icon: Clock,
      label: 'In Progress'
    },
    completed: {
      color: 'bg-neutral-50 text-neutral-700 border-neutral-200',
      icon: CheckCircle,
      label: 'Completed'
    },
    cancelled: {
      color: 'bg-emergency-50 text-emergency-700 border-emergency-200',
      icon: AlertTriangle,
      label: 'Cancelled'
    },
    'no-show': {
      color: 'bg-neutral-100 text-neutral-600 border-neutral-300',
      icon: AlertTriangle,
      label: 'No Show'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={`appointment-status inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${config.color}`}>
      <StatusIcon className="mr-1.5 h-3 w-3" />
      {config.label}
      {appointmentTime && (
        <span className="ml-2 text-xs opacity-75">
          {new Date(appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {estimatedWaitTime && status === 'confirmed' && (
        <span className="ml-2 text-xs opacity-75">
          ~{estimatedWaitTime}min wait
        </span>
      )}
    </div>
  );
};

// Patient Information Component (SRP: Display patient basic info)
export const PatientInfoDisplay: React.FC<{
  patient: {
    id: string;
    name: string;
    dateOfBirth: string;
    gender?: string;
    bloodType?: string;
    allergies?: string[];
    emergencyContact?: string;
    phone?: string;
    address?: string;
  };
  compact?: boolean;
}> = ({ patient, compact = false }) => {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  if (compact) {
    return (
      <div className="patient-info-compact flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">{patient.name}</p>
          <p className="text-xs text-neutral-500">
            Age {age} • ID: {patient.id}
            {patient.bloodType && ` • ${patient.bloodType}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="patient-info-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5 text-primary-600" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{patient.name}</h3>
            <p className="text-sm text-neutral-600">Patient ID: {patient.id}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Age</p>
              <p className="text-sm text-neutral-900">{age} years old</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Date of Birth</p>
              <p className="text-sm text-neutral-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            </div>
            {patient.gender && (
              <div>
                <p className="text-xs text-neutral-500 font-medium">Gender</p>
                <p className="text-sm text-neutral-900">{patient.gender}</p>
              </div>
            )}
            {patient.bloodType && (
              <div>
                <p className="text-xs text-neutral-500 font-medium">Blood Type</p>
                <p className="text-sm text-emergency-600 font-medium">{patient.bloodType}</p>
              </div>
            )}
          </div>

          {patient.allergies && patient.allergies.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 font-medium">Allergies</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {patient.allergies.map((allergy, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emergency-50 text-emergency-700">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {allergy}
                  </span>
                )))}
              </div>
            </div>
          )}

          {patient.phone && (
            <div className="flex items-center text-sm text-neutral-600">
              <Phone className="mr-2 h-4 w-4" />
              {patient.phone}
            </div>
          )}

          {patient.address && (
            <div className="flex items-center text-sm text-neutral-600">
              <MapPin className="mr-2 h-4 w-4" />
              {patient.address}
            </div>
          )}

          {patient.emergencyContact && (
            <div>
              <p className="text-xs text-neutral-500 font-medium">Emergency Contact</p>
              <p className="text-sm text-neutral-900">{patient.emergencyContact}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Medical Alert Component (SRP: Display medical alerts and warnings)
export const MedicalAlert: React.FC<{
  type: 'allergy' | 'medication' | 'condition' | 'emergency';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  onDismiss?: () => void;
}> = ({ type, title, description, severity, onDismiss }) => {
  const { priority } = useMedicalTheme();
  const priorityStyle = priority[severity === 'low' ? 'low' : severity === 'medium' ? 'medium' : severity === 'high' ? 'high' : 'critical'];

  const typeIcons = {
    allergy: AlertTriangle,
    medication: Activity,
    condition: Heart,
    emergency: AlertTriangle
  };

  const TypeIcon = typeIcons[type];

  return (
    <div 
      className={`medical-alert p-4 rounded-lg border-l-4 ${severity === 'critical' ? 'animate-pulse-emergency' : ''}`}
      style={{
        backgroundColor: priorityStyle.background,
        borderLeftColor: priorityStyle.icon,
        color: priorityStyle.text
      }}\n    >\n      <div className=\"flex items-start\">\n        <TypeIcon className=\"h-5 w-5 mr-3 mt-0.5 flex-shrink-0\" style={{ color: priorityStyle.icon }} />\n        <div className=\"flex-1\">\n          <h4 className=\"text-sm font-medium\">{title}</h4>\n          <p className=\"text-sm mt-1 opacity-90\">{description}</p>\n        </div>\n        {onDismiss && (\n          <button\n            onClick={onDismiss}\n            className=\"ml-3 flex-shrink-0 text-current hover:opacity-75 transition-opacity\"\n          >\n            ×\n          </button>\n        )}\n      </div>\n    </div>\n  );\n};\n\n// Prescription Display Component (SRP: Display prescription information)\nexport const PrescriptionDisplay: React.FC<{\n  prescription: {\n    medication: string;\n    dosage: string;\n    frequency: string;\n    duration: string;\n    instructions?: string;\n    prescribedBy: string;\n    prescribedDate: string;\n  };\n}> = ({ prescription }) => {\n  return (\n    <Card className=\"prescription-card border-l-4 border-l-medical-500\">\n      <CardContent className=\"pt-4\">\n        <div className=\"space-y-3\">\n          <div>\n            <h4 className=\"text-lg font-semibold text-neutral-900\">{prescription.medication}</h4>\n            <p className=\"text-sm text-neutral-600\">Prescribed by Dr. {prescription.prescribedBy}</p>\n          </div>\n          \n          <div className=\"grid grid-cols-3 gap-4\">\n            <div>\n              <p className=\"text-xs text-neutral-500 font-medium\">Dosage</p>\n              <p className=\"text-sm text-neutral-900\">{prescription.dosage}</p>\n            </div>\n            <div>\n              <p className=\"text-xs text-neutral-500 font-medium\">Frequency</p>\n              <p className=\"text-sm text-neutral-900\">{prescription.frequency}</p>\n            </div>\n            <div>\n              <p className=\"text-xs text-neutral-500 font-medium\">Duration</p>\n              <p className=\"text-sm text-neutral-900\">{prescription.duration}</p>\n            </div>\n          </div>\n\n          {prescription.instructions && (\n            <div>\n              <p className=\"text-xs text-neutral-500 font-medium\">Instructions</p>\n              <p className=\"text-sm text-neutral-900\">{prescription.instructions}</p>\n            </div>\n          )}\n\n          <div className=\"text-xs text-neutral-500\">\n            Prescribed on {new Date(prescription.prescribedDate).toLocaleDateString()}\n          </div>\n        </div>\n      </CardContent>\n    </Card>\n  );\n};"