import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
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

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-gray-200 animate-pulse ${getRoundedClass()} ${className}`}
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