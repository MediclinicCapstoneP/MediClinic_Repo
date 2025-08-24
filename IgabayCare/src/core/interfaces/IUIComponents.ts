/**
 * UI Component interfaces following SOLID principles
 * Interface Segregation Principle: Specific interfaces for UI concerns
 */

import { ReactNode } from 'react';

// Base component interfaces
export interface IBaseComponent {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

export interface IClickableComponent extends IBaseComponent {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface IFormComponent extends IBaseComponent {
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Theme and styling interfaces
export interface IThemeProvider {
  primary: string;
  secondary: string;
  accent: string;
  medical: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface IVariantComponent extends IBaseComponent {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'medical' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Button specific interfaces
export interface IButtonComponent extends IClickableComponent, IVariantComponent {
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Card component interfaces
export interface ICardComponent extends IBaseComponent {
  hover?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export interface ICardHeaderComponent extends IBaseComponent {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export interface ICardContentComponent extends IBaseComponent {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Input component interfaces
export interface IInputComponent extends IFormComponent {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  readOnly?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface ISelectComponent extends IFormComponent {
  options: ISelectOption[];
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
}

export interface ISelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: ReactNode;
}

// Modal and dialog interfaces
export interface IModalComponent extends IBaseComponent {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backdrop?: 'static' | 'clickable';
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface IDialogComponent extends IModalComponent {
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Navigation interfaces
export interface INavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: INavigationItem[];
}

export interface INavigationComponent extends IBaseComponent {
  items: INavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'tabs' | 'pills' | 'sidebar' | 'breadcrumb';
  onItemClick?: (item: INavigationItem) => void;
}

// Layout interfaces
export interface ILayoutComponent extends IBaseComponent {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
}

export interface IDashboardLayoutComponent extends ILayoutComponent {
  navigationItems: INavigationItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user?: any;
  onSignOut?: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  variant?: 'patient' | 'clinic' | 'doctor';
  showNavbar?: boolean;
}

// Table interfaces
export interface ITableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface ITableComponent<T = any> extends IBaseComponent {
  data: T[];
  columns: ITableColumn<T>[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<keyof T, any>) => void;
  emptyMessage?: string;
}

// Form interfaces
export interface IFormFieldComponent extends IFormComponent {
  label?: string;
  helperText?: string;
  tooltip?: string;
  labelPosition?: 'top' | 'left' | 'floating';
}

export interface IFormComponent extends IBaseComponent {
  onSubmit: (data: any) => void;
  validationSchema?: any;
  initialValues?: any;
  resetOnSubmit?: boolean;
  showProgress?: boolean;
}

// Medical-specific component interfaces
export interface IMedicalCardComponent extends ICardComponent {
  patientInfo?: {
    name: string;
    id: string;
    dateOfBirth: string;
    bloodType?: string;
  };
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface IAppointmentCardComponent extends IMedicalCardComponent {
  appointment: {
    id: string;
    date: string;
    time: string;
    doctor: string;
    specialty: string;
    type: string;
    duration: number;
  };
  onReschedule?: () => void;
  onCancel?: () => void;
  onJoin?: () => void;
}

export interface IMedicalInfoDisplayComponent extends IBaseComponent {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'normal' | 'warning' | 'critical';
}