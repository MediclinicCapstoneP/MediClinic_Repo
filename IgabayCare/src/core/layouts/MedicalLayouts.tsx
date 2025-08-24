/**
 * Professional Medical Layout Components
 * Clinic-style layouts with medical typography and spacing
 */

import React, { ReactNode } from 'react';
import { Activity, Bell, Search, User, Settings, HelpCircle, Shield, Heart, Stethoscope, Calendar, FileText, Users } from 'lucide-react';
import { IDashboardLayoutComponent, ILayoutComponent } from '../interfaces/IUIComponents';
import { useMedicalTheme } from '../providers/MedicalThemeProvider';

// Medical Typography Components
export const MedicalTypography = {
  // Main heading for medical forms and sections
  MainHeading: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <h1 className={`text-3xl font-bold text-neutral-900 tracking-tight leading-tight mb-6 ${className}`}>
      {children}
    </h1>
  ),

  // Section heading for medical content
  SectionHeading: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <h2 className={`text-xl font-semibold text-neutral-800 mb-4 border-b border-neutral-200 pb-2 ${className}`}>
      {children}
    </h2>
  ),

  // Subsection heading
  SubHeading: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <h3 className={`text-lg font-medium text-neutral-700 mb-3 ${className}`}>
      {children}
    </h3>
  ),

  // Medical label for forms
  Label: ({ children, required = false, className = '' }: { children: ReactNode; required?: boolean; className?: string }) => (
    <label className={`block text-sm font-medium text-neutral-700 mb-1 ${className}`}>
      {children}
      {required && <span className="text-emergency-500 ml-1">*</span>}
    </label>
  ),

  // Body text for medical content
  Body: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <p className={`text-sm text-neutral-600 leading-relaxed ${className}`}>
      {children}
    </p>
  ),

  // Caption text for additional info
  Caption: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <span className={`text-xs text-neutral-500 ${className}`}>
      {children}
    </span>
  ),

  // Medical value display (for vital signs, measurements, etc.)
  MedicalValue: ({ children, unit, className = '' }: { children: ReactNode; unit?: string; className?: string }) => (
    <div className={`medical-value ${className}`}>
      <span className="text-2xl font-bold text-neutral-900">{children}</span>
      {unit && <span className="text-sm text-neutral-500 ml-1">{unit}</span>}
    </div>
  ),

  // Error text
  Error: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <p className={`text-sm text-emergency-600 ${className}`}>
      {children}
    </p>
  ),

  // Success text
  Success: ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <p className={`text-sm text-clinical-600 ${className}`}>
      {children}
    </p>
  )
};

// Medical Header Component
export const MedicalHeader: React.FC<{
  title: string;
  subtitle?: string;
  user?: any;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  notifications?: number;
  actions?: ReactNode;
}> = ({ title, subtitle, user, onSearch, searchPlaceholder = "Search...", notifications = 0, actions }) => {
  const { userRole } = useMedicalTheme();

  const roleIcons = {
    patient: User,
    doctor: Stethoscope,
    clinic: Heart,
    admin: Shield
  };

  const RoleIcon = roleIcons[userRole];

  return (
    <header className="medical-header bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Title and branding */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="medical-logo p-2 bg-gradient-primary rounded-lg shadow-sm">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-neutral-900">IgabayCare</h1>
                {subtitle && (
                  <p className="text-sm text-neutral-600">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          {onSearch && (
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="block w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Right section - User and actions */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* Notifications */}
            <button className="relative p-2 text-neutral-400 hover:text-neutral-600 transition-colors">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-emergency-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* User profile */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">{userRole}</p>
                </div>
                <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <RoleIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Medical Sidebar Navigation
export const MedicalSidebar: React.FC<{
  navigationItems: any[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}> = ({ navigationItems, activeTab, onTabChange, collapsed = false, onToggleCollapse }) => {
  return (
    <aside className={`medical-sidebar bg-white border-r border-neutral-200 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <nav className="h-full flex flex-col">
        {/* Navigation items */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                  ${collapsed ? 'justify-center' : 'justify-start'}
                `}
                disabled={item.disabled}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center space-x-3">
            <button className="flex-1 flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors">
              <Settings className="h-4 w-4 mr-3" />
              {!collapsed && 'Settings'}
            </button>
            <button className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

// Medical Page Layout
export const MedicalPageLayout: React.FC<ILayoutComponent> = ({
  children,
  header,
  sidebar,
  footer,
  maxWidth = 'full',
  centered = false,
  className = ''
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={`medical-page-layout min-h-screen bg-neutral-50 ${className}`}>
      {header}
      
      <div className="flex">
        {sidebar}
        
        <main className={`flex-1 ${centered ? 'flex items-center justify-center' : ''}`}>
          <div className={`${maxWidthClasses[maxWidth]} ${centered ? '' : 'mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
            {children}
          </div>
        </main>
      </div>
      
      {footer}
    </div>
  );
};

// Enhanced Medical Dashboard Layout
export const MedicalDashboardLayout: React.FC<IDashboardLayoutComponent> = ({
  children,
  navigationItems,
  activeTab,
  onTabChange,
  user,
  onSignOut,
  onSearch,
  searchPlaceholder,
  variant = 'patient',
  showNavbar = true,
  className = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const variantTitles = {
    patient: 'Patient Portal',
    doctor: 'Doctor Dashboard',
    clinic: 'Clinic Management',
    admin: 'Admin Panel'
  };

  return (
    <div className={`medical-dashboard-layout min-h-screen bg-neutral-50 ${className}`}>
      {showNavbar && (
        <MedicalHeader
          title={variantTitles[variant as keyof typeof variantTitles]}
          user={user}
          onSearch={onSearch}
          searchPlaceholder={searchPlaceholder}
          notifications={3} // This would come from a notification service
          actions={
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Sign Out
            </button>
          }
        />
      )}
      
      <div className="flex">
        <MedicalSidebar
          navigationItems={navigationItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1">
          <div className="medical-dashboard-content p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Medical Form Layout
export const MedicalFormLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  progress?: { current: number; total: number };
  className?: string;
}> = ({ title, subtitle, children, actions, progress, className = '' }) => {
  return (
    <div className={`medical-form-layout max-w-4xl mx-auto ${className}`}>
      {/* Form header */}
      <div className="medical-form-header bg-white rounded-t-lg border border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <MedicalTypography.MainHeading className="mb-0">{title}</MedicalTypography.MainHeading>
            {subtitle && <MedicalTypography.Body>{subtitle}</MedicalTypography.Body>}
          </div>
          {progress && (
            <div className="text-right">
              <MedicalTypography.Caption>
                Step {progress.current} of {progress.total}
              </MedicalTypography.Caption>
              <div className="w-32 bg-neutral-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form content */}
      <div className="medical-form-content bg-white border-x border-neutral-200 px-6 py-6">
        {children}
      </div>

      {/* Form actions */}
      {actions && (
        <div className="medical-form-actions bg-neutral-50 rounded-b-lg border border-neutral-200 px-6 py-4">
          <div className="flex justify-end space-x-3">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
};

// Medical Card Grid Layout
export const MedicalCardGrid: React.FC<{
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, columns = 3, gap = 'md', className = '' }) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`medical-card-grid grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Medical Section Layout
export const MedicalSection: React.FC<{
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, description, actions, children, className = '' }) => {
  return (
    <section className={`medical-section ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <MedicalTypography.SectionHeading className="mb-0">{title}</MedicalTypography.SectionHeading>
          {description && <MedicalTypography.Body>{description}</MedicalTypography.Body>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
};