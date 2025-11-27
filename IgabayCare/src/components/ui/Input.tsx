import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  helperText?: string;
  showPasswordToggle?: boolean;
  loading?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  icon,
  helperText,
  showPasswordToggle = false,
  loading = false,
  className = '',
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;

  const hasValidation = error || success;
  const validationColor = error ? 'red' : success ? 'green' : 'blue';
  
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
          isFocused ? `text-${validationColor}-600` : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 ${
            isFocused ? `text-${validationColor}-500` : 'text-gray-400'
          }`}>
            {icon}
          </div>
        )}
        
        <input
          className={`
            block w-full px-4 py-3 border-2 rounded-xl shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-2 
            transition-all duration-200 transform
            ${icon ? 'pl-12' : 'pl-4'}
            ${showPasswordToggle ? 'pr-12' : ''}
            ${hasValidation ? '' : 'border-gray-200 hover:border-gray-300'}
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : ''}
            ${success ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50' : ''}
            ${!hasValidation && isFocused ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500 shadow-lg bg-blue-50' : ''}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          type={inputType}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          disabled={loading}
          {...props}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-200"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        
        {hasValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {error && <AlertCircle size={20} className="text-red-500" />}
            {success && <CheckCircle size={20} className="text-green-500" />}
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {/* Helper text or validation messages */}
      {(helperText || error || success) && (
        <div className="mt-2 space-y-1">
          {helperText && !hasValidation && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle size={14} />
              {success}
            </p>
          )}
        </div>
      )}
    </div>
  );
};