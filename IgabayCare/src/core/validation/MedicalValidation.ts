/**
 * Medical-Grade Form Validation System
 * Comprehensive validation for healthcare data with HIPAA compliance considerations
 * Follows healthcare industry standards and data validation requirements
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  type: 'required' | 'format' | 'range' | 'business' | 'security' | 'medical';
}

// Validation warning interface
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

// Medical data types enum
export enum MedicalDataType {
  PATIENT_ID = 'patient_id',
  SSN = 'ssn',
  PHONE = 'phone',
  EMAIL = 'email',
  DATE_OF_BIRTH = 'date_of_birth',
  BLOOD_TYPE = 'blood_type',
  MEDICATION_NAME = 'medication_name',
  DOSAGE = 'dosage',
  DIAGNOSIS_CODE = 'diagnosis_code',
  INSURANCE_NUMBER = 'insurance_number',
  HEIGHT = 'height',
  WEIGHT = 'weight',
  BLOOD_PRESSURE = 'blood_pressure',
  TEMPERATURE = 'temperature',
  HEART_RATE = 'heart_rate',
  EMERGENCY_CONTACT = 'emergency_contact',
  CLINIC_LICENSE = 'clinic_license',
  DOCTOR_LICENSE = 'doctor_license'
}

// Base validator interface
export interface Validator {
  validate(value: any, context?: ValidationContext): ValidationResult;
  getType(): MedicalDataType;
}

// Validation context
export interface ValidationContext {
  userRole: 'patient' | 'doctor' | 'clinic' | 'admin';
  isRequired: boolean;
  allowEmpty: boolean;
  customRules?: Record<string, any>;
  relatedFields?: Record<string, any>;
}

// Abstract base validator
export abstract class BaseValidator implements Validator {
  protected dataType: MedicalDataType;
  
  constructor(dataType: MedicalDataType) {
    this.dataType = dataType;
  }

  abstract validate(value: any, context?: ValidationContext): ValidationResult;

  getType(): MedicalDataType {
    return this.dataType;
  }

  protected createError(field: string, message: string, code: string, type: ValidationError['type'] = 'format'): ValidationError {
    return {
      field,
      message,
      code,
      severity: 'error',
      type
    };
  }

  protected createWarning(field: string, message: string, code: string, suggestion?: string): ValidationWarning {
    return {
      field,
      message,
      code,
      suggestion
    };
  }
}

// Patient ID Validator
export class PatientIdValidator extends BaseValidator {
  constructor() {
    super(MedicalDataType.PATIENT_ID);
  }

  validate(value: any, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value && context?.isRequired) {
      errors.push(this.createError('patientId', 'Patient ID is required', 'PATIENT_ID_REQUIRED', 'required'));
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    const stringValue = String(value).trim();

    // Format validation
    if (!/^[A-Z0-9]{8,12}$/.test(stringValue)) {
      errors.push(this.createError('patientId', 'Patient ID must be 8-12 alphanumeric characters', 'PATIENT_ID_INVALID_FORMAT', 'format'));
    }

    // Check for sequential patterns (security concern)
    if (/(.)\1{3,}/.test(stringValue)) {
      warnings.push(this.createWarning('patientId', 'Patient ID contains repetitive patterns', 'PATIENT_ID_WEAK_PATTERN', 'Consider using a more random pattern'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// SSN Validator (HIPAA sensitive)
export class SSNValidator extends BaseValidator {
  constructor() {
    super(MedicalDataType.SSN);
  }

  validate(value: any, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value && context?.isRequired) {
      errors.push(this.createError('ssn', 'Social Security Number is required', 'SSN_REQUIRED', 'required'));
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    const cleanValue = String(value).replace(/\D/g, '');

    // Format validation
    if (cleanValue.length !== 9) {
      errors.push(this.createError('ssn', 'SSN must be exactly 9 digits', 'SSN_INVALID_LENGTH', 'format'));
    }

    // Business rules
    if (cleanValue === '000000000' || cleanValue === '123456789') {
      errors.push(this.createError('ssn', 'Invalid SSN format', 'SSN_INVALID_PATTERN', 'business'));
    }

    // Area number validation (first 3 digits)
    const areaNumber = cleanValue.substring(0, 3);
    if (areaNumber === '000' || areaNumber === '666' || areaNumber.startsWith('9')) {
      errors.push(this.createError('ssn', 'Invalid SSN area number', 'SSN_INVALID_AREA', 'business'));
    }

    // Security warning for high-privilege contexts
    if (context?.userRole !== 'admin' && context?.userRole !== 'doctor') {
      warnings.push(this.createWarning('ssn', 'SSN access logged for compliance', 'SSN_ACCESS_LOGGED'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Medical Email Validator
export class MedicalEmailValidator extends BaseValidator {
  constructor() {
    super(MedicalDataType.EMAIL);
  }

  validate(value: any, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value && context?.isRequired) {
      errors.push(this.createError('email', 'Email address is required', 'EMAIL_REQUIRED', 'required'));
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    const emailValue = String(value).trim().toLowerCase();

    // Basic email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      errors.push(this.createError('email', 'Please enter a valid email address', 'EMAIL_INVALID_FORMAT', 'format'));
    }

    // Healthcare domain validation
    const healthcareDomains = ['.gov', '.edu', '.org'];
    const isHealthcareDomain = healthcareDomains.some(domain => emailValue.includes(domain));
    
    if (context?.userRole === 'doctor' && !isHealthcareDomain) {
      warnings.push(this.createWarning('email', 'Consider using a professional healthcare email domain', 'EMAIL_NON_HEALTHCARE_DOMAIN', 'Use .edu, .gov, or institutional email for verification'));
    }

    // Disposable email detection
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const isDisposable = disposableDomains.some(domain => emailValue.includes(domain));
    
    if (isDisposable) {
      errors.push(this.createError('email', 'Disposable email addresses are not allowed', 'EMAIL_DISPOSABLE', 'security'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Blood Type Validator
export class BloodTypeValidator extends BaseValidator {
  private validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor() {
    super(MedicalDataType.BLOOD_TYPE);
  }

  validate(value: any, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value && context?.isRequired) {
      errors.push(this.createError('bloodType', 'Blood type is required', 'BLOOD_TYPE_REQUIRED', 'required'));
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    const bloodType = String(value).trim().toUpperCase();

    if (!this.validBloodTypes.includes(bloodType)) {
      errors.push(this.createError('bloodType', 'Please select a valid blood type', 'BLOOD_TYPE_INVALID', 'medical'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Vital Signs Validator
export class VitalSignsValidator extends BaseValidator {
  constructor(private vitalType: 'blood_pressure' | 'temperature' | 'heart_rate') {
    super(vitalType as MedicalDataType);
  }

  validate(value: any, context?: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value && context?.isRequired) {
      errors.push(this.createError(this.vitalType, `${this.vitalType.replace('_', ' ')} is required`, `${this.vitalType.toUpperCase()}_REQUIRED`, 'required'));
      return { isValid: false, errors, warnings };
    }

    if (!value) {
      return { isValid: true, errors, warnings };
    }

    switch (this.vitalType) {
      case 'blood_pressure':
        return this.validateBloodPressure(value, errors, warnings);
      case 'temperature':
        return this.validateTemperature(value, errors, warnings);
      case 'heart_rate':
        return this.validateHeartRate(value, errors, warnings);
      default:
        return { isValid: true, errors, warnings };
    }
  }

  private validateBloodPressure(value: any, errors: ValidationError[], warnings: ValidationWarning[]): ValidationResult {
    const bpPattern = /^(\d{2,3})\/(\d{2,3})$/;
    const match = String(value).match(bpPattern);

    if (!match) {
      errors.push(this.createError('bloodPressure', 'Blood pressure must be in format XXX/XX (e.g., 120/80)', 'BP_INVALID_FORMAT', 'format'));
      return { isValid: false, errors, warnings };
    }

    const systolic = parseInt(match[1]);
    const diastolic = parseInt(match[2]);

    // Range validation
    if (systolic < 60 || systolic > 300) {
      errors.push(this.createError('bloodPressure', 'Systolic pressure must be between 60-300 mmHg', 'BP_SYSTOLIC_OUT_OF_RANGE', 'range'));
    }

    if (diastolic < 30 || diastolic > 200) {
      errors.push(this.createError('bloodPressure', 'Diastolic pressure must be between 30-200 mmHg', 'BP_DIASTOLIC_OUT_OF_RANGE', 'range'));
    }

    // Medical warnings
    if (systolic >= 140 || diastolic >= 90) {
      warnings.push(this.createWarning('bloodPressure', 'Blood pressure reading indicates hypertension', 'BP_HYPERTENSION_WARNING', 'Consider medical consultation'));
    }

    if (systolic < 90 || diastolic < 60) {
      warnings.push(this.createWarning('bloodPressure', 'Blood pressure reading indicates hypotension', 'BP_HYPOTENSION_WARNING', 'Consider medical consultation'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateTemperature(value: any, errors: ValidationError[], warnings: ValidationWarning[]): ValidationResult {
    const temp = parseFloat(String(value));

    if (isNaN(temp)) {
      errors.push(this.createError('temperature', 'Temperature must be a valid number', 'TEMP_INVALID_NUMBER', 'format'));
      return { isValid: false, errors, warnings };
    }

    // Assume Fahrenheit
    if (temp < 90 || temp > 115) {
      errors.push(this.createError('temperature', 'Temperature must be between 90-115°F', 'TEMP_OUT_OF_RANGE', 'range'));
    }

    // Medical warnings
    if (temp >= 100.4) {
      warnings.push(this.createWarning('temperature', 'Temperature indicates fever', 'TEMP_FEVER_WARNING', 'Consider medical evaluation'));
    }

    if (temp < 95) {
      warnings.push(this.createWarning('temperature', 'Temperature indicates hypothermia', 'TEMP_HYPOTHERMIA_WARNING', 'Seek immediate medical attention'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateHeartRate(value: any, errors: ValidationError[], warnings: ValidationWarning[]): ValidationResult {
    const hr = parseInt(String(value));

    if (isNaN(hr)) {
      errors.push(this.createError('heartRate', 'Heart rate must be a valid number', 'HR_INVALID_NUMBER', 'format'));
      return { isValid: false, errors, warnings };
    }

    if (hr < 30 || hr > 250) {
      errors.push(this.createError('heartRate', 'Heart rate must be between 30-250 bpm', 'HR_OUT_OF_RANGE', 'range'));
    }

    // Medical warnings
    if (hr > 100) {
      warnings.push(this.createWarning('heartRate', 'Heart rate indicates tachycardia', 'HR_TACHYCARDIA_WARNING', 'Consider medical evaluation'));
    }

    if (hr < 60) {
      warnings.push(this.createWarning('heartRate', 'Heart rate indicates bradycardia', 'HR_BRADYCARDIA_WARNING', 'Consider medical evaluation if symptomatic'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Medical Form Validator
export class MedicalFormValidator {
  private validators = new Map<MedicalDataType, Validator>();

  constructor() {
    this.registerDefaultValidators();
  }

  private registerDefaultValidators(): void {
    this.validators.set(MedicalDataType.PATIENT_ID, new PatientIdValidator());
    this.validators.set(MedicalDataType.SSN, new SSNValidator());
    this.validators.set(MedicalDataType.EMAIL, new MedicalEmailValidator());
    this.validators.set(MedicalDataType.BLOOD_TYPE, new BloodTypeValidator());
    this.validators.set(MedicalDataType.BLOOD_PRESSURE, new VitalSignsValidator('blood_pressure'));
    this.validators.set(MedicalDataType.TEMPERATURE, new VitalSignsValidator('temperature'));
    this.validators.set(MedicalDataType.HEART_RATE, new VitalSignsValidator('heart_rate'));
  }

  registerValidator(dataType: MedicalDataType, validator: Validator): void {
    this.validators.set(dataType, validator);
  }

  validateField(dataType: MedicalDataType, value: any, context?: ValidationContext): ValidationResult {
    const validator = this.validators.get(dataType);
    
    if (!validator) {
      return {
        isValid: false,
        errors: [{
          field: dataType,
          message: 'No validator found for this field type',
          code: 'VALIDATOR_NOT_FOUND',
          severity: 'error',
          type: 'business'
        }],
        warnings: []
      };
    }

    return validator.validate(value, context);
  }

  validateForm(formData: Record<string, any>, fieldTypes: Record<string, MedicalDataType>, context?: ValidationContext): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    Object.entries(formData).forEach(([fieldName, fieldValue]) => {
      const dataType = fieldTypes[fieldName];
      if (dataType) {
        const result = this.validateField(dataType, fieldValue, context);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}

// Utility functions for medical validation
export const createMedicalValidator = () => new MedicalFormValidator();

export const validateMedicalData = (
  dataType: MedicalDataType,
  value: any,
  context?: ValidationContext
): ValidationResult => {
  const validator = new MedicalFormValidator();
  return validator.validateField(dataType, value, context);
};

export const getMedicalValidationMessage = (error: ValidationError): string => {
  return `${error.field}: ${error.message}`;
};

// Export all validator classes for custom implementations
export {
  PatientIdValidator,
  SSNValidator,
  MedicalEmailValidator,
  BloodTypeValidator,
  VitalSignsValidator
};