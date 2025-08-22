// Core application types following SOLID principles

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  loading: boolean
  touched: Record<string, boolean>
}

// User roles enum for better type safety
export enum UserRole {
  PATIENT = 'patient',
  CLINIC = 'clinic',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
}

// Component size variants
export enum ComponentSize {
  SMALL = 'sm',
  MEDIUM = 'md',
  LARGE = 'lg',
  EXTRA_LARGE = 'xl',
}

// Component variants
export enum ComponentVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  OUTLINE = 'outline',
  GHOST = 'ghost',
}

// Appointment types
export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  ROUTINE_CHECKUP = 'routine_checkup',
  SPECIALIST_VISIT = 'specialist_visit',
  LAB_TEST = 'lab_test',
  IMAGING = 'imaging',
  VACCINATION = 'vaccination',
  PHYSICAL_THERAPY = 'physical_therapy',
  DENTAL = 'dental',
  VISION = 'vision',
  OTHER = 'other',
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  message?: string
}

// Error states
export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

// Navigation item interface
export interface NavigationItem {
  id: string
  label: string
  icon?: any
  path?: string
  children?: NavigationItem[]
  isActive?: boolean
  disabled?: boolean
}
