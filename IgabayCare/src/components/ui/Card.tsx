import React from 'react';
import { ICardComponent, ICardHeaderComponent, ICardContentComponent, IMedicalCardComponent, IAppointmentCardComponent } from '../../core/interfaces/IUIComponents';
import { useMedicalTheme } from '../../core/providers/MedicalThemeProvider';

// Base card styles
const getCardStyles = (shadow: string, border: boolean, interactive: boolean) => {
  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg'
  };
  
  return [
    'bg-white rounded-xl',
    border ? 'border border-neutral-200' : '',
    shadowClasses[shadow as keyof typeof shadowClasses] || 'shadow-sm',
    interactive ? 'hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer' : '',
  ].filter(Boolean).join(' ');
};

// Padding utilities
const getPaddingClasses = (padding: string) => {
  const paddingClasses = {
    'none': '',
    'sm': 'p-3',
    'md': 'p-4',
    'lg': 'p-6'
  };
  return paddingClasses[padding as keyof typeof paddingClasses] || 'p-4';
};

// Base Card Component (SRP: Basic card structure and styling)
export const Card: React.FC<ICardComponent> = ({ 
  children, 
  className = '', 
  hover = false,
  interactive = false,
  padding = 'md',
  border = true,
  shadow = 'sm'
}) => {
  const cardClasses = [
    getCardStyles(shadow, border, hover || interactive),
    getPaddingClasses(padding),
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

// Card Header Component (SRP: Card header with title and actions)
export const CardHeader: React.FC<ICardHeaderComponent> = ({ 
  children,
  title,
  subtitle,
  actions,
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-b border-neutral-200 ${className}`}>
      {title || subtitle ? (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-neutral-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Card Content Component (SRP: Card body content)
export const CardContent: React.FC<ICardContentComponent> = ({ 
  children, 
  padding = 'md',
  className = '' 
}) => {
  return (
    <div className={`${getPaddingClasses(padding)} ${className}`}>
      {children}
    </div>
  );
};

// Card Footer Component (SRP: Card footer actions)
export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};

// Card Title Component (SRP: Consistent title styling)
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
      {children}
    </h3>
  );
};

// Card Description Component (SRP: Consistent description styling)
export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <p className={`text-sm text-neutral-600 ${className}`}>
      {children}
    </p>
  );
};

// Medical Priority Badge Component (SRP: Medical priority indication)
const MedicalPriorityBadge: React.FC<{ urgency: 'low' | 'medium' | 'high' | 'critical' }> = ({ urgency }) => {
  const { priority } = useMedicalTheme();
  const priorityStyles = priority[urgency];
  
  const urgencyLabels = {
    low: 'Low Priority',
    medium: 'Medium Priority', 
    high: 'High Priority',
    critical: 'Critical'
  };
  
  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: priorityStyles.background,
        color: priorityStyles.text,
        borderColor: priorityStyles.border
      }}
    >
      {urgencyLabels[urgency]}
    </span>
  );
};

// Medical Status Badge Component (SRP: Medical status indication)
const MedicalStatusBadge: React.FC<{ status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' }> = ({ status }) => {
  const statusStyles = {
    'scheduled': 'bg-primary-50 text-primary-700 border-primary-200',
    'in-progress': 'bg-warning-50 text-warning-700 border-warning-200',
    'completed': 'bg-clinical-50 text-clinical-700 border-clinical-200',
    'cancelled': 'bg-emergency-50 text-emergency-700 border-emergency-200'
  };
  
  const statusLabels = {
    'scheduled': 'Scheduled',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

// Medical Card Component (SRP: Medical-specific card with patient info and priority)
export const MedicalCard: React.FC<IMedicalCardComponent> = ({
  children,
  patientInfo,
  urgency = 'low',
  status = 'scheduled',
  className = '',
  ...cardProps
}) => {
  return (
    <Card 
      {...cardProps}
      className={`medical-card ${className}`}
      border={true}
      shadow="md"
    >
      {patientInfo && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{patientInfo.name}</CardTitle>
              <CardDescription>
                ID: {patientInfo.id} • DOB: {patientInfo.dateOfBirth}
                {patientInfo.bloodType && ` • Blood Type: ${patientInfo.bloodType}`}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <MedicalPriorityBadge urgency={urgency} />
              <MedicalStatusBadge status={status} />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Appointment Card Component (SRP: Appointment-specific card)
export const AppointmentCard: React.FC<IAppointmentCardComponent> = ({
  appointment,
  onReschedule,
  onCancel,
  onJoin,
  className = '',
  ...cardProps
}) => {
  const formatDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(date);
    return {
      date: appointmentDate.toLocaleDateString(),
      time: time,
      dayOfWeek: appointmentDate.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };
  
  const { date, time, dayOfWeek } = formatDateTime(appointment.date, appointment.time);
  
  return (
    <Card 
      {...cardProps}
      className={`appointment-card ${className}`}
      hover={true}
      shadow="md"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dr. {appointment.doctor}</CardTitle>
            <CardDescription>{appointment.specialty}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-900">{dayOfWeek}</div>
            <div className="text-sm text-neutral-600">{date}</div>
            <div className="text-sm text-primary-600 font-medium">{time}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Type:</span>
            <span className="font-medium">{appointment.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Duration:</span>
            <span className="font-medium">{appointment.duration} minutes</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex justify-end space-x-2">
          {onJoin && (
            <button 
              onClick={onJoin}
              className="px-3 py-1.5 text-sm font-medium text-clinical-600 hover:text-clinical-700 transition-colors"
            >
              Join
            </button>
          )}
          {onReschedule && (
            <button 
              onClick={onReschedule}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Reschedule
            </button>
          )}
          {onCancel && (
            <button 
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-emergency-600 hover:text-emergency-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};