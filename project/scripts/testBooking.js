const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingFlow() {
  console.log('🧪 Testing booking flow components...\n');

  try {
    // Test 1: Check if we can query available time slots
    console.log('1️⃣ Testing time slot generation...');
    
    // Get a clinic to test with
    const { data: clinics, error: clinicError } = await supabase
      .from('clinics')
      .select('id, clinic_name, operating_hours')
      .eq('status', 'approved')
      .limit(1);
    
    if (clinicError || !clinics || clinics.length === 0) {
      console.error('❌ No clinics available for testing:', clinicError);
      return;
    }
    
    const testClinic = clinics[0];
    console.log(`✅ Using clinic: ${testClinic.clinic_name}`);
    console.log(`   Operating hours:`, testClinic.operating_hours);
    
    // Test 2: Check appointments table structure
    console.log('\n2️⃣ Testing appointments table structure...');
    const { data: appointmentSchema, error: schemaError } = await supabase
      .from('appointments')
      .select('*')
      .limit(0);
    
    if (schemaError) {
      console.error('❌ Appointments table error:', schemaError);
    } else {
      console.log('✅ Appointments table accessible');
    }
    
    // Test 3: Check patients table
    console.log('\n3️⃣ Testing patients table...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Patients table error:', patientsError);
    } else {
      console.log(`✅ Found ${patients?.length || 0} patients in database`);
      if (patients && patients.length > 0) {
        console.log(`   Sample patient: ${patients[0].first_name} ${patients[0].last_name}`);
      }
    }
    
    // Test 4: Check doctors table
    console.log('\n4️⃣ Testing doctors table...');
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, full_name, clinic_id, status')
      .eq('clinic_id', testClinic.id);
    
    if (doctorsError) {
      console.error('❌ Doctors table error:', doctorsError);
    } else {
      console.log(`✅ Found ${doctors?.length || 0} doctors for test clinic`);
      doctors?.forEach((doctor, i) => {
        console.log(`   ${i+1}. ${doctor.full_name} (${doctor.status})`);
      });
    }
    
    // Test 5: Try creating a test appointment (will simulate the booking)
    console.log('\n5️⃣ Testing appointment creation...');
    
    if (patients && patients.length > 0) {
      const testAppointmentData = {
        patient_id: patients[0].id,
        clinic_id: testClinic.id,
        appointment_date: '2025-01-15',
        appointment_time: '10:00',
        appointment_type: 'consultation',
        duration_minutes: 30,
        status: 'scheduled',
        payment_status: 'pending',
        consultation_fee: 500,
        booking_fee: 50,
        total_amount: 550,
        symptoms: 'Test booking flow',
        patient_notes: 'This is a test appointment'
      };
      
      const { data: testAppt, error: apptError } = await supabase
        .from('appointments')
        .insert([testAppointmentData])
        .select()
        .single();
      
      if (apptError) {
        console.error('❌ Error creating test appointment:', apptError);
      } else {
        console.log('✅ Test appointment created successfully!');
        console.log(`   Appointment ID: ${testAppt.id}`);
        
        // Clean up - delete the test appointment
        await supabase
          .from('appointments')
          .delete()
          .eq('id', testAppt.id);
        console.log('   Test appointment cleaned up');
      }
    } else {
      console.log('⚠️ Skipping appointment creation - no patients available');
    }
    
    // Test 6: Check payments table
    console.log('\n6️⃣ Testing payments table...');
    const { data: paymentSchema, error: paymentError } = await supabase
      .from('transactions')  // Check if it's called 'transactions' instead of 'payments'
      .select('*')
      .limit(0);
    
    if (paymentError) {
      console.error('❌ Transactions table error:', paymentError);
      
      // Try 'payments' table
      const { data: paymentsSchema, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .limit(0);
      
      if (paymentsError) {
        console.error('❌ Payments table also not found:', paymentsError);
      } else {
        console.log('✅ Found payments table instead');
      }
    } else {
      console.log('✅ Transactions table accessible (used for payments)');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testBookingFlow().then(() => {
  console.log('\n✨ Booking flow test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
