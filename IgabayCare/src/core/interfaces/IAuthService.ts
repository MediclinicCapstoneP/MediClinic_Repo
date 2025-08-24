/**
 * Abstract interfaces for authentication services following SOLID principles
 * Interface Segregation Principle: Split large interfaces into smaller, focused ones
 */

// Common result type for all operations
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Base user interface
export interface IUser {
  id: string;
  email: string;
  role: 'patient' | 'clinic' | 'doctor';
  createdAt: string;
  updatedAt?: string;
}

// Authentication data interfaces
export interface ISignInCredentials {
  email: string;
  password: string;
}

export interface ISignUpData extends ISignInCredentials {
  firstName: string;
  lastName: string;
  role: 'patient' | 'clinic' | 'doctor';
  clinicName?: string;
  specialization?: string;
}

// Segregated authentication interfaces
export interface IAuthenticationService {
  signIn(credentials: ISignInCredentials): Promise<ServiceResult<IUser>>;
  signOut(): Promise<ServiceResult>;
  getCurrentUser(): Promise<ServiceResult<IUser>>;
  isAuthenticated(): Promise<boolean>;
}

export interface IUserRegistrationService {
  registerUser(data: ISignUpData): Promise<ServiceResult<IUser>>;
  verifyEmail(token: string): Promise<ServiceResult>;
  resendVerification(email: string): Promise<ServiceResult>;
}

export interface IPasswordService {
  resetPassword(email: string): Promise<ServiceResult>;
  changePassword(oldPassword: string, newPassword: string): Promise<ServiceResult>;
  validatePassword(password: string): { isValid: boolean; errors: string[] };
}

export interface IProfileService<T> {
  getProfile(userId: string): Promise<ServiceResult<T>>;
  updateProfile(userId: string, data: Partial<T>): Promise<ServiceResult<T>>;
  deleteProfile(userId: string): Promise<ServiceResult>;
}

export interface IValidationService {
  validateEmail(email: string): boolean;
  validatePassword(password: string): { isValid: boolean; errors: string[] };
  validateSignUpData(data: ISignUpData): { isValid: boolean; errors: string[] };
  validateRequiredFields(data: Record<string, any>, requiredFields: string[]): { isValid: boolean; errors: string[] };
}

// Role-based access control interfaces
export interface IRoleService {
  getUserRole(userId: string): Promise<ServiceResult<string>>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  assignRole(userId: string, role: string): Promise<ServiceResult>;
}

// Token management interface
export interface ITokenService {
  setToken(token: string): void;
  getToken(): string | null;
  removeToken(): void;
  isTokenValid(token: string): boolean;
  refreshToken(): Promise<ServiceResult<string>>;
}

// Session management interface
export interface ISessionService {
  createSession(user: IUser): Promise<ServiceResult<string>>;
  validateSession(sessionId: string): Promise<ServiceResult<IUser>>;
  destroySession(sessionId: string): Promise<ServiceResult>;
  refreshSession(sessionId: string): Promise<ServiceResult<string>>;
}