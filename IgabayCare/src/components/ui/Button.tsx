import React from 'react';
import { IButtonComponent } from '../../core/interfaces/IUIComponents';
import { useMedicalTheme } from '../../core/providers/MedicalThemeProvider';

// Button variant styles following medical design system
const getButtonVariants = (userRole: string) => ({
  primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
  secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
  outline: 'border-2 border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95',
  ghost: 'text-blue-700 hover:bg-blue-50 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 active:scale-95',
  medical: 'bg-gradient-to-r from-blue-500 to-sky-600 text-white hover:from-blue-600 hover:to-sky-700 focus:ring-blue-500 shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
  gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 active:scale-95',
  success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
  info: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95'
});

// Button size styles
const buttonSizes = {
  sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm min-h-[32px] sm:min-h-[36px]',
  md: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2 min-h-[36px] sm:min-h-[40px]',
  lg: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base min-h-[40px] sm:min-h-[48px]',
  xl: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg min-h-[48px] sm:min-h-[56px]'
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

export const SuccessButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
);

export const WarningButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="warning" {...props} />
);

export const InfoButton: React.FC<Omit<IButtonComponent, 'variant'>> = (props) => (
  <Button variant="info" {...props} />
);