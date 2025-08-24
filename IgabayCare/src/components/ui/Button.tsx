import React from 'react';
import { IButtonComponent } from '../../core/interfaces/IUIComponents';
import { useMedicalTheme } from '../../core/providers/MedicalThemeProvider';

// Button variant styles following medical design system
const getButtonVariants = (userRole: string) => ({
  primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl transition-all duration-200',
  secondary: 'bg-medical-500 hover:bg-medical-600 text-white focus:ring-medical-500 shadow-lg hover:shadow-xl transition-all duration-200',
  outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500 transition-all duration-200',
  ghost: 'text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-500 transition-all duration-200',
  medical: 'bg-clinical-500 hover:bg-clinical-600 text-white focus:ring-clinical-500 shadow-lg hover:shadow-xl transition-all duration-200',
  danger: 'bg-emergency-500 hover:bg-emergency-600 text-white focus:ring-emergency-500 shadow-lg hover:shadow-xl transition-all duration-200',
  gradient: 'bg-gradient-to-r from-primary-500 to-medical-500 hover:from-primary-600 hover:to-medical-600 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl transition-all duration-200'
});

// Button size styles
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
  xl: 'px-8 py-4 text-lg rounded-xl'
};

// Loading spinner component (SRP: Single responsibility for loading indication)
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <svg 
      className={`animate-spin -ml-1 mr-2 ${sizeClasses[size]}`} 
      fill="none" 
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Button icon component (SRP: Single responsibility for icon handling)
const ButtonIcon: React.FC<{ 
  icon?: React.ReactNode; 
  position: 'left' | 'right';
  hasText: boolean;
}> = ({ icon, position, hasText }) => {
  if (!icon) return null;
  
  const marginClass = hasText 
    ? (position === 'left' ? 'mr-2' : 'ml-2') 
    : '';
    
  return (
    <span className={`inline-flex items-center ${marginClass}`}>
      {icon}
    </span>
  );
};

// Main Button component (SRP: Single responsibility for button rendering and behavior)
export const Button: React.FC<IButtonComponent> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const { userRole } = useMedicalTheme();
  const variants = getButtonVariants(userRole);
  
  const baseClasses = [
    'inline-flex items-center justify-center font-medium',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-all duration-200',
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : ''
  ].filter(Boolean).join(' ');
  
  const buttonClasses = [
    baseClasses,
    variants[variant],
    buttonSizes[size],
    className
  ].filter(Boolean).join(' ');
  
  const isDisabled = disabled || loading;
  const hasText = Boolean(children);
  const showIconLeft = icon && iconPosition === 'left';
  const showIconRight = icon && iconPosition === 'right';
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoadingSpinner size={size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md'} />}
      {!loading && showIconLeft && (
        <ButtonIcon icon={icon} position="left" hasText={hasText} />
      )}
      {children}
      {!loading && showIconRight && (
        <ButtonIcon icon={icon} position="right" hasText={hasText} />
      )}
    </button>
  );
};

// Specialized button components (SRP: Specific button types with single purposes)
export const PrimaryButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const MedicalButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="medical" {...props} />
);

export const DangerButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);

export const GhostButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export const GradientButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="gradient" {...props} />
);