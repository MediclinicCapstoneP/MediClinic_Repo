/**
 * Test Script for Consultation History System
 * This script validates the consultation history functionality for different user types
 */

import { createClient } from '@supabase/supabase-js';
import ConsultationHistoryService from '../src/services/consultationHistoryService.js';
import { MedicalHistoryService } from '../src/services/medicalHistoryService.js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test utilities
 */
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function test(description, testFn) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${description}`);
  
  try {
    const result = testFn();
    if (result === true) {
      console.log(`✅ PASSED: ${description}`);
      testResults.passed++;
    } else {
      console.log(`❌ FAILED: ${description} - ${result}`);
      testResults.failed++;
      testResults.errors.push(`${description}: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${description} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${description}: ${error.message}`);
  }
}

async function asyncTest(description, testFn) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${description}`);
  
  try {
    const result = await testFn();
    if (result === true) {
      console.log(`✅ PASSED: ${description}`);
      testResults.passed++;
    } else {
      console.log(`❌ FAILED: ${description} - ${result}`);
      testResults.failed++;
      testResults.errors.push(`${description}: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${description} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${description}: ${error.message}`);
  }
}

/**
 * Test data setup
 */
const testData = {
  patientId: null,
  doctorId: null,
  clinicId: null,
  appointmentId: null,
  medicalRecordId: null
};

/**
 * Test 1: Database Connection and Basic Queries
 */
async function testDatabaseConnection() {
  await asyncTest('Database connection', async () => {
    const { data, error } = await supabase.from('patients').select('id').limit(1);
    if (error) {
      return `Database connection failed: ${error.message}`;
    }
    return true;
  });
}

/**
 * Test 2: Service Import and Instantiation
 */
function testServiceImports() {
  test('ConsultationHistoryService import', () => {
    if (!ConsultationHistoryService) {
      return 'ConsultationHistoryService not imported correctly';
    }
    if (typeof ConsultationHistoryService.getPatientConsultationHistory !== 'function') {
      return 'getPatientConsultationHistory method not found';
    }
    return true;
  });

  test('MedicalHistoryService import', () => {
    if (!MedicalHistoryService) {
      return 'MedicalHistoryService not imported correctly';
    }
    if (typeof MedicalHistoryService.getPatientMedicalHistory !== 'function') {
      return 'getPatientMedicalHistory method not found';
    }
    return true;
  });
}

/**
 * Test 3: Create Test Data
 */
async function createTestData() {
  await asyncTest('Create test clinic', async () => {
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        clinic_name: 'Test Clinic for History',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        phone: '555-0123',
        email: 'test@testclinic.com'
      })
      .select()
      .single();

    if (error) {
      return `Failed to create test clinic: ${error.message}`;
    }
    
    testData.clinicId = data.id;
    console.log(`  Created clinic: ${data.id}`);
    return true;
  });

  await asyncTest('Create test patient', async () => {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name: 'Test',
        last_name: 'Patient',
        email: 'testpatient@example.com',
        phone: '555-0124',
        date_of_birth: '1990-01-01',
        gender: 'other'
      })
      .select()
      .single();

    if (error) {
      return `Failed to create test patient: ${error.message}`;
    }
    
    testData.patientId = data.id;
    console.log(`  Created patient: ${data.id}`);
    return true;
  });

  await asyncTest('Create test doctor', async () => {
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        first_name: 'Test',
        last_name: 'Doctor',
        email: 'testdoctor@example.com',
        specialty: 'General Practice',
        clinic_id: testData.clinicId
      })
      .select()
      .single();

    if (error) {
      return `Failed to create test doctor: ${error.message}`;
    }
    
    testData.doctorId = data.id;
    console.log(`  Created doctor: ${data.id}`);
    return true;
  });

  await asyncTest('Create test appointment', async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: testData.patientId,
        doctor_id: testData.doctorId,
        clinic_id: testData.clinicId,
        appointment_date: '2024-01-15',
        appointment_time: '10:00:00',
        appointment_type: 'consultation',
        status: 'completed',
        duration_minutes: 30,
        patient_notes: 'Test patient complaint',
        doctor_notes: 'Test doctor notes',
        payment_amount: 150.00
      })
      .select()
      .single();

    if (error) {
      return `Failed to create test appointment: ${error.message}`;
    }
    
    testData.appointmentId = data.id;
    console.log(`  Created appointment: ${data.id}`);
    return true;
  });

  await asyncTest('Create test medical record', async () => {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: testData.patientId,
        doctor_id: testData.doctorId,
        clinic_id: testData.clinicId,
        appointment_id: testData.appointmentId,
        visit_date: '2024-01-15',
        chief_complaint: 'Test complaint',
        diagnosis: 'Test diagnosis',
        treatment_plan: 'Test treatment',
        notes: 'Test medical notes',
        vital_signs: {
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          heart_rate: 72,
          temperature: 98.6,
          weight: 150,
          height: 68
        }
      })
      .select()
      .single();

    if (error) {
      return `Failed to create test medical record: ${error.message}`;
    }
    
    testData.medicalRecordId = data.id;
    console.log(`  Created medical record: ${data.id}`);
    return true;
  });
}

/**
 * Test 4: Patient Consultation History Retrieval
 */
async function testPatientConsultationHistory() {
  await asyncTest('Get patient consultation history', async () => {
    const result = await ConsultationHistoryService.getPatientConsultationHistory(testData.patientId);
    
    if (!result.success) {
      return `Failed to get consultation history: ${result.error}`;
    }
    
    if (!result.data || result.data.length === 0) {
      return 'No consultation data returned';
    }
    
    const consultation = result.data[0];
    
    // Validate consultation structure
    if (!consultation.id || !consultation.patient_id || !consultation.consultation_date) {
      return 'Consultation data structure is invalid';
    }
    
    // Validate patient data is included
    if (!consultation.patient || !consultation.patient.first_name) {
      return 'Patient data not properly included';
    }
    
    // Validate doctor data is included
    if (!consultation.doctor || !consultation.doctor.first_name) {
      return 'Doctor data not properly included';
    }
    
    // Validate clinic data is included
    if (!consultation.clinic || !consultation.clinic.clinic_name) {
      return 'Clinic data not properly included';
    }
    
    console.log(`  Retrieved ${result.data.length} consultations`);
    return true;
  });
}

/**
 * Test 5: Doctor Consultation History Retrieval
 */
async function testDoctorConsultationHistory() {
  await asyncTest('Get doctor consultation history', async () => {
    const result = await ConsultationHistoryService.getDoctorConsultationHistory(testData.doctorId);
    
    if (!result.success) {
      return `Failed to get doctor consultation history: ${result.error}`;
    }
    
    if (!result.data || result.data.length === 0) {
      return 'No consultation data returned for doctor';
    }
    
    const consultation = result.data[0];
    
    // Validate the consultation belongs to the correct doctor
    if (consultation.doctor_id !== testData.doctorId) {
      return 'Consultation does not belong to the correct doctor';
    }
    
    console.log(`  Retrieved ${result.data.length} consultations for doctor`);
    return true;
  });
}

/**
 * Test 6: Consultation Statistics
 */
async function testConsultationStats() {
  await asyncTest('Get patient consultation statistics', async () => {
    const result = await ConsultationHistoryService.getPatientConsultationStats(testData.patientId);
    
    if (!result.success) {
      return `Failed to get consultation stats: ${result.error}`;
    }
    
    if (!result.stats) {
      return 'No statistics returned';
    }
    
    const stats = result.stats;
    
    // Validate stats structure
    if (typeof stats.total_consultations !== 'number') {
      return 'total_consultations is not a number';
    }
    
    if (typeof stats.completed_consultations !== 'number') {
      return 'completed_consultations is not a number';
    }
    
    if (typeof stats.total_consultation_fees !== 'number') {
      return 'total_consultation_fees is not a number';
    }
    
    // Validate stats make sense
    if (stats.total_consultations < 1) {
      return 'total_consultations should be at least 1';
    }
    
    console.log(`  Stats: ${stats.total_consultations} total, ${stats.completed_consultations} completed`);
    return true;
  });
}

/**
 * Test 7: Filtering and Search
 */
async function testFilteringAndSearch() {
  await asyncTest('Test consultation filtering by date', async () => {
    const filters = {
      date_from: '2024-01-01',
      date_to: '2024-12-31'
    };
    
    const result = await ConsultationHistoryService.getPatientConsultationHistory(testData.patientId, filters);
    
    if (!result.success) {
      return `Filtering failed: ${result.error}`;
    }
    
    if (result.data.length === 0) {
      return 'Filtering returned no results when it should have';
    }
    
    return true;
  });

  await asyncTest('Test consultation search', async () => {
    const consultations = [{
      id: '1',
      chief_complaint: 'Test complaint',
      diagnosis: 'Test diagnosis',
      doctor: { first_name: 'Test', last_name: 'Doctor' },
      clinic: { clinic_name: 'Test Clinic' }
    }];
    
    const results = ConsultationHistoryService.searchConsultationHistory(consultations, 'test');
    
    if (results.length !== 1) {
      return `Search should return 1 result, got ${results.length}`;
    }
    
    return true;
  });
}

/**
 * Test 8: Medical History Integration
 */
async function testMedicalHistoryIntegration() {
  await asyncTest('Get comprehensive medical history', async () => {
    const result = await MedicalHistoryService.getPatientMedicalHistory(testData.patientId);
    
    if (!result.success) {
      return `Failed to get medical history: ${result.error}`;
    }
    
    if (!result.data) {
      return 'No medical history data returned';
    }
    
    const history = result.data;
    
    // Validate structure
    if (!history.appointments || !Array.isArray(history.appointments)) {
      return 'Appointments not properly included in medical history';
    }
    
    if (!history.medical_records || !Array.isArray(history.medical_records)) {
      return 'Medical records not properly included in medical history';
    }
    
    if (!history.summary) {
      return 'History summary not included';
    }
    
    console.log(`  Medical history includes ${history.appointments.length} appointments, ${history.medical_records.length} records`);
    return true;
  });
}

/**
 * Test 9: Timeline Generation
 */
async function testTimelineGeneration() {
  await asyncTest('Generate consultation timeline', async () => {
    const consultations = [{
      id: '1',
      consultation_date: '2024-01-15',
      consultation_type: 'consultation',
      chief_complaint: 'Test complaint',
      diagnosis: 'Test diagnosis',
      consultation_status: 'completed',
      follow_up_required: false,
      doctor: { first_name: 'Test', last_name: 'Doctor' },
      clinic: { clinic_name: 'Test Clinic' }
    }];
    
    const timeline = ConsultationHistoryService.generateConsultationTimeline(consultations);
    
    if (!Array.isArray(timeline)) {
      return 'Timeline should be an array';
    }
    
    if (timeline.length !== 1) {
      return `Timeline should have 1 item, got ${timeline.length}`;
    }
    
    const item = timeline[0];
    
    if (!item.id || !item.type || !item.date || !item.title) {
      return 'Timeline item is missing required fields';
    }
    
    if (item.type !== 'appointments') {
      return 'Timeline item type should be "appointments"';
    }
    
    return true;
  });
}

/**
 * Test 10: Error Handling
 */
async function testErrorHandling() {
  await asyncTest('Handle invalid patient ID', async () => {
    const result = await ConsultationHistoryService.getPatientConsultationHistory('invalid-uuid');
    
    if (!result.success) {
      // This is expected - invalid UUID should fail
      return true;
    }
    
    // If it succeeded but returned no data, that's also acceptable
    if (result.data && result.data.length === 0) {
      return true;
    }
    
    return 'Should handle invalid patient ID gracefully';
  });

  await asyncTest('Handle invalid doctor ID', async () => {
    const result = await ConsultationHistoryService.getDoctorConsultationHistory('invalid-uuid');
    
    if (!result.success) {
      // This is expected - invalid UUID should fail
      return true;
    }
    
    // If it succeeded but returned no data, that's also acceptable
    if (result.data && result.data.length === 0) {
      return true;
    }
    
    return 'Should handle invalid doctor ID gracefully';
  });
}

/**
 * Cleanup Test Data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete in reverse order of creation to handle foreign key constraints
  if (testData.medicalRecordId) {
    await supabase.from('medical_records').delete().eq('id', testData.medicalRecordId);
    console.log('  Deleted medical record');
  }
  
  if (testData.appointmentId) {
    await supabase.from('appointments').delete().eq('id', testData.appointmentId);
    console.log('  Deleted appointment');
  }
  
  if (testData.doctorId) {
    await supabase.from('doctors').delete().eq('id', testData.doctorId);
    console.log('  Deleted doctor');
  }
  
  if (testData.patientId) {
    await supabase.from('patients').delete().eq('id', testData.patientId);
    console.log('  Deleted patient');
  }
  
  if (testData.clinicId) {
    await supabase.from('clinics').delete().eq('id', testData.clinicId);
    console.log('  Deleted clinic');
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🚀 Starting Consultation History System Tests\n');
  console.log('='.repeat(50));
  
  try {
    // Run all tests
    await testDatabaseConnection();
    testServiceImports();
    await createTestData();
    await testPatientConsultationHistory();
    await testDoctorConsultationHistory();
    await testConsultationStats();
    await testFilteringAndSearch();
    await testMedicalHistoryIntegration();
    await testTimelineGeneration();
    await testErrorHandling();
    
  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
    testResults.failed++;
    testResults.errors.push(`Unexpected error: ${error.message}`);
  } finally {
    // Always cleanup
    await cleanupTestData();
  }
  
  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All tests passed! The consultation history system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix the issues above.');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Export for use in other files
export { runTests, testResults };

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}