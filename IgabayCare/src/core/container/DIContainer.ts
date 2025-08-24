/**
 * Dependency Injection Container
 * Implements Dependency Inversion Principle (DIP) by providing an abstraction layer
 * for service management and dependency resolution
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = (...args: any[]) => T;
type ServiceIdentifier<T = any> = string | symbol | Constructor<T>;

// Lifecycle management for services
export enum ServiceLifetime {
  Transient = 'transient', // New instance every time
  Singleton = 'singleton', // Single instance throughout app lifetime
  Scoped = 'scoped',      // Single instance per scope (e.g., per request)
}

// Service registration metadata
interface ServiceRegistration<T = any> {
  identifier: ServiceIdentifier<T>;
  implementation?: Constructor<T>;
  factory?: Factory<T>;
  instance?: T;
  lifetime: ServiceLifetime;
  dependencies?: ServiceIdentifier[];
}

// Dependency injection container class
export class DIContainer {
  private services = new Map<ServiceIdentifier, ServiceRegistration>();
  private instances = new Map<ServiceIdentifier, any>();
  private scopedInstances = new Map<string, Map<ServiceIdentifier, any>>();
  private currentScope?: string;

  /**
   * Register a service with its implementation
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Transient,
    dependencies: ServiceIdentifier[] = []
  ): this {
    this.services.set(identifier, {
      identifier,
      implementation,
      lifetime,
      dependencies,
    });
    return this;
  }

  /**
   * Register a service with a factory function
   */
  registerFactory<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Transient
  ): this {
    this.services.set(identifier, {
      identifier,
      factory,
      lifetime,
    });
    return this;
  }

  /**
   * Register a singleton instance
   */
  registerInstance<T>(
    identifier: ServiceIdentifier<T>,
    instance: T
  ): this {
    this.services.set(identifier, {
      identifier,
      instance,
      lifetime: ServiceLifetime.Singleton,
    });
    this.instances.set(identifier, instance);
    return this;
  }

  /**
   * Resolve a service by its identifier
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const registration = this.services.get(identifier);
    if (!registration) {
      throw new Error(`Service not registered: ${String(identifier)}`);
    }

    // Return existing instance based on lifetime
    switch (registration.lifetime) {
      case ServiceLifetime.Singleton:
        if (this.instances.has(identifier)) {
          return this.instances.get(identifier);
        }
        break;
      
      case ServiceLifetime.Scoped:
        if (this.currentScope) {
          const scopedInstances = this.scopedInstances.get(this.currentScope);
          if (scopedInstances && scopedInstances.has(identifier)) {
            return scopedInstances.get(identifier);
          }
        }
        break;
      
      case ServiceLifetime.Transient:
        // Always create new instance
        break;
    }

    // Create new instance
    const instance = this.createInstance(registration);

    // Store instance based on lifetime
    switch (registration.lifetime) {
      case ServiceLifetime.Singleton:
        this.instances.set(identifier, instance);
        break;
      
      case ServiceLifetime.Scoped:
        if (this.currentScope) {
          if (!this.scopedInstances.has(this.currentScope)) {
            this.scopedInstances.set(this.currentScope, new Map());
          }
          this.scopedInstances.get(this.currentScope)!.set(identifier, instance);
        }
        break;
    }

    return instance;
  }

  /**
   * Create a new scope for scoped services
   */
  createScope(scopeId: string): this {
    this.currentScope = scopeId;
    if (!this.scopedInstances.has(scopeId)) {
      this.scopedInstances.set(scopeId, new Map());
    }
    return this;
  }

  /**
   * Dispose of a scope and its instances
   */
  disposeScope(scopeId: string): this {
    this.scopedInstances.delete(scopeId);
    if (this.currentScope === scopeId) {
      this.currentScope = undefined;
    }
    return this;
  }

  /**
   * Check if a service is registered
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.services.has(identifier);
  }

  /**
   * Remove a service registration
   */
  unregister<T>(identifier: ServiceIdentifier<T>): this {
    this.services.delete(identifier);
    this.instances.delete(identifier);
    return this;
  }

  /**
   * Clear all registrations and instances
   */
  clear(): this {
    this.services.clear();
    this.instances.clear();
    this.scopedInstances.clear();
    this.currentScope = undefined;
    return this;
  }

  /**
   * Create instance from registration
   */
  private createInstance<T>(registration: ServiceRegistration<T>): T {
    if (registration.instance) {
      return registration.instance;
    }

    if (registration.factory) {
      return registration.factory();
    }

    if (registration.implementation) {
      // Resolve dependencies
      const dependencies = registration.dependencies?.map(dep => this.resolve(dep)) || [];
      return new registration.implementation(...dependencies);
    }

    throw new Error(`Cannot create instance for: ${String(registration.identifier)}`);
  }
}

// Global container instance
export const container = new DIContainer();

// Service identifier symbols for type safety
export const SERVICE_IDENTIFIERS = {
  // Authentication services
  AuthenticationService: Symbol('AuthenticationService'),
  UserRegistrationService: Symbol('UserRegistrationService'),
  PasswordService: Symbol('PasswordService'),
  ValidationService: Symbol('ValidationService'),
  TokenService: Symbol('TokenService'),
  SessionService: Symbol('SessionService'),
  RoleService: Symbol('RoleService'),

  // Clinical services
  ClinicService: Symbol('ClinicService'),
  DoctorService: Symbol('DoctorService'),
  PatientService: Symbol('PatientService'),
  SpecialtyService: Symbol('SpecialtyService'),
  VerificationService: Symbol('VerificationService'),

  // Data services
  DatabaseService: Symbol('DatabaseService'),
  StorageService: Symbol('StorageService'),
  CacheService: Symbol('CacheService'),

  // Utility services
  LoggingService: Symbol('LoggingService'),
  NotificationService: Symbol('NotificationService'),
  EmailService: Symbol('EmailService'),
  FileService: Symbol('FileService'),
} as const;

// Decorator for automatic dependency injection
export function Injectable<T>(
  identifier: ServiceIdentifier<T>,
  lifetime: ServiceLifetime = ServiceLifetime.Transient
) {
  return function (constructor: Constructor<T>) {
    container.register(identifier, constructor, lifetime);
    return constructor;
  };
}

// Decorator for injecting dependencies
export function Inject(identifier: ServiceIdentifier) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store dependency metadata for later resolution
    const existingTokens = Reflect.getMetadata('custom:inject_tokens', target) || [];
    existingTokens[parameterIndex] = identifier;
    Reflect.defineMetadata('custom:inject_tokens', existingTokens, target);
  };
}

// Helper function to get service
export function getService<T>(identifier: ServiceIdentifier<T>): T {
  return container.resolve(identifier);
}

// Helper function to register service
export function registerService<T>(
  identifier: ServiceIdentifier<T>,
  implementation: Constructor<T> | Factory<T> | T,
  lifetime: ServiceLifetime = ServiceLifetime.Transient
): void {
  if (typeof implementation === 'function' && implementation.prototype) {
    // Constructor
    container.register(identifier, implementation as Constructor<T>, lifetime);
  } else if (typeof implementation === 'function') {
    // Factory
    container.registerFactory(identifier, implementation as Factory<T>, lifetime);
  } else {
    // Instance
    container.registerInstance(identifier, implementation);
  }
}

// Service locator pattern (use sparingly, prefer constructor injection)
export class ServiceLocator {
  static get<T>(identifier: ServiceIdentifier<T>): T {
    return container.resolve(identifier);
  }

  static tryGet<T>(identifier: ServiceIdentifier<T>): T | null {
    try {
      return container.resolve(identifier);
    } catch {
      return null;
    }
  }

  static isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    return container.isRegistered(identifier);
  }
}