/**
 * Core module barrel exports
 * Consolidates all core functionality for easy importing
 */

// Dependency Injection Container
export * from './container/DIContainer';

// Interfaces
export * from './interfaces/IAuthService';
export * from './interfaces/IClinicalService';
export * from './interfaces/IUIComponents';

// Design System
export * from './design/MedicalDesignSystem';

// Providers
export * from './providers/MedicalThemeProvider';

// Validation
export * from './validation/MedicalValidation';

// Components
export * from './components/ExtensibleComponents';

// Factories
export * from './factories/ComponentFactory';

// Layouts
export * from './layouts/MedicalLayouts';

// Re-export specific types and interfaces for convenience
export type { ComponentType } from './factories/ComponentFactory';
export { ComponentFactoryRegistry } from './factories/ComponentFactory';

// Additional type definitions for consistency
export type MedicalDataType = 'patient_id' | 'ssn' | 'email' | 'blood_type' | 'phone' | 'medical_record_number';
export type ValidationContext = 'medical' | 'administrative' | 'clinical' | 'registration' | 'emergency';

// Medical Form Validator interface
export interface MedicalFormValidator {
  validate(value: string, context?: ValidationContext): { 
    isValid: boolean; 
    errors: string[];
    warnings?: string[];
  };
  getType(): MedicalDataType;
  getDisplayName(): string;
  getErrorMessages(): Record<string, string>;
}

// Healthcare User Role types
export type HealthcareRole = 'patient' | 'doctor' | 'nurse' | 'clinic' | 'admin' | 'pharmacist';

// Medical Component Props
export interface MedicalComponentProps {
  variant?: 'primary' | 'secondary' | 'emergency' | 'warning' | 'clinical';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  accessibility?: {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    role?: string;
  };
  medicalContext?: ValidationContext;
}

// Medical Theme Configuration
export interface MedicalThemeConfig {
  role: HealthcareRole;
  colorScheme: 'light' | 'dark' | 'high-contrast';
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
  };
  medicalContext: ValidationContext;
}