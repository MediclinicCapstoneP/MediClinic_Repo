import type { UserRole } from '../../../../core/types/common.types'

export interface ProfilePictureProps {
  currentImageUrl?: string
  currentImagePath?: string
  userId: string
  userType: 'patient' | 'clinic' | 'doctor'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  className?: string
}

export interface ProfilePictureEmits {
  imageUpdate: [url: string, path: string]
  imageDelete: []
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}
