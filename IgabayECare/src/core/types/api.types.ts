import type { BaseEntity, ApiResponse, PaginatedResponse } from './common.types'

export interface ApiConfig {
  baseURL: string
  timeout: number
  retries: number
  headers?: Record<string, string>
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

// Supabase specific types
export interface SupabaseResponse<T = any> {
  data: T | null
  error: {
    message: string
    details: string
    hint: string
    code: string
  } | null
}

export interface SupabaseAuthResponse {
  user: any | null
  session: any | null
  error: any | null
}

// File upload types
export interface FileUploadConfig {
  maxSize: number // in bytes
  allowedTypes: string[]
  bucket: string
  path?: string
}

export interface UploadedFile {
  id: string
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

// Appointment related API types
export interface AppointmentCreateRequest {
  patientId: string
  clinicId: string
  doctorId: string
  date: string
  time: string
  reason?: string
}

export interface AppointmentUpdateRequest {
  date?: string
  time?: string
  status?: AppointmentStatus
  notes?: string
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
}

// Search and filter types
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  page?: number
  limit?: number
}

export interface FilterOption {
  label: string
  value: any
  count?: number
}

// Notification types
export interface NotificationPayload {
  title: string
  message: string
  type: NotificationType
  userId: string
  data?: any
}

export enum NotificationType {
  APPOINTMENT = 'appointment',
  REMINDER = 'reminder',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

// Real-time subscription types
export interface SubscriptionConfig {
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  schema?: string
}
