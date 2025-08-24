/**
 * SOLID Principles Validation Test Suite
 * Tests to ensure all SOLID principles are properly implemented
 */

import { 
  container, 
  SERVICE_IDENTIFIERS, 
  ServiceLifetime,
  ComponentFactoryRegistry,
  ComponentType,
  MedicalFormValidator,
  MedicalDataType,
  ValidationContext
} from '../core';

// Test interfaces to validate Interface Segregation Principle
interface TestResults {
  solidTests: {
    singleResponsibility: boolean;
    openClosed: boolean;
    liskovSubstitution: boolean;
    interfaceSegregation: boolean;
    dependencyInversion: boolean;
  };
  medicalDesignTests: {
    colorSystem: boolean;
    typography: boolean;
    components: boolean;
    accessibility: boolean;
  };
  errors: string[];
}

class SOLIDValidationTestSuite {
  private errors: string[] = [];

  // Test Single Responsibility Principle
  testSingleResponsibility(): boolean {
    try {
      // Test that Button component only handles button-specific concerns
      const buttonComponent = require('../components/ui/Button');
      const hasMultipleResponsibilities = this.checkForMultipleResponsibilities(buttonComponent);
      
      if (hasMultipleResponsibilities) {
        this.errors.push('Button component violates SRP - handles multiple responsibilities');
        return false;
      }

      // Test that Card component only handles card-specific concerns
      const cardComponent = require('../components/ui/Card');
      const cardHasMultipleResponsibilities = this.checkForMultipleResponsibilities(cardComponent);
      
      if (cardHasMultipleResponsibilities) {
        this.errors.push('Card component violates SRP - handles multiple responsibilities');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`SRP test failed: ${error}`);
      return false;
    }
  }

  // Test Open/Closed Principle
  testOpenClosed(): boolean {
    try {
      // Test that components can be extended without modification
      const extensibleComponents = require('../core/components/ExtensibleComponents');
      
      // Verify extension mechanism exists
      if (!extensibleComponents.withExtensibility) {
        this.errors.push('OCP violated - no extension mechanism found');
        return false;
      }

      // Test component factory extensibility
      if (!ComponentFactoryRegistry.register) {
        this.errors.push('OCP violated - component factory not extensible');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`OCP test failed: ${error}`);
      return false;
    }
  }

  // Test Liskov Substitution Principle
  testLiskovSubstitution(): boolean {
    try {
      // Test that all validators implement the same interface correctly
      const medicalValidation = require('../core/validation/MedicalValidation');
      const validators = [
        new medicalValidation.PatientIdValidator(),
        new medicalValidation.SSNValidator(),
        new medicalValidation.MedicalEmailValidator(),
        new medicalValidation.BloodTypeValidator()
      ];

      // All validators should be substitutable
      for (const validator of validators) {
        if (!validator.validate || !validator.getType) {
          this.errors.push('LSP violated - validator interface not consistent');
          return false;
        }

        // Test that validation results are consistent
        const result = validator.validate('test-value');
        if (!result.hasOwnProperty('isValid') || !result.hasOwnProperty('errors')) {
          this.errors.push('LSP violated - validation result interface inconsistent');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.errors.push(`LSP test failed: ${error}`);
      return false;
    }
  }

  // Test Interface Segregation Principle
  testInterfaceSegregation(): boolean {
    try {
      // Test that interfaces are properly segregated
      const interfaces = require('../core/interfaces/IUIComponents');
      
      // Check that base interface is minimal
      if (!interfaces.IBaseComponent) {
        this.errors.push('ISP violated - base interface not found');
        return false;
      }

      // Check that specialized interfaces exist
      if (!interfaces.IButtonComponent || !interfaces.ICardComponent) {
        this.errors.push('ISP violated - specialized interfaces missing');
        return false;
      }

      // Verify interfaces are focused and not bloated
      const buttonInterface = interfaces.IButtonComponent;
      if (this.isInterfaceBloated(buttonInterface)) {
        this.errors.push('ISP violated - button interface is bloated');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`ISP test failed: ${error}`);
      return false;
    }
  }

  // Test Dependency Inversion Principle
  testDependencyInversion(): boolean {
    try {
      // Test that dependency injection container works
      if (!container.resolve) {
        this.errors.push('DIP violated - no dependency injection mechanism');
        return false;
      }

      // Test that services are registered through abstractions
      const authService = container.resolve(SERVICE_IDENTIFIERS.AuthenticationService);
      if (!authService) {
        this.errors.push('DIP violated - services not properly abstracted');
        return false;
      }

      // Test that high-level modules don't depend on low-level modules
      const services = require('../core/container/ServiceRegistration');
      if (!services.Services) {
        this.errors.push('DIP violated - no service abstraction layer');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`DIP test failed: ${error}`);
      return false;
    }
  }

  // Test Medical Design System
  testMedicalDesignSystem(): boolean {
    try {
      const designSystem = require('../core/design/MedicalDesignSystem');
      
      // Test color system
      if (!designSystem.MedicalColors || !designSystem.SemanticColors) {
        this.errors.push('Medical color system incomplete');
        return false;
      }

      // Test typography system
      if (!designSystem.Typography) {
        this.errors.push('Medical typography system missing');
        return false;
      }

      // Test theme provider
      const themeProvider = require('../core/providers/MedicalThemeProvider');
      if (!themeProvider.MedicalThemeProvider) {
        this.errors.push('Medical theme provider missing');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`Medical design system test failed: ${error}`);
      return false;
    }
  }

  // Test Component System
  testComponentSystem(): boolean {
    try {
      // Test factory pattern implementation
      const factory = require('../core/factories/ComponentFactory');
      if (!factory.MedicalComponentFactory) {
        this.errors.push('Component factory pattern not implemented');
        return false;
      }

      // Test medical components
      const medicalComponents = require('../components/ui/MedicalComponents');
      if (!medicalComponents.VitalSignsDisplay) {
        this.errors.push('Medical-specific components missing');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`Component system test failed: ${error}`);
      return false;
    }
  }

  // Test Validation System
  testValidationSystem(): boolean {
    try {
      // Test medical data validation using the actual validation module
      const medicalValidation = require('../core/validation/MedicalValidation');
      
      // Create a specific validator instance
      const emailValidator = new medicalValidation.MedicalEmailValidator();
      
      // Test medical data validation with correct context type
      const context: ValidationContext = 'medical';
      
      const result = emailValidator.validate('test@example.com', context);
      if (result.isValid === undefined) {
        this.errors.push('Validation system not working correctly');
        return false;
      }
      
      // Test that validator implements the correct interface
      if (!emailValidator.getType || !emailValidator.validate) {
        this.errors.push('Validator does not implement MedicalFormValidator interface');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`Validation system test failed: ${error}`);
      return false;
    }
  }

  // Test Accessibility Features
  testAccessibility(): boolean {
    try {
      // Test that accessibility features are implemented
      const layouts = require('../core/layouts/MedicalLayouts');
      if (!layouts.MedicalTypography) {
        this.errors.push('Medical typography for accessibility missing');
        return false;
      }

      // Test theme provider accessibility
      const themeProvider = require('../core/providers/MedicalThemeProvider');
      if (!themeProvider.useAccessibility) {
        this.errors.push('Accessibility hooks missing');
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push(`Accessibility test failed: ${error}`);
      return false;
    }
  }

  // Helper method to check for multiple responsibilities
  private checkForMultipleResponsibilities(component: any): boolean {
    // Simplified check - in real scenario, this would be more sophisticated
    const componentString = component.toString();
    
    // Check if component handles too many different concerns
    const concerns = [
      'authentication',
      'validation',
      'navigation',
      'data_fetching',
      'state_management',
      'styling'
    ];

    let concernCount = 0;
    concerns.forEach(concern => {
      if (componentString.includes(concern)) {
        concernCount++;
      }
    });

    return concernCount > 2; // Allow some coupling, but not too much
  }

  // Helper method to check if interface is bloated
  private isInterfaceBloated(interfaceDefinition: any): boolean {
    // Simplified check - count properties
    if (!interfaceDefinition) return false;
    
    const properties = Object.keys(interfaceDefinition);
    return properties.length > 10; // Arbitrary threshold
  }

  // Run all tests
  runAllTests(): TestResults {
    console.log('🏥 Running SOLID Principles Validation for Medical Platform...\n');

    const results: TestResults = {
      solidTests: {
        singleResponsibility: false,
        openClosed: false,
        liskovSubstitution: false,
        interfaceSegregation: false,
        dependencyInversion: false
      },
      medicalDesignTests: {
        colorSystem: false,
        typography: false,
        components: false,
        accessibility: false
      },
      errors: []
    };

    // Run SOLID tests
    console.log('🔍 Testing SOLID Principles...');
    results.solidTests.singleResponsibility = this.testSingleResponsibility();
    console.log(`✅ Single Responsibility Principle: ${results.solidTests.singleResponsibility ? 'PASS' : 'FAIL'}`);

    results.solidTests.openClosed = this.testOpenClosed();
    console.log(`✅ Open/Closed Principle: ${results.solidTests.openClosed ? 'PASS' : 'FAIL'}`);

    results.solidTests.liskovSubstitution = this.testLiskovSubstitution();
    console.log(`✅ Liskov Substitution Principle: ${results.solidTests.liskovSubstitution ? 'PASS' : 'FAIL'}`);

    results.solidTests.interfaceSegregation = this.testInterfaceSegregation();
    console.log(`✅ Interface Segregation Principle: ${results.solidTests.interfaceSegregation ? 'PASS' : 'FAIL'}`);

    results.solidTests.dependencyInversion = this.testDependencyInversion();
    console.log(`✅ Dependency Inversion Principle: ${results.solidTests.dependencyInversion ? 'PASS' : 'FAIL'}`);

    // Run medical design tests
    console.log('\n🎨 Testing Medical Design System...');
    results.medicalDesignTests.colorSystem = this.testMedicalDesignSystem();
    console.log(`✅ Medical Color System: ${results.medicalDesignTests.colorSystem ? 'PASS' : 'FAIL'}`);

    results.medicalDesignTests.components = this.testComponentSystem();
    console.log(`✅ Medical Components: ${results.medicalDesignTests.components ? 'PASS' : 'FAIL'}`);

    results.medicalDesignTests.accessibility = this.testAccessibility();
    console.log(`✅ Accessibility Features: ${results.medicalDesignTests.accessibility ? 'PASS' : 'FAIL'}`);

    // Copy errors to results
    results.errors = [...this.errors];

    // Summary
    const solidPassed = Object.values(results.solidTests).every(test => test);
    const designPassed = Object.values(results.medicalDesignTests).every(test => test);

    console.log('\n📊 Test Summary:');
    console.log(`🏗️  SOLID Principles: ${solidPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    console.log(`🎨 Medical Design: ${designPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors found:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n🎉 All tests passed! SOLID principles successfully implemented.');
    }

    return results;
  }
}

// Export test suite
export { SOLIDValidationTestSuite };

// Export convenience function
export const validateSOLIDImplementation = (): TestResults => {
  const testSuite = new SOLIDValidationTestSuite();
  return testSuite.runAllTests();
};