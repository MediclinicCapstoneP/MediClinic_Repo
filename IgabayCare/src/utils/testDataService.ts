/**
 * Test Data Service
 * Provides test user creation and management for development/testing
 */

import { roleBasedAuthService } from '../features/auth/utils/roleBasedAuthService';

// Test user credentials
export const TEST_USERS = {
  patient: {
    email: 'patient@test.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe'
  },
  clinic: {
    email: 'clinic@test.com',
    password: 'TestPassword123!',
    clinic_name: 'Test Medical Clinic',
    location: 'Test City',
    phone: '+1-555-0123',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    description: 'A test clinic for development purposes'
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'TestPassword123!',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    licenseNumber: 'MD123456',
    specialization: 'General Medicine',
    phone: '+1-555-0124',
    experience_years: 5
  }
};

export const testDataService = {
  /**
   * Create all test users
   */
  async createAllTestUsers() {
    const results = {
      patient: null as any,
      clinic: null as any,
      doctor: null as any
    };

    console.log('Creating test users...');

    try {
      // Create test patient
      console.log('Creating test patient...');
      results.patient = await roleBasedAuthService.patient.signUp({
        email: TEST_USERS.patient.email,
        password: TEST_USERS.patient.password,
        firstName: TEST_USERS.patient.firstName,
        lastName: TEST_USERS.patient.lastName
      });

      if (results.patient.success) {
        console.log('✅ Test patient created successfully');
      } else {
        console.error('❌ Failed to create test patient:', results.patient.error);
      }

      // Create test clinic
      console.log('Creating test clinic...');
      results.clinic = await roleBasedAuthService.clinic.signUp({
        email: TEST_USERS.clinic.email,
        password: TEST_USERS.clinic.password,
        clinic_name: TEST_USERS.clinic.clinic_name,
        location: TEST_USERS.clinic.location,
        phone: TEST_USERS.clinic.phone,
        address: TEST_USERS.clinic.address,
        city: TEST_USERS.clinic.city,
        state: TEST_USERS.clinic.state,
        zip_code: TEST_USERS.clinic.zip_code,
        description: TEST_USERS.clinic.description
      });

      if (results.clinic.success) {
        console.log('✅ Test clinic created successfully');
      } else {
        console.error('❌ Failed to create test clinic:', results.clinic.error);
      }

      // Create test doctor
      console.log('Creating test doctor...');
      results.doctor = await roleBasedAuthService.doctor.signUp({
        email: TEST_USERS.doctor.email,
        password: TEST_USERS.doctor.password,
        firstName: TEST_USERS.doctor.firstName,
        lastName: TEST_USERS.doctor.lastName,
        licenseNumber: TEST_USERS.doctor.licenseNumber,
        specialization: TEST_USERS.doctor.specialization,
        phone: TEST_USERS.doctor.phone,
        experience_years: TEST_USERS.doctor.experience_years
      });

      if (results.doctor.success) {
        console.log('✅ Test doctor created successfully');
      } else {
        console.error('❌ Failed to create test doctor:', results.doctor.error);
      }

    } catch (error) {
      console.error('Exception during test user creation:', error);
    }

    return results;
  },

  /**
   * Test sign-in for all user types
   */
  async testAllSignIns() {
    const results = {
      patient: null as any,
      clinic: null as any,
      doctor: null as any
    };

    console.log('Testing sign-ins...');

    try {
      // Test patient sign-in
      console.log('Testing patient sign-in...');
      results.patient = await roleBasedAuthService.patient.signIn({
        email: TEST_USERS.patient.email,
        password: TEST_USERS.patient.password
      });

      if (results.patient.success) {
        console.log('✅ Patient sign-in successful');
      } else {
        console.error('❌ Patient sign-in failed:', results.patient.error);
      }

      // Test clinic sign-in
      console.log('Testing clinic sign-in...');
      results.clinic = await roleBasedAuthService.clinic.signIn({
        email: TEST_USERS.clinic.email,
        password: TEST_USERS.clinic.password
      });

      if (results.clinic.success) {
        console.log('✅ Clinic sign-in successful');
      } else {
        console.error('❌ Clinic sign-in failed:', results.clinic.error);
      }

      // Test doctor sign-in
      console.log('Testing doctor sign-in...');
      results.doctor = await roleBasedAuthService.doctor.signIn({
        email: TEST_USERS.doctor.email,
        password: TEST_USERS.doctor.password
      });

      if (results.doctor.success) {
        console.log('✅ Doctor sign-in successful');
      } else {
        console.error('❌ Doctor sign-in failed:', results.doctor.error);
      }

    } catch (error) {
      console.error('Exception during sign-in testing:', error);
    }

    return results;
  },

  /**
   * Create a specific test user type
   */
  async createTestUser(userType: 'patient' | 'clinic' | 'doctor') {
    console.log(`Creating test ${userType}...`);

    try {
      let result;

      switch (userType) {
        case 'patient':
          result = await roleBasedAuthService.patient.signUp({
            email: TEST_USERS.patient.email,
            password: TEST_USERS.patient.password,
            firstName: TEST_USERS.patient.firstName,
            lastName: TEST_USERS.patient.lastName
          });
          break;

        case 'clinic':
          result = await roleBasedAuthService.clinic.signUp({
            email: TEST_USERS.clinic.email,
            password: TEST_USERS.clinic.password,
            clinic_name: TEST_USERS.clinic.clinic_name,
            location: TEST_USERS.clinic.location,
            phone: TEST_USERS.clinic.phone,
            address: TEST_USERS.clinic.address,
            city: TEST_USERS.clinic.city,
            state: TEST_USERS.clinic.state,
            zip_code: TEST_USERS.clinic.zip_code,
            description: TEST_USERS.clinic.description
          });
          break;

        case 'doctor':
          result = await roleBasedAuthService.doctor.signUp({
            email: TEST_USERS.doctor.email,
            password: TEST_USERS.doctor.password,
            firstName: TEST_USERS.doctor.firstName,
            lastName: TEST_USERS.doctor.lastName,
            licenseNumber: TEST_USERS.doctor.licenseNumber,
            specialization: TEST_USERS.doctor.specialization,
            phone: TEST_USERS.doctor.phone,
            experience_years: TEST_USERS.doctor.experience_years
          });
          break;

        default:
          throw new Error(`Unknown user type: ${userType}`);
      }

      if (result.success) {
        console.log(`✅ Test ${userType} created successfully`);
      } else {
        console.error(`❌ Failed to create test ${userType}:`, result.error);
      }

      return result;

    } catch (error) {
      console.error(`Exception during test ${userType} creation:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Test sign-in for a specific user type
   */
  async testSignIn(userType: 'patient' | 'clinic' | 'doctor') {
    console.log(`Testing ${userType} sign-in...`);

    try {
      let result;
      const credentials = {
        email: TEST_USERS[userType].email,
        password: TEST_USERS[userType].password
      };

      switch (userType) {
        case 'patient':
          result = await roleBasedAuthService.patient.signIn(credentials);
          break;
        case 'clinic':
          result = await roleBasedAuthService.clinic.signIn(credentials);
          break;
        case 'doctor':
          result = await roleBasedAuthService.doctor.signIn(credentials);
          break;
        default:
          throw new Error(`Unknown user type: ${userType}`);
      }

      if (result.success) {
        console.log(`✅ ${userType} sign-in successful`);
      } else {
        console.error(`❌ ${userType} sign-in failed:`, result.error);
      }

      return result;

    } catch (error) {
      console.error(`Exception during ${userType} sign-in:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Display test credentials for manual testing
   */
  displayTestCredentials() {
    console.log('=== TEST CREDENTIALS ===');
    console.log('Patient:');
    console.log(`  Email: ${TEST_USERS.patient.email}`);
    console.log(`  Password: ${TEST_USERS.patient.password}`);
    console.log('');
    console.log('Clinic:');
    console.log(`  Email: ${TEST_USERS.clinic.email}`);
    console.log(`  Password: ${TEST_USERS.clinic.password}`);
    console.log('');
    console.log('Doctor:');
    console.log(`  Email: ${TEST_USERS.doctor.email}`);
    console.log(`  Password: ${TEST_USERS.doctor.password}`);
    console.log('========================');
  }
};

// Make testDataService available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testDataService = testDataService;
}