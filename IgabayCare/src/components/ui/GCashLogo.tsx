import React from 'react';

interface GCashLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GCashLogo: React.FC<GCashLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* GCash blue gradient background */}
        <defs>
          <linearGradient id="gcashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E90FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="url(#gcashGradient)" />
        
        {/* Main "G" shape - outer circle */}
        <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeDasharray="0 0 50 50" transform="rotate(-45 50 50)" />
        
        {/* Inner "G" completion */}
        <path
          d="M50 35 L50 50 L65 50"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Signal waves */}
        <path
          d="M70 40 Q75 45 70 50"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M75 35 Q82 45 75 55"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M80 30 Q89 45 80 60"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </svg>
    </div>
  );
};
