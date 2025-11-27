// Comprehensive notification types for IgabayCare

export interface BaseNotification {
  id: string;
  user_id: string;
  user_type: 'patient' | 'clinic' | 'doctor';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
}

export interface AppointmentNotification extends BaseNotification {
  type: 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_completed' | 'appointment_rescheduled';
  appointment_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  metadata?: {
    appointment_date?: string;
    appointment_time?: string;
    clinic_name?: string;
    doctor_name?: string;
    patient_name?: string;
  };
}

export interface ReviewNotification extends BaseNotification {
  type: 'review_request' | 'review_received';
  appointment_id?: string;
  priority: 'low' | 'normal';
  action_url?: string;
  action_text?: string;
  metadata?: {
    clinic_name?: string;
    doctor_name?: string;
    rating?: number;
  };
}

export interface SystemNotification extends BaseNotification {
  type: 'system' | 'maintenance' | 'security' | 'feature_update';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  metadata?: {
    version?: string;
    feature_name?: string;
  };
}

export interface MedicalNotification extends BaseNotification {
  type: 'prescription_ready' | 'lab_results_available' | 'medical_record_updated';
  appointment_id?: string;
  priority: 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  metadata?: {
    prescription_id?: string;
    lab_result_id?: string;
    record_type?: string;
  };
}

export interface PaymentNotification extends BaseNotification {
  type: 'payment_successful' | 'payment_failed' | 'refund_processed' | 'invoice_generated';
  appointment_id?: string;
  priority: 'normal' | 'high';
  action_url?: string;
  action_text?: string;
  metadata?: {
    amount?: number;
    currency?: string;
    payment_method?: string;
    transaction_id?: string;
  };
}

// Union type for all notifications
export type Notification = 
  | AppointmentNotification 
  | ReviewNotification 
  | SystemNotification 
  | MedicalNotification 
  | PaymentNotification;

// Notification creation parameters
export interface CreateNotificationParams {
  user_id: string;
  user_type: 'patient' | 'clinic' | 'doctor';
  type: Notification['type'];
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  appointment_id?: string;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

// Notification preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  user_type: 'patient' | 'clinic' | 'doctor';
  
  // Email notifications
  email_enabled: boolean;
  email_appointment_confirmed: boolean;
  email_appointment_reminder: boolean;
  email_appointment_cancelled: boolean;
  email_appointment_completed: boolean;
  email_review_request: boolean;
  email_prescription_ready: boolean;
  email_lab_results: boolean;
  email_payment_notifications: boolean;
  email_system_notifications: boolean;
  
  // Push notifications
  push_enabled: boolean;
  push_appointment_confirmed: boolean;
  push_appointment_reminder: boolean;
  push_appointment_cancelled: boolean;
  push_appointment_completed: boolean;
  push_review_request: boolean;
  push_prescription_ready: boolean;
  push_lab_results: boolean;
  push_payment_notifications: boolean;
  push_system_notifications: boolean;
  
  // SMS notifications
  sms_enabled: boolean;
  sms_appointment_confirmed: boolean;
  sms_appointment_reminder: boolean;
  sms_appointment_cancelled: boolean;
  sms_security_alerts: boolean;
  
  // General preferences
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;   // HH:MM format
  timezone?: string;
  
  created_at: string;
  updated_at: string;
}

// Notification filters
export interface NotificationFilters {
  user_id?: string;
  user_type?: 'patient' | 'clinic' | 'doctor';
  type?: Notification['type'] | Notification['type'][];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  is_read?: boolean;
  appointment_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  today: number;
  this_week: number;
  this_month: number;
}

// Real-time subscription payload
export interface NotificationSubscriptionPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}

// Notification action response
export interface NotificationActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  redirect_url?: string;
}

// Bulk operations
export interface BulkNotificationOperation {
  operation: 'mark_read' | 'mark_unread' | 'delete';
  notification_ids: string[];
  user_id: string;
}

// UI specific types
export interface NotificationUISettings {
  maxDisplayCount: number;
  autoMarkReadOnClick: boolean;
  showAvatars: boolean;
  groupByDate: boolean;
  enableSound: boolean;
  enableBadge: boolean;
}

// Constants for notification types and priorities
export const NOTIFICATION_TYPES = {
  // Appointment related
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  
  // Review related
  REVIEW_REQUEST: 'review_request',
  REVIEW_RECEIVED: 'review_received',
  
  // System related
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
  FEATURE_UPDATE: 'feature_update',
  
  // Medical related
  PRESCRIPTION_READY: 'prescription_ready',
  LAB_RESULTS_AVAILABLE: 'lab_results_available',
  MEDICAL_RECORD_UPDATED: 'medical_record_updated',
  
  // Payment related
  PAYMENT_SUCCESSFUL: 'payment_successful',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_PROCESSED: 'refund_processed',
  INVOICE_GENERATED: 'invoice_generated'
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const USER_TYPES = {
  PATIENT: 'patient',
  CLINIC: 'clinic',
  DOCTOR: 'doctor'
} as const;

// UI Color mappings
export const NOTIFICATION_COLORS = {
  appointment_confirmed: 'bg-green-100 text-green-800 border-green-200',
  appointment_reminder: 'bg-blue-100 text-blue-800 border-blue-200',
  appointment_cancelled: 'bg-red-100 text-red-800 border-red-200',
  appointment_completed: 'bg-gray-100 text-gray-800 border-gray-200',
  appointment_rescheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  review_request: 'bg-purple-100 text-purple-800 border-purple-200',
  review_received: 'bg-purple-100 text-purple-800 border-purple-200',
  system: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  security: 'bg-red-100 text-red-800 border-red-200',
  feature_update: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  prescription_ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  lab_results_available: 'bg-teal-100 text-teal-800 border-teal-200',
  medical_record_updated: 'bg-green-100 text-green-800 border-green-200',
  payment_successful: 'bg-green-100 text-green-800 border-green-200',
  payment_failed: 'bg-red-100 text-red-800 border-red-200',
  refund_processed: 'bg-blue-100 text-blue-800 border-blue-200',
  invoice_generated: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
} as const;

// Helper functions
export const getNotificationDisplayText = (type: string): string => {
  const displayTexts: Record<string, string> = {
    appointment_confirmed: 'Appointment Confirmed',
    appointment_reminder: 'Appointment Reminder',
    appointment_cancelled: 'Appointment Cancelled',
    appointment_completed: 'Appointment Completed',
    appointment_rescheduled: 'Appointment Rescheduled',
    review_request: 'Review Request',
    review_received: 'Review Received',
    system: 'System Notification',
    maintenance: 'Maintenance Notice',
    security: 'Security Alert',
    feature_update: 'Feature Update',
    prescription_ready: 'Prescription Ready',
    lab_results_available: 'Lab Results Available',
    medical_record_updated: 'Medical Record Updated',
    payment_successful: 'Payment Successful',
    payment_failed: 'Payment Failed',
    refund_processed: 'Refund Processed',
    invoice_generated: 'Invoice Generated'
  };
  
  return displayTexts[type] || 'Notification';
};

export const getPriorityDisplayText = (priority: string): string => {
  const displayTexts: Record<string, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent'
  };
  
  return displayTexts[priority] || 'Normal';
};

export const isHighPriority = (priority: string): boolean => {
  return priority === 'high' || priority === 'urgent';
};

export const shouldShowBadge = (notification: Notification): boolean => {
  return !notification.is_read && isHighPriority(notification.priority || 'normal');
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
};