/**
 * Validation utilities following SOLID principles
 * - SRP: Each function has single validation responsibility
 * - OCP: Easy to extend with new validation rules
 * - ISP: Small, focused validation interfaces
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = []

  if (!email) {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Confirm password validation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  const errors: string[] = []

  if (!confirmPassword) {
    errors.push('Password confirmation is required')
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Name validation (first name, last name, etc.)
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = []

  if (!name || !name.trim()) {
    errors.push(`${fieldName} is required`)
  } else {
    if (name.trim().length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`)
    }

    if (name.trim().length > 50) {
      errors.push(`${fieldName} must be less than 50 characters long`)
    }

    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Phone number validation
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = []

  if (!phone) {
    errors.push('Phone number is required')
  } else {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')

    if (digitsOnly.length < 10) {
      errors.push('Phone number must be at least 10 digits')
    } else if (digitsOnly.length > 15) {
      errors.push('Phone number must be less than 15 digits')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * URL validation
 */
export const validateUrl = (url: string, isOptional: boolean = true): ValidationResult => {
  const errors: string[] = []

  if (!url && !isOptional) {
    errors.push('URL is required')
  } else if (url) {
    try {
      new URL(url)
    } catch {
      errors.push('Please enter a valid URL')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Required field validation
 */
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const errors: string[] = []

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'string' && !value.trim())
  ) {
    errors.push(`${fieldName} is required`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * String length validation
 */
export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string,
): ValidationResult => {
  const errors: string[] = []

  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters long`)
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters long`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Number validation
 */
export const validateNumber = (
  value: string | number,
  min?: number,
  max?: number,
  fieldName: string = 'Number',
): ValidationResult => {
  const errors: string[] = []
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    errors.push(`${fieldName} must be a valid number`)
  } else {
    if (min !== undefined && numValue < min) {
      errors.push(`${fieldName} must be at least ${min}`)
    }

    if (max !== undefined && numValue > max) {
      errors.push(`${fieldName} must be at most ${max}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Date validation
 */
export const validateDate = (dateString: string, fieldName: string = 'Date'): ValidationResult => {
  const errors: string[] = []

  if (!dateString) {
    errors.push(`${fieldName} is required`)
  } else {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} must be a valid date`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Array validation
 */
export const validateArray = (
  array: any[],
  minItems?: number,
  maxItems?: number,
  fieldName: string = 'Items',
): ValidationResult => {
  const errors: string[] = []

  if (!Array.isArray(array)) {
    errors.push(`${fieldName} must be an array`)
    return { isValid: false, errors }
  }

  if (minItems !== undefined && array.length < minItems) {
    errors.push(`${fieldName} must have at least ${minItems} item${minItems === 1 ? '' : 's'}`)
  }

  if (maxItems !== undefined && array.length > maxItems) {
    errors.push(`${fieldName} must have at most ${maxItems} item${maxItems === 1 ? '' : 's'}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Combine multiple validation results
 */
export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap((result) => result.errors)

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  }
}

/**
 * Validate object using validation schema
 */
export const validateObject = <T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, (value: any) => ValidationResult>,
): Record<keyof T, string[]> & { isValid: boolean } => {
  const errors: Record<keyof T, string[]> = {} as any
  let hasErrors = false

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(obj[key])
    errors[key as keyof T] = result.errors
    if (!result.isValid) {
      hasErrors = true
    }
  }

  return {
    ...errors,
    isValid: !hasErrors,
  }
}
