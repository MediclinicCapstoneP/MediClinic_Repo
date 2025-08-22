export interface Notification {
  id: string
  title: string
  message: string
  type: 'appointment' | 'patient' | 'system' | 'alert'
  timestamp: string
  read: boolean
}

export interface ClinicNavbarProps {
  user?: any
  activeTab?: string
  searchPlaceholder?: string
}

export interface ClinicNavbarEmits {
  search: [query: string]
  'sign-out': []
  'notification-click': [notificationId: string]
}
