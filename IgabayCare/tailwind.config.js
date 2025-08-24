/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Medical Design System Colors
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
        // Medical teal for healing/cleanliness
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
        // Clinical green for health/vitality
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
        // Emergency red for urgent/critical
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
        // Warning amber
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
        // Keep existing theme color for backward compatibility
        theme: '#91C8E4',
        'theme-light': '#a8d2ea',
        'theme-dark': '#7bb8d4',
        'theme-darker': '#65a8c4',
        'theme-darkest': '#4f98b4',
        // Semantic colors
        background: '#ffffff',
        foreground: '#0f172a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        'card-foreground': '#0f172a',
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        'muted-foreground': '#64748b',
        // Status colors
        success: '#22c55e',
        error: '#ef4444',
        info: '#0ea5e9',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'gradient-medical': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-clinical': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-emergency': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 50%, #22c55e 100%)',
        'gradient-card': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'gradient-theme': 'linear-gradient(135deg, #91C8E4 0%, #7bb8d4 50%, #65a8c4 100%)',
        // Medical priority gradients
        'gradient-critical': 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        'gradient-urgent': 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        'gradient-routine': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'gradient-wellness': 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
      },
      animation: {
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        // Medical-specific animations
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'pulse-emergency': 'pulseEmergency 1s ease-in-out infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
        'vitals': 'vitals 2s ease-in-out infinite',
        'medical-scan': 'medicalScan 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(145, 200, 228, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(145, 200, 228, 0.8)' },
        },
        // Medical-specific keyframes
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.05)' },
        },
        pulseEmergency: {
          '0%, 100%': { opacity: '1', backgroundColor: 'rgb(239 68 68)' },
          '50%': { opacity: '0.7', backgroundColor: 'rgb(220 38 38)' },
        },
        breathing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.95' },
        },
        vitals: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(2px)' },
          '50%': { transform: 'translateX(0)' },
          '75%': { transform: 'translateX(-2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        medicalScan: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hover': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(145, 200, 228, 0.3)',
        'medical': '0 0 20px rgba(20, 184, 166, 0.3)',
        'clinical': '0 0 20px rgba(34, 197, 94, 0.3)',
        'emergency': '0 0 20px rgba(239, 68, 68, 0.3)',
        'primary-glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'warning-glow': '0 0 20px rgba(245, 158, 11, 0.3)',
        // Medical card shadows
        'medical-card': '0 4px 6px -1px rgba(20, 184, 166, 0.1), 0 2px 4px -2px rgba(20, 184, 166, 0.1)',
        'clinical-card': '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -2px rgba(34, 197, 94, 0.1)',
        'emergency-card': '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -2px rgba(239, 68, 68, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
