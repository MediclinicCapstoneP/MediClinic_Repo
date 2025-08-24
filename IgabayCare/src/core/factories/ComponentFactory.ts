/**
 * Component Factory Patterns
 * Implements Factory Method pattern for creating medical UI components
 * Follows Open/Closed Principle - extensible without modification
 */

import React, { ComponentType, ReactNode } from 'react';
import { 
  IButtonComponent, 
  ICardComponent, 
  IFormComponent, 
  IMedicalCardComponent,
  IAppointmentCardComponent 
} from '../interfaces/IUIComponents';

// Abstract Factory Interface
export interface ComponentFactory {
  createButton(props: IButtonComponent): ReactNode;
  createCard(props: ICardComponent): ReactNode;
  createForm(props: IFormComponent): ReactNode;
  createMedicalCard(props: IMedicalCardComponent): ReactNode;
  createAppointmentCard(props: IAppointmentCardComponent): ReactNode;
}

// Component Configuration Types
export interface ComponentConfig {
  variant?: string;
  theme?: 'light' | 'dark' | 'medical';
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    fontSize?: 'normal' | 'large' | 'extra-large';
  };
  customizations?: Record<string, any>;
}

// Base Component Factory
export abstract class BaseComponentFactory implements ComponentFactory {
  protected config: ComponentConfig;

  constructor(config: ComponentConfig = {}) {
    this.config = config;
  }

  // Template method pattern - subclasses override specific creation methods
  abstract createButton(props: IButtonComponent): ReactNode;
  abstract createCard(props: ICardComponent): ReactNode;
  abstract createForm(props: IFormComponent): ReactNode;
  abstract createMedicalCard(props: IMedicalCardComponent): ReactNode;
  abstract createAppointmentCard(props: IAppointmentCardComponent): ReactNode;

  // Common utility methods
  protected applyAccessibilityProps(props: any): any {
    const { accessibility } = this.config;
    if (!accessibility) return props;

    return {
      ...props,
      className: [
        props.className || '',
        accessibility.highContrast ? 'high-contrast' : '',
        accessibility.reducedMotion ? 'reduce-motion' : '',
        accessibility.fontSize ? `font-size-${accessibility.fontSize}` : ''
      ].filter(Boolean).join(' ')
    };
  }

  protected applyThemeProps(props: any): any {
    const { theme } = this.config;
    if (!theme || theme === 'light') return props;

    return {
      ...props,
      className: `${props.className || ''} theme-${theme}`.trim()
    };
  }
}

// Medical Component Factory
export class MedicalComponentFactory extends BaseComponentFactory {
  createButton(props: IButtonComponent): ReactNode {
    const enhancedProps = this.applyMedicalEnhancements(props);
    return React.createElement('button', enhancedProps, props.children);
  }

  createCard(props: ICardComponent): ReactNode {
    const enhancedProps = this.applyMedicalEnhancements(props);
    return React.createElement('div', enhancedProps, props.children);
  }

  createForm(props: IFormComponent): ReactNode {
    const enhancedProps = this.applyMedicalEnhancements(props);
    return React.createElement('form', enhancedProps, props.children);
  }

  createMedicalCard(props: IMedicalCardComponent): ReactNode {
    const enhancedProps = this.applyMedicalEnhancements({
      ...props,
      className: `${props.className || ''} medical-card`.trim()
    });
    return React.createElement('div', enhancedProps, props.children);
  }

  createAppointmentCard(props: IAppointmentCardComponent): ReactNode {
    const enhancedProps = this.applyMedicalEnhancements({
      ...props,
      className: `${props.className || ''} appointment-card`.trim()
    });
    return React.createElement('div', enhancedProps, props.children);
  }

  private applyMedicalEnhancements(props: any): any {
    let enhancedProps = this.applyAccessibilityProps(props);
    enhancedProps = this.applyThemeProps(enhancedProps);
    
    // Add medical-specific attributes
    enhancedProps = {
      ...enhancedProps,
      'data-medical-component': true,
      'aria-label': props['aria-label'] || `Medical ${enhancedProps.type || 'component'}`,
      role: props.role || 'region'
    };

    return enhancedProps;
  }
}

// Patient-focused Component Factory
export class PatientComponentFactory extends BaseComponentFactory {
  createButton(props: IButtonComponent): ReactNode {
    const enhancedProps = {
      ...this.applyPatientEnhancements(props),
      className: `${props.className || ''} patient-button`.trim()
    };
    return React.createElement('button', enhancedProps, props.children);
  }

  createCard(props: ICardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyPatientEnhancements(props),
      className: `${props.className || ''} patient-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  createForm(props: IFormComponent): ReactNode {
    const enhancedProps = {
      ...this.applyPatientEnhancements(props),
      className: `${props.className || ''} patient-form`.trim()
    };
    return React.createElement('form', enhancedProps, props.children);
  }

  createMedicalCard(props: IMedicalCardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyPatientEnhancements(props),
      className: `${props.className || ''} patient-medical-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  createAppointmentCard(props: IAppointmentCardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyPatientEnhancements(props),
      className: `${props.className || ''} patient-appointment-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  private applyPatientEnhancements(props: any): any {
    let enhancedProps = this.applyAccessibilityProps(props);
    enhancedProps = this.applyThemeProps(enhancedProps);
    
    // Add patient-specific attributes
    enhancedProps = {
      ...enhancedProps,
      'data-patient-component': true,
      'data-user-friendly': true
    };

    return enhancedProps;
  }
}

// Clinical Provider Component Factory
export class ClinicalComponentFactory extends BaseComponentFactory {
  createButton(props: IButtonComponent): ReactNode {
    const enhancedProps = {
      ...this.applyClinicalEnhancements(props),
      className: `${props.className || ''} clinical-button`.trim()
    };
    return React.createElement('button', enhancedProps, props.children);
  }

  createCard(props: ICardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyClinicalEnhancements(props),
      className: `${props.className || ''} clinical-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  createForm(props: IFormComponent): ReactNode {
    const enhancedProps = {
      ...this.applyClinicalEnhancements(props),
      className: `${props.className || ''} clinical-form`.trim()
    };
    return React.createElement('form', enhancedProps, props.children);
  }

  createMedicalCard(props: IMedicalCardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyClinicalEnhancements(props),
      className: `${props.className || ''} clinical-medical-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  createAppointmentCard(props: IAppointmentCardComponent): ReactNode {
    const enhancedProps = {
      ...this.applyClinicalEnhancements(props),
      className: `${props.className || ''} clinical-appointment-card`.trim()
    };
    return React.createElement('div', enhancedProps, props.children);
  }

  private applyClinicalEnhancements(props: any): any {
    let enhancedProps = this.applyAccessibilityProps(props);
    enhancedProps = this.applyThemeProps(enhancedProps);
    
    // Add clinical-specific attributes
    enhancedProps = {
      ...enhancedProps,
      'data-clinical-component': true,
      'data-professional-grade': true,
      'data-hipaa-compliant': true
    };

    return enhancedProps;
  }
}

// Component Type Registry
export enum ComponentType {
  BUTTON = 'button',
  CARD = 'card',
  FORM = 'form',
  MEDICAL_CARD = 'medical-card',
  APPOINTMENT_CARD = 'appointment-card',
  INPUT = 'input',
  MODAL = 'modal',
  TABLE = 'table'
}

// Factory Registry
export class ComponentFactoryRegistry {
  private static factories = new Map<string, BaseComponentFactory>();
  private static defaultFactory: BaseComponentFactory;

  static register(name: string, factory: BaseComponentFactory): void {
    this.factories.set(name, factory);
  }

  static setDefault(factory: BaseComponentFactory): void {
    this.defaultFactory = factory;
  }

  static get(name?: string): BaseComponentFactory {
    if (!name) return this.defaultFactory;
    return this.factories.get(name) || this.defaultFactory;
  }

  static create(componentType: ComponentType, props: any, factoryName?: string): ReactNode {
    const factory = this.get(factoryName);
    
    switch (componentType) {
      case ComponentType.BUTTON:
        return factory.createButton(props);
      case ComponentType.CARD:
        return factory.createCard(props);
      case ComponentType.FORM:
        return factory.createForm(props);
      case ComponentType.MEDICAL_CARD:
        return factory.createMedicalCard(props);
      case ComponentType.APPOINTMENT_CARD:
        return factory.createAppointmentCard(props);
      default:
        throw new Error(`Unsupported component type: ${componentType}`);
    }
  }
}

// Builder Pattern for Complex Components
export class MedicalComponentBuilder {
  private componentType: ComponentType;
  private props: any = {};
  private factoryName?: string;
  private extensions: any[] = [];
  private validations: Array<(props: any) => boolean> = [];

  constructor(componentType: ComponentType) {
    this.componentType = componentType;
  }

  withProps(props: any): this {
    this.props = { ...this.props, ...props };
    return this;
  }

  withFactory(factoryName: string): this {
    this.factoryName = factoryName;
    return this;
  }

  withExtension(extension: any): this {
    this.extensions.push(extension);
    return this;
  }

  withValidation(validation: (props: any) => boolean): this {
    this.validations.push(validation);
    return this;
  }

  withAccessibility(options: ComponentConfig['accessibility']): this {
    return this.withProps({
      'aria-label': options?.fontSize ? `Large text ${this.componentType}` : undefined,
      'data-high-contrast': options?.highContrast,
      'data-reduced-motion': options?.reducedMotion
    });
  }

  withMedicalPriority(priority: 'low' | 'medium' | 'high' | 'critical'): this {
    return this.withProps({
      'data-medical-priority': priority,
      className: `${this.props.className || ''} medical-priority-${priority}`.trim()
    });
  }

  build(): ReactNode {
    // Validate props
    const isValid = this.validations.every(validation => validation(this.props));
    if (!isValid) {
      throw new Error('Component validation failed');
    }

    // Apply extensions
    let finalProps = this.props;
    this.extensions.forEach(extension => {
      if (typeof extension === 'function') {
        finalProps = extension(finalProps);
      } else {
        finalProps = { ...finalProps, ...extension };
      }
    });

    return ComponentFactoryRegistry.create(this.componentType, finalProps, this.factoryName);
  }
}

// Convenience functions
export const createMedicalButton = (props: IButtonComponent) => 
  new MedicalComponentBuilder(ComponentType.BUTTON)
    .withProps(props)
    .withFactory('medical')
    .build();

export const createPatientCard = (props: ICardComponent) =>
  new MedicalComponentBuilder(ComponentType.CARD)
    .withProps(props)
    .withFactory('patient')
    .build();

export const createClinicalForm = (props: IFormComponent) =>
  new MedicalComponentBuilder(ComponentType.FORM)
    .withProps(props)
    .withFactory('clinical')
    .withValidation(props => !!props.onSubmit)
    .build();

// Initialize default factories
const initializeFactories = () => {
  const medicalFactory = new MedicalComponentFactory();
  const patientFactory = new PatientComponentFactory();
  const clinicalFactory = new ClinicalComponentFactory();

  ComponentFactoryRegistry.register('medical', medicalFactory);
  ComponentFactoryRegistry.register('patient', patientFactory);
  ComponentFactoryRegistry.register('clinical', clinicalFactory);
  ComponentFactoryRegistry.setDefault(medicalFactory);
};

// Auto-initialize
initializeFactories();

export { initializeFactories };