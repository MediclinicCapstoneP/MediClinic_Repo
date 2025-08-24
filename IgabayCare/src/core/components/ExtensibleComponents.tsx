/**
 * Extensible Component System
 * Implements Open/Closed Principle - components are open for extension, closed for modification
 * Base components can be extended without modifying their core implementation
 */

import React, { ReactNode, ComponentType } from 'react';
import { IBaseComponent } from '../interfaces/IUIComponents';
import { useMedicalTheme } from '../providers/MedicalThemeProvider';

// Base component interface for extensibility
export interface IExtensibleComponent extends IBaseComponent {
  variant?: string;
  extensions?: ComponentExtension[];
  plugins?: ComponentPlugin[];
}

// Component extension interface
export interface ComponentExtension {
  name: string;
  priority: number;
  render: (originalProps: any, originalComponent: ReactNode) => ReactNode;
  condition?: (props: any) => boolean;
}

// Component plugin interface
export interface ComponentPlugin {
  name: string;
  initialize: (component: any) => void;
  beforeRender?: (props: any) => any;
  afterRender?: (rendered: ReactNode, props: any) => ReactNode;
}

// Higher-Order Component for extensibility
export function withExtensibility<T extends IBaseComponent>(
  BaseComponent: ComponentType<T>,
  defaultExtensions: ComponentExtension[] = [],
  defaultPlugins: ComponentPlugin[] = []
) {
  return React.forwardRef<any, T & IExtensibleComponent>((props, ref) => {
    const { extensions = [], plugins = [], ...baseProps } = props;
    const allExtensions = [...defaultExtensions, ...extensions].sort((a, b) => b.priority - a.priority);
    const allPlugins = [...defaultPlugins, ...plugins];

    // Apply plugin preprocessing
    let processedProps = baseProps;
    allPlugins.forEach(plugin => {
      if (plugin.beforeRender) {
        processedProps = plugin.beforeRender(processedProps) || processedProps;
      }
    });

    // Render base component
    let rendered = <BaseComponent {...(processedProps as T)} ref={ref} />;

    // Apply extensions
    allExtensions.forEach(extension => {
      if (!extension.condition || extension.condition(processedProps)) {
        rendered = extension.render(processedProps, rendered);
      }
    });

    // Apply plugin postprocessing
    allPlugins.forEach(plugin => {
      if (plugin.afterRender) {
        rendered = plugin.afterRender(rendered, processedProps) || rendered;
      }
    });

    return rendered;
  });
}

// Medical-specific extension factory
export class MedicalExtensionFactory {
  // Create accessibility extension
  static createAccessibilityExtension(options: {
    ariaLabel?: string;
    role?: string;
    tabIndex?: number;
  }): ComponentExtension {
    return {
      name: 'accessibility',
      priority: 100,
      render: (props, component) => {
        return React.cloneElement(component as React.ReactElement, {
          'aria-label': options.ariaLabel,
          'role': options.role,
          'tabIndex': options.tabIndex,
          ...props
        });
      }
    };
  }

  // Create medical priority extension
  static createMedicalPriorityExtension(priority: 'low' | 'medium' | 'high' | 'critical'): ComponentExtension {
    return {
      name: 'medical-priority',
      priority: 90,
      render: (props, component) => {
        const priorityClasses = {
          low: 'border-l-4 border-l-clinical-500',
          medium: 'border-l-4 border-l-primary-500',
          high: 'border-l-4 border-l-warning-500',
          critical: 'border-l-4 border-l-emergency-500 animate-pulse-emergency'
        };

        return (
          <div className={`medical-priority-${priority} ${priorityClasses[priority]}`}>
            {component}
          </div>
        );
      }
    };
  }

  // Create loading state extension
  static createLoadingExtension(): ComponentExtension {
    return {
      name: 'loading-state',
      priority: 80,
      condition: (props) => props.loading === true,
      render: (props, component) => (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {component}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="medical-spinner animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        </div>
      )
    };
  }

  // Create tooltip extension
  static createTooltipExtension(tooltip: string): ComponentExtension {
    return {
      name: 'tooltip',
      priority: 70,
      render: (props, component) => (
        <div className="relative group">
          {component}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
          </div>
        </div>
      )
    };
  }

  // Create error boundary extension
  static createErrorBoundaryExtension(): ComponentExtension {
    return {
      name: 'error-boundary',
      priority: 60,
      render: (props, component) => (
        <ErrorBoundary>
          {component}
        </ErrorBoundary>
      )
    };
  }

  // Create analytics extension
  static createAnalyticsExtension(eventName: string, metadata?: Record<string, any>): ComponentExtension {
    return {
      name: 'analytics',
      priority: 50,
      render: (props, component) => {
        const handleClick = (originalOnClick?: () => void) => () => {
          // Track analytics event
          if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track(eventName, {
              ...metadata,
              timestamp: new Date().toISOString(),
              userRole: props.userRole
            });
          }
          originalOnClick?.();
        };

        return React.cloneElement(component as React.ReactElement, {
          onClick: handleClick(props.onClick)
        });
      }
    };
  }
}

// Medical plugin factory
export class MedicalPluginFactory {
  // Create theme adaptation plugin
  static createThemeAdaptationPlugin(): ComponentPlugin {
    return {
      name: 'theme-adaptation',
      initialize: () => {},
      beforeRender: (props) => {
        // Adapt component props based on current medical theme
        const { userRole } = useMedicalTheme();
        
        if (userRole === 'doctor') {
          return {
            ...props,
            className: `${props.className || ''} doctor-theme`.trim()
          };
        } else if (userRole === 'clinic') {
          return {
            ...props,
            className: `${props.className || ''} clinic-theme`.trim()
          };
        }
        
        return props;
      }
    };
  }

  // Create performance monitoring plugin
  static createPerformanceMonitoringPlugin(): ComponentPlugin {
    return {
      name: 'performance-monitoring',
      initialize: () => {},
      beforeRender: (props) => {
        if (process.env.NODE_ENV === 'development') {
          console.time(`Component-${props.componentName || 'Unknown'}-render`);
        }
        return props;
      },
      afterRender: (rendered, props) => {
        if (process.env.NODE_ENV === 'development') {
          console.timeEnd(`Component-${props.componentName || 'Unknown'}-render`);
        }
        return rendered;
      }
    };
  }

  // Create security plugin
  static createSecurityPlugin(): ComponentPlugin {
    return {
      name: 'security',
      initialize: () => {},
      beforeRender: (props) => {
        // Sanitize props for security
        const sanitizedProps = { ...props };
        
        // Remove potentially dangerous props
        delete sanitizedProps.dangerouslySetInnerHTML;
        
        // Validate data props
        if (sanitizedProps.data && typeof sanitizedProps.data === 'object') {
          Object.keys(sanitizedProps.data).forEach(key => {
            if (typeof sanitizedProps.data[key] === 'string') {
              // Basic XSS prevention
              sanitizedProps.data[key] = sanitizedProps.data[key].replace(/<script[^>]*>.*?<\/script>/gi, '');
            }
          });
        }
        
        return sanitizedProps;
      }
    };
  }
}

// Error Boundary component for error extension
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="medical-error-boundary p-4 border border-emergency-200 bg-emergency-50 rounded-lg">
          <div className="flex items-center text-emergency-700">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Component Error</span>
          </div>
          <p className="text-sm text-emergency-600 mt-1">
            Something went wrong loading this component. Please refresh the page or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component registry for dynamic extension
export class ComponentRegistry {
  private static extensions = new Map<string, ComponentExtension[]>();
  private static plugins = new Map<string, ComponentPlugin[]>();

  static registerExtension(componentType: string, extension: ComponentExtension) {
    const existing = this.extensions.get(componentType) || [];
    this.extensions.set(componentType, [...existing, extension]);
  }

  static registerPlugin(componentType: string, plugin: ComponentPlugin) {
    const existing = this.plugins.get(componentType) || [];
    this.plugins.set(componentType, [...existing, plugin]);
  }

  static getExtensions(componentType: string): ComponentExtension[] {
    return this.extensions.get(componentType) || [];
  }

  static getPlugins(componentType: string): ComponentPlugin[] {
    return this.plugins.get(componentType) || [];
  }

  static createExtensibleComponent<T extends IBaseComponent>(
    componentType: string,
    BaseComponent: ComponentType<T>
  ) {
    const extensions = this.getExtensions(componentType);
    const plugins = this.getPlugins(componentType);
    return withExtensibility(BaseComponent, extensions, plugins);
  }
}

// Utility for creating extendable medical components
export function createMedicalComponent<T extends IBaseComponent>(
  componentType: string,
  BaseComponent: ComponentType<T>,
  defaultExtensions: ComponentExtension[] = [],
  defaultPlugins: ComponentPlugin[] = []
) {
  // Add default medical extensions
  const medicalExtensions = [
    MedicalExtensionFactory.createErrorBoundaryExtension(),
    MedicalExtensionFactory.createLoadingExtension(),
    ...defaultExtensions
  ];

  // Add default medical plugins
  const medicalPlugins = [
    MedicalPluginFactory.createThemeAdaptationPlugin(),
    MedicalPluginFactory.createSecurityPlugin(),
    ...defaultPlugins
  ];

  return withExtensibility(BaseComponent, medicalExtensions, medicalPlugins);
}