// MANUAL APPOINTMENT FIX - RUN THIS IN BROWSER CONSOLE
// This script helps debug and fix appointment visibility issues

import { supabase } from '../supabaseClient';

export const manualAppointmentDebug = async () => {
  console.group('🔧 Manual Appointment Debug & Fix');
  
  try {
    // Step 1: Check all appointments
    console.log('1️⃣ Checking all appointments...');
    const { data: allAppointments, error: allError } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('All appointments:', allAppointments);
    console.log('Error:', allError);
    
    if (!allAppointments || allAppointments.length === 0) {
      console.error('❌ No appointments found in database!');
      console.log('This suggests either:');
      console.log('- Database connection issue');
      console.log('- RLS (Row Level Security) blocking access');
      console.log('- Appointments table is empty');
      return;
    }
    
    // Step 2: Check specific Andrew appointment
    console.log('2️⃣ Looking for Andrew appointments...');
    const andrewAppointments = allAppointments.filter(apt => 
      apt.doctor_name === 'Andrew' || 
      apt.doctor_id === '415503c8-0340-4517-8ae1-7e62d75d5128'
    );
    
    console.log('Andrew appointments found:', andrewAppointments);
    
    // Step 3: Check doctors table
    console.log('3️⃣ Checking doctors table...');
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*');
    
    console.log('Doctors:', doctors);
    console.log('Doctors error:', doctorsError);
    
    // Step 4: Try to fix appointments if needed
    if (andrewAppointments.length === 0) {
      console.log('4️⃣ No Andrew appointments found, checking for appointments with doctor_name "Andrew"...');
      
      const appointmentsWithAndrewName = allAppointments.filter(apt => 
        apt.doctor_name === 'Andrew' && !apt.doctor_id
      );
      
      if (appointmentsWithAndrewName.length > 0) {
        console.log('Found appointments with Andrew name but no doctor_id:', appointmentsWithAndrewName);
        
        // Try to fix them
        for (const apt of appointmentsWithAndrewName) {
          console.log(`Fixing appointment ${apt.id}...`);
          const { data: updatedApt, error: updateError } = await supabase
            .from('appointments')
            .update({ 
              doctor_id: '415503c8-0340-4517-8ae1-7e62d75d5128',
              updated_at: new Date().toISOString()
            })
            .eq('id', apt.id)
            .select();
          
          if (updateError) {
            console.error(`❌ Failed to update appointment ${apt.id}:`, updateError);
          } else {
            console.log(`✅ Updated appointment ${apt.id}:`, updatedApt);
          }
        }
      }
    }
    
    // Step 5: Final verification
    console.log('5️⃣ Final verification - checking appointments for Andrew doctor ID...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', '415503c8-0340-4517-8ae1-7e62d75d5128');
    
    console.log('Final appointments for Andrew:', finalCheck);
    console.log('Final error:', finalError);
    
    // Step 6: Check RLS policies
    console.log('6️⃣ Checking current user session...');
    const { data: session } = await supabase.auth.getSession();
    console.log('Current user session:', session?.session?.user);
    
  } catch (error) {
    console.error('❌ Manual debug failed:', error);
  }
  
  console.groupEnd();
};

// Helper function to manually create a test appointment
export const createTestAppointment = async () => {
  console.log('🧪 Creating test appointment for Andrew...');
  
  const testAppointment = {
    patient_id: 'b0b095b4-7f95-40c8-b118-e7aa67751553', // Use existing patient ID from your data
    clinic_id: '19631e43-5e2c-466d-84bc-9199123260d2', // Use Andrew's clinic ID
    doctor_id: '415503c8-0340-4517-8ae1-7e62d75d5128', // Andrew's doctor ID
    doctor_name: 'Andrew',
    appointment_date: '2025-09-15', // Tomorrow
    appointment_time: '10:00:00',
    appointment_type: 'consultation',
    status: 'scheduled',
    duration_minutes: 30,
    patient_notes: 'Test appointment created via debug script',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('appointments')
    .insert([testAppointment])
    .select();
  
  if (error) {
    console.error('❌ Failed to create test appointment:', error);
  } else {
    console.log('✅ Test appointment created:', data);
  }
  
  return { data, error };
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  window.debugAppointments = manualAppointmentDebug;
  window.createTestAppointment = createTestAppointment;
  
  console.log('🔧 Debug functions loaded!');
  console.log('Run: debugAppointments() - to debug appointment issues');
  console.log('Run: createTestAppointment() - to create a test appointment');
}