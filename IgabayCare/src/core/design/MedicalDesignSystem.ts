/**
 * Medical Clinic Design System
 * Professional color palette and design tokens for healthcare applications
 * Following clinical and medical design principles
 */

// Core Medical Color Palette
export const MedicalColors = {
  // Primary Medical Blue - Trust, professionalism, calming
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main medical blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },

  // Medical Teal - Cleanliness, healing, balance
  medical: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Main medical teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e'
  },

  // Clinical Green - Health, vitality, success
  clinical: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main clinical green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },

  // Emergency Red - Urgency, alerts, critical status
  emergency: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main emergency red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },

  // Warning Amber - Caution, pending status
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  // Neutral Medical Grays - Professional, clean
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Main neutral
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  }
} as const;

// Semantic Color Assignments
export const SemanticColors = {
  // Status Colors
  success: MedicalColors.clinical[500],
  error: MedicalColors.emergency[500],
  warning: MedicalColors.warning[500],
  info: MedicalColors.primary[500],

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: MedicalColors.neutral[50],
    tertiary: MedicalColors.neutral[100],
    accent: MedicalColors.primary[50],
    medical: MedicalColors.medical[50]
  },

  // Text Colors
  text: {
    primary: MedicalColors.neutral[900],
    secondary: MedicalColors.neutral[600],
    tertiary: MedicalColors.neutral[400],
    inverse: '#ffffff',
    accent: MedicalColors.primary[600],
    medical: MedicalColors.medical[600]
  },

  // Border Colors
  border: {
    default: MedicalColors.neutral[200],
    subtle: MedicalColors.neutral[100],
    emphasis: MedicalColors.neutral[300],
    accent: MedicalColors.primary[200],
    medical: MedicalColors.medical[200]
  }
} as const;

// Medical Priority Colors
export const MedicalPriorityColors = {
  critical: {
    background: MedicalColors.emergency[50],
    border: MedicalColors.emergency[200],
    text: MedicalColors.emergency[700],
    icon: MedicalColors.emergency[600]
  },
  high: {
    background: MedicalColors.warning[50],
    border: MedicalColors.warning[200],
    text: MedicalColors.warning[700],
    icon: MedicalColors.warning[600]
  },
  medium: {
    background: MedicalColors.primary[50],
    border: MedicalColors.primary[200],
    text: MedicalColors.primary[700],
    icon: MedicalColors.primary[600]
  },
  low: {
    background: MedicalColors.clinical[50],
    border: MedicalColors.clinical[200],
    text: MedicalColors.clinical[700],
    icon: MedicalColors.clinical[600]
  },
  routine: {
    background: MedicalColors.neutral[50],
    border: MedicalColors.neutral[200],
    text: MedicalColors.neutral[700],
    icon: MedicalColors.neutral[600]
  }
} as const;

// Typography Scale
export const Typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    secondary: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace"
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const;

// Spacing Scale
export const Spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem'     // 384px
} as const;

// Border Radius
export const BorderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const;

// Shadows
export const Shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Medical specific shadows
  medical: '0 4px 6px -1px rgb(20 184 166 / 0.1), 0 2px 4px -2px rgb(20 184 166 / 0.1)',
  clinical: '0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1)',
  emergency: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)'
} as const;

// Animation & Transitions
export const Transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  easing: {
    ease: 'ease',
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out'
  }
} as const;

// Breakpoints
export const Breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Medical Component Variants
export const MedicalVariants = {
  appointment: {
    scheduled: {
      background: MedicalColors.primary[50],
      border: MedicalColors.primary[200],
      text: MedicalColors.primary[700]
    },
    confirmed: {
      background: MedicalColors.clinical[50],
      border: MedicalColors.clinical[200],
      text: MedicalColors.clinical[700]
    },
    inProgress: {
      background: MedicalColors.warning[50],
      border: MedicalColors.warning[200],
      text: MedicalColors.warning[700]
    },
    completed: {
      background: MedicalColors.neutral[50],
      border: MedicalColors.neutral[200],
      text: MedicalColors.neutral[700]
    },
    cancelled: {
      background: MedicalColors.emergency[50],
      border: MedicalColors.emergency[200],
      text: MedicalColors.emergency[700]
    }
  },
  
  urgency: {
    emergency: {
      background: MedicalColors.emergency[500],
      text: '#ffffff',
      pulse: true
    },
    urgent: {
      background: MedicalColors.warning[500],
      text: '#ffffff'
    },
    routine: {
      background: MedicalColors.primary[500],
      text: '#ffffff'
    },
    low: {
      background: MedicalColors.clinical[500],
      text: '#ffffff'
    }
  }
} as const;

// Export design tokens as CSS custom properties
export const generateCSSVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Add color variables
  Object.entries(MedicalColors).forEach(([colorName, colorScale]) => {
    Object.entries(colorScale).forEach(([shade, value]) => {
      cssVariables[`--color-${colorName}-${shade}`] = value;
    });
  });
  
  // Add semantic colors
  Object.entries(SemanticColors).forEach(([category, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([name, value]) => {
        cssVariables[`--color-${category}-${name}`] = value;
      });
    } else {
      cssVariables[`--color-${category}`] = colors;
    }
  });
  
  // Add spacing
  Object.entries(Spacing).forEach(([key, value]) => {
    cssVariables[`--spacing-${key}`] = value;
  });
  
  // Add typography
  Object.entries(Typography.fontSize).forEach(([key, value]) => {
    cssVariables[`--font-size-${key}`] = value;
  });
  
  return cssVariables;
};

// Export the design system
export const MedicalDesignSystem = {
  colors: MedicalColors,
  semantic: SemanticColors,
  priority: MedicalPriorityColors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  transitions: Transitions,
  breakpoints: Breakpoints,
  variants: MedicalVariants,
  generateCSSVariables
} as const;