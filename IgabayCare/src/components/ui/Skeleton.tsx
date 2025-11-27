import React from 'react';
import { Stethoscope, Calendar, User, Activity, Heart, Pill } from 'lucide-react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'default' | 'shimmer';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'shimmer'
}) => {
  const getRoundedClass = () => {
    switch (rounded) {
      case 'none': return '';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'full': return 'rounded-full';
      default: return 'rounded-md';
    }
  };

  const getAnimationClass = () => {
    return variant === 'shimmer'
      ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer'
      : 'bg-gray-200 animate-pulse';
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${getAnimationClass()} ${getRoundedClass()} ${className}`}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={index === lines - 1 ? 16 : 20}
        className={index === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <Skeleton
      rounded="full"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
    <div className="flex items-center space-x-3 mb-4">
      <SkeletonAvatar size="md" />
      <div className="flex-1">
        <Skeleton height={20} className="w-3/4 mb-2" />
        <Skeleton height={16} className="w-1/2" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height={20} className="flex-1" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height={16} className="flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonNavbar: React.FC = () => (
  <div className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Skeleton width={120} height={32} />
        <div className="hidden md:block">
          <Skeleton width={150} height={24} className="mb-1" />
          <Skeleton width={100} height={16} />
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <Skeleton height={40} className="w-full" />
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <Skeleton width={40} height={40} rounded="lg" />
        <Skeleton width={40} height={40} rounded="lg" />
        <div className="flex items-center space-x-2">
          <SkeletonAvatar size="sm" />
          <Skeleton width={80} height={16} className="hidden sm:block" />
        </div>
        <Skeleton width={80} height={32} />
      </div>
    </div>
  </div>
);

export const SkeletonSidebar: React.FC = () => (
  <div className="bg-white shadow-lg border-r border-gray-200 w-64 flex flex-col h-full">
    {/* Logo */}
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <Skeleton width={40} height={40} rounded="lg" />
        <div className="flex-1">
          <Skeleton width={120} height={24} className="mb-1" />
          <Skeleton width={80} height={16} />
        </div>
      </div>
    </div>

    {/* Navigation items */}
    <div className="flex-1 p-4 space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          <Skeleton width={20} height={20} />
          <Skeleton width={100} height={16} />
        </div>
      ))}
    </div>

    {/* User profile */}
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <Skeleton width={80} height={16} className="mb-1" />
          <Skeleton width={120} height={12} />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex">
    <SkeletonSidebar />
    <div className="flex-1 flex flex-col">
      <SkeletonNavbar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <Skeleton width={200} height={32} />
            <Skeleton width={120} height={40} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>

          {/* Main Content */}
          <SkeletonTable rows={6} columns={5} />
        </div>
      </main>
    </div>
  </div>
);

export const SkeletonAuthForm: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      {/* Header */}
      <div className="text-center">
        <Skeleton width={64} height={64} rounded="full" className="mx-auto mb-4" />
        <Skeleton width={200} height={32} className="mx-auto mb-2" />
        <Skeleton width={150} height={16} className="mx-auto" />
      </div>

      {/* Form Card */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-100 rounded-2xl p-6">
        <div className="space-y-6">
          {/* Form Title */}
          <div className="text-center">
            <Skeleton width={120} height={24} className="mx-auto" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Skeleton width={80} height={16} className="mb-2" />
              <Skeleton height={40} className="w-full" />
            </div>
            <div>
              <Skeleton width={80} height={16} className="mb-2" />
              <Skeleton height={40} className="w-full" />
            </div>
            <div>
              <Skeleton width={80} height={16} className="mb-2" />
              <Skeleton height={40} className="w-full" />
            </div>
          </div>

          {/* Submit Button */}
          <Skeleton height={44} className="w-full" />

          {/* Links */}
          <div className="text-center space-y-2">
            <Skeleton width={200} height={16} className="mx-auto" />
            <Skeleton width={150} height={16} className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced medical-themed appointment card skeleton
export const SkeletonAppointmentCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <div className="min-w-0">
            <Skeleton height={18} width="140px" className="mb-1" />
            <Skeleton height={14} width="100px" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton width="80px" height={24} rounded="full" />
          <Skeleton width="60px" height={16} rounded="full" />
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Skeleton height={14} width="80px" />
          </div>
          <Skeleton height={16} width="100px" className="mb-1" />
          <Skeleton height={14} width="60px" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            <Skeleton height={14} width="70px" />
          </div>
          <Skeleton height={16} width="90px" className="mb-1" />
          <Skeleton height={14} width="50px" />
        </div>
      </div>
      
      {/* Actions */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <Skeleton width="60px" height={32} rounded="md" />
          <Skeleton width="80px" height={32} rounded="md" />
          <Skeleton width="70px" height={32} rounded="md" />
        </div>
      </div>
    </div>
  );
};

// Enhanced patient record card skeleton
export const SkeletonPatientCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-blue-400" />
        </div>
        <div className="flex-1">
          <Skeleton height={20} width="160px" className="mb-2" />
          <Skeleton height={14} width="120px" className="mb-1" />
          <Skeleton height={14} width="80px" />
        </div>
        <div className="text-right">
          <Skeleton width="60px" height={20} rounded="full" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <Skeleton height={14} width="80px" />
            </div>
            <Skeleton height={16} width="100px" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-gray-400" />
              <Skeleton height={14} width="70px" />
            </div>
            <Skeleton height={16} width="90px" />
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-gray-400" />
            <Skeleton height={14} width="100px" />
          </div>
          <div className="space-y-2">
            <Skeleton height={14} width="100%" />
            <Skeleton height={14} width="80%" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Skeleton width="60px" height={32} rounded="md" />
        <Skeleton width="100px" height={32} rounded="md" />
      </div>
    </div>
  );
};

// Medical dashboard stats skeleton
export const SkeletonMedicalStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: Calendar, color: 'blue', title: 'Today\'s Appointments' },
        { icon: Activity, color: 'green', title: 'Active Patients' },
        { icon: Heart, color: 'red', title: 'Critical Cases' },
        { icon: Pill, color: 'purple', title: 'Prescriptions' }
      ].map(({ icon: Icon, color, title }, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <Skeleton width="60px" height={32} />
          </div>
          <div className="space-y-2">
            <Skeleton height={14} width="120px" />
            <Skeleton height={20} width="80px" />
            <div className="flex items-center gap-2">
              <Skeleton height={12} width="40px" />
              <Skeleton height={12} width="60px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
