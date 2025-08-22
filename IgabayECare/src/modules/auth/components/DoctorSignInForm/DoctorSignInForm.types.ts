import type { ComponentVariant, ComponentSize } from '../../../../core/types/common.types'

export interface DoctorSignInFormData {
  email: string
  password: string
}

export interface DoctorSignInFormProps {
  onSuccess?: () => void
}

export interface DoctorSignInFormEmits {
  success: []
}
