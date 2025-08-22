export interface DoctorSignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  licenseNumber: string
  specialization: string
  phone: string
}

export interface DoctorSignUpFormProps {}

export interface DoctorSignUpFormEmits {
  success: []
}
