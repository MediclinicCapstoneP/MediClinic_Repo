/**
 * Service Registration Configuration
 * Configures all service dependencies and their lifetimes
 */

import { 
  container, 
  SERVICE_IDENTIFIERS, 
  ServiceLifetime 
} from './DIContainer';

// Import service implementations (we'll create these)
import { SupabaseAuthenticationService } from '../services/SupabaseAuthenticationService';
import { SupabaseUserRegistrationService } from '../services/SupabaseUserRegistrationService';
import { PasswordValidationService } from '../services/PasswordValidationService';
import { ValidationService } from '../services/ValidationService';
import { JWTTokenService } from '../services/JWTTokenService';
import { SupabaseSessionService } from '../services/SupabaseSessionService';
import { RoleBasedAccessService } from '../services/RoleBasedAccessService';
import { SupabaseClinicService } from '../services/SupabaseClinicService';
import { SupabaseDoctorService } from '../services/SupabaseDoctorService';
import { SupabasePatientService } from '../services/SupabasePatientService';
import { ClinicSpecialtyService } from '../services/ClinicSpecialtyService';
import { MedicalVerificationService } from '../services/MedicalVerificationService';

/**
 * Configure all service registrations
 */
export function configureServices(): void {
  // Authentication Services
  container.register(
    SERVICE_IDENTIFIERS.AuthenticationService,
    SupabaseAuthenticationService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.UserRegistrationService,
    SupabaseUserRegistrationService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.PasswordService,
    PasswordValidationService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.ValidationService,
    ValidationService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.TokenService,
    JWTTokenService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.SessionService,
    SupabaseSessionService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.RoleService,
    RoleBasedAccessService,
    ServiceLifetime.Singleton
  );

  // Clinical Services
  container.register(
    SERVICE_IDENTIFIERS.ClinicService,
    SupabaseClinicService,
    ServiceLifetime.Singleton,
    [SERVICE_IDENTIFIERS.SpecialtyService] // Dependencies
  );

  container.register(
    SERVICE_IDENTIFIERS.DoctorService,
    SupabaseDoctorService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.PatientService,
    SupabasePatientService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.SpecialtyService,
    ClinicSpecialtyService,
    ServiceLifetime.Singleton
  );

  container.register(
    SERVICE_IDENTIFIERS.VerificationService,
    MedicalVerificationService,
    ServiceLifetime.Singleton
  );

  // Register factory services for configuration-based services
  container.registerFactory(
    SERVICE_IDENTIFIERS.LoggingService,
    () => createLoggingService(),
    ServiceLifetime.Singleton
  );

  container.registerFactory(
    SERVICE_IDENTIFIERS.NotificationService,
    () => createNotificationService(),
    ServiceLifetime.Singleton
  );
}

/**
 * Factory functions for configuration-based services
 */
function createLoggingService() {
  return {
    log: (level: string, message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${message}`, data);
      }
      // In production, send to logging service
    },
    error: (message: string, error?: Error) => {
      console.error(message, error);
      // Send to error tracking service
    },
    warn: (message: string, data?: any) => {
      console.warn(message, data);
    },
    info: (message: string, data?: any) => {
      console.info(message, data);
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(message, data);
      }
    }
  };
}

function createNotificationService() {
  return {
    success: (message: string) => {
      // Show success notification
      console.log('SUCCESS:', message);
    },
    error: (message: string) => {
      // Show error notification
      console.error('ERROR:', message);
    },
    warning: (message: string) => {
      // Show warning notification
      console.warn('WARNING:', message);
    },
    info: (message: string) => {
      // Show info notification
      console.log('INFO:', message);
    }
  };
}

/**
 * Get typed service instances
 */
export const Services = {
  auth: () => container.resolve(SERVICE_IDENTIFIERS.AuthenticationService),
  registration: () => container.resolve(SERVICE_IDENTIFIERS.UserRegistrationService),
  password: () => container.resolve(SERVICE_IDENTIFIERS.PasswordService),
  validation: () => container.resolve(SERVICE_IDENTIFIERS.ValidationService),
  token: () => container.resolve(SERVICE_IDENTIFIERS.TokenService),
  session: () => container.resolve(SERVICE_IDENTIFIERS.SessionService),
  role: () => container.resolve(SERVICE_IDENTIFIERS.RoleService),
  clinic: () => container.resolve(SERVICE_IDENTIFIERS.ClinicService),
  doctor: () => container.resolve(SERVICE_IDENTIFIERS.DoctorService),
  patient: () => container.resolve(SERVICE_IDENTIFIERS.PatientService),
  specialty: () => container.resolve(SERVICE_IDENTIFIERS.SpecialtyService),
  verification: () => container.resolve(SERVICE_IDENTIFIERS.VerificationService),
  logging: () => container.resolve(SERVICE_IDENTIFIERS.LoggingService),
  notification: () => container.resolve(SERVICE_IDENTIFIERS.NotificationService),
} as const;

/**
 * Initialize the dependency injection system
 */
export function initializeDI(): void {
  configureServices();
  console.log('Dependency Injection container initialized with', container['services'].size, 'services');
}

/**
 * Clean up resources
 */
export function disposeDI(): void {
  container.clear();
  console.log('Dependency Injection container disposed');
}