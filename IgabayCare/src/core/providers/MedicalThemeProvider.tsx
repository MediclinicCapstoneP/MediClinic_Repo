/**
 * Medical Theme Provider
 * Provides medical design system context throughout the application
 * Implements theme switching and medical color schemes
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MedicalDesignSystem } from '../design/MedicalDesignSystem';

// Theme configuration
export type MedicalTheme = 'light' | 'dark' | 'high-contrast';
export type UserRole = 'patient' | 'doctor' | 'clinic' | 'admin';

interface MedicalThemeContextType {
  theme: MedicalTheme;
  userRole: UserRole;
  setTheme: (theme: MedicalTheme) => void;
  setUserRole: (role: UserRole) => void;
  colors: typeof MedicalDesignSystem.colors;
  semantic: typeof MedicalDesignSystem.semantic;
  priority: typeof MedicalDesignSystem.priority;
  variants: typeof MedicalDesignSystem.variants;
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
  };
  updateAccessibility: (settings: Partial<MedicalThemeContextType['accessibility']>) => void;
}

const MedicalThemeContext = createContext<MedicalThemeContextType | undefined>(undefined);

// Role-specific color schemes
const roleThemes = {
  patient: {
    primary: MedicalDesignSystem.colors.primary,
    accent: MedicalDesignSystem.colors.medical,
    background: '#f8fafc'
  },
  doctor: {
    primary: MedicalDesignSystem.colors.medical,
    accent: MedicalDesignSystem.colors.clinical,
    background: '#f0fdfa'
  },
  clinic: {
    primary: MedicalDesignSystem.colors.clinical,
    accent: MedicalDesignSystem.colors.primary,
    background: '#f0fdf4'
  },
  admin: {
    primary: MedicalDesignSystem.colors.neutral,
    accent: MedicalDesignSystem.colors.warning,
    background: '#f8fafc'
  }
} as const;

interface MedicalThemeProviderProps {
  children: ReactNode;
  defaultTheme?: MedicalTheme;
  defaultRole?: UserRole;
}

export const MedicalThemeProvider: React.FC<MedicalThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  defaultRole = 'patient'
}) => {
  const [theme, setTheme] = useState<MedicalTheme>(defaultTheme);
  const [userRole, setUserRole] = useState<UserRole>(defaultRole);
  const [accessibility, setAccessibility] = useState<{
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
  }>({
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal'
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('medical-theme') as MedicalTheme;
    const savedRole = localStorage.getItem('user-role') as UserRole;
    const savedAccessibility = localStorage.getItem('accessibility-settings');

    if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    if (savedRole && ['patient', 'doctor', 'clinic', 'admin'].includes(savedRole)) {
      setUserRole(savedRole);
    }

    if (savedAccessibility) {
      try {
        const parsed = JSON.parse(savedAccessibility);
        setAccessibility(prev => ({ ...prev, ...parsed }));
      } catch {
        // Ignore invalid JSON
      }
    }

    // Check for system preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersDark && !savedTheme) {
      setTheme('dark');
    }

    setAccessibility(prev => ({
      ...prev,
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast || prev.highContrast
    }));
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('medical-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-role', userRole);
  }, [theme, userRole]);

  // Save accessibility settings
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(accessibility));
    
    // Apply accessibility settings to document
    document.documentElement.classList.toggle('reduce-motion', accessibility.reduceMotion);
    document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);
    document.documentElement.setAttribute('data-font-size', accessibility.fontSize);
  }, [accessibility]);

  // Apply CSS variables based on theme and role
  useEffect(() => {
    const root = document.documentElement;
    const roleTheme = roleThemes[userRole];
    const cssVariables = MedicalDesignSystem.generateCSSVariables();

    // Apply all design system variables
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply role-specific overrides
    root.style.setProperty('--role-primary-50', roleTheme.primary[50]);
    root.style.setProperty('--role-primary-500', roleTheme.primary[500]);
    root.style.setProperty('--role-primary-600', roleTheme.primary[600]);
    root.style.setProperty('--role-accent-50', roleTheme.accent[50]);
    root.style.setProperty('--role-accent-500', roleTheme.accent[500]);
    root.style.setProperty('--role-background', roleTheme.background);

    // Apply theme-specific modifications
    if (theme === 'dark') {
      root.style.setProperty('--color-background', '#0f172a');
      root.style.setProperty('--color-foreground', '#f8fafc');
      root.style.setProperty('--color-card-background', '#1e293b');
    } else if (theme === 'high-contrast') {
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-foreground', '#000000');
      root.style.setProperty('--color-border-default', '#000000');
    } else {
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-foreground', '#0f172a');
      root.style.setProperty('--color-card-background', '#ffffff');
    }
  }, [theme, userRole]);

  const updateAccessibility = (settings: Partial<MedicalThemeContextType['accessibility']>) => {
    setAccessibility(prev => ({ ...prev, ...settings }));
  };

  const contextValue: MedicalThemeContextType = {
    theme,
    userRole,
    setTheme,
    setUserRole,
    colors: MedicalDesignSystem.colors,
    semantic: MedicalDesignSystem.semantic,
    priority: MedicalDesignSystem.priority,
    variants: MedicalDesignSystem.variants,
    accessibility,
    updateAccessibility
  };

  return (
    <MedicalThemeContext.Provider value={contextValue}>
      <div 
        className={`medical-theme-${theme} role-${userRole} ${accessibility.reduceMotion ? 'reduce-motion' : ''} ${accessibility.highContrast ? 'high-contrast' : ''}`}
        data-theme={theme}
        data-role={userRole}
        data-font-size={accessibility.fontSize}
      >
        {children}
      </div>
    </MedicalThemeContext.Provider>
  );
};

// Hook to use medical theme context
export const useMedicalTheme = (): MedicalThemeContextType => {
  const context = useContext(MedicalThemeContext);
  if (context === undefined) {
    throw new Error('useMedicalTheme must be used within a MedicalThemeProvider');
  }
  return context;
};

// Hook for role-specific theming
export const useRoleTheme = () => {
  const { userRole, colors } = useMedicalTheme();
  return roleThemes[userRole];
};

// Hook for medical priority colors
export const useMedicalPriority = (priority: keyof typeof MedicalDesignSystem.priority) => {
  const { priority: priorityColors } = useMedicalTheme();
  return priorityColors[priority];
};

// Hook for accessibility features
export const useAccessibility = () => {
  const { accessibility, updateAccessibility } = useMedicalTheme();
  return { accessibility, updateAccessibility };
};

// Medical theme utility functions
export const getMedicalColor = (colorPath: string, shade?: number) => {
  const path = shade ? `${colorPath}.${shade}` : colorPath;
  return `var(--color-${path.replace('.', '-')})`;
};

export const getMedicalSpacing = (size: number) => {
  return `var(--spacing-${size})`;
};

export const getMedicalShadow = (type: keyof typeof MedicalDesignSystem.shadows) => {
  return MedicalDesignSystem.shadows[type];
};