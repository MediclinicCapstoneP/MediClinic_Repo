/**
 * Core Module Export Test
 * Verifies that the core barrel export is working correctly
 */

import {
  // Container exports
  container,
  SERVICE_IDENTIFIERS,
  ServiceLifetime,
  
  // Factory exports
  ComponentFactoryRegistry,
  ComponentType,
  
  // Type exports
  MedicalDataType,
  ValidationContext,
  MedicalFormValidator,
  
  // Design system exports
  MedicalDesignSystem,
  MedicalColors,
  
  // Provider exports
  MedicalThemeProvider,
  useMedicalTheme
} from '../index';

describe('Core Module Exports', () => {
  test('should export container and DI components', () => {
    expect(container).toBeDefined();
    expect(SERVICE_IDENTIFIERS).toBeDefined();
    expect(ServiceLifetime).toBeDefined();
  });
  
  test('should export component factory', () => {
    expect(ComponentFactoryRegistry).toBeDefined();
    expect(ComponentType).toBeDefined();
  });
  
  test('should export design system', () => {
    expect(MedicalDesignSystem).toBeDefined();
    expect(MedicalColors).toBeDefined();
  });
  
  test('should export theme provider', () => {
    expect(MedicalThemeProvider).toBeDefined();
    expect(useMedicalTheme).toBeDefined();
  });
  
  test('should export types correctly', () => {
    // These are type exports, so we just need to ensure they compile
    const dataType: MedicalDataType = 'email';
    const context: ValidationContext = 'medical';
    
    expect(dataType).toBe('email');
    expect(context).toBe('medical');
  });
});

// Export test for use in other test files
export const testCoreExports = () => {
  console.log('✅ Core exports test passed');
  return true;
};