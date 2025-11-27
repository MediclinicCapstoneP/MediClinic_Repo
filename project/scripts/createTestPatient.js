const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // For now using anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPatient() {
  console.log('👤 Creating test patient...\n');
  
  try {
    // Try creating a patient with RPC call or admin insert
    // First check if any patients exist
    const { data: existingPatients, error: checkError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(5);
    
    console.log('📋 Current patients in database:');
    if (existingPatients && existingPatients.length > 0) {
      existingPatients.forEach((patient, i) => {
        console.log(`   ${i+1}. ${patient.first_name} ${patient.last_name} (${patient.id})`);
      });
      console.log('\n✅ Patients already exist for testing!');
      return;
    } else {
      console.log('   No patients found.');
    }
    
    // Try to insert with minimal data
    console.log('\n🔧 Attempting to create test patient...');
    
    const testPatient = {
      first_name: 'Test',
      last_name: 'Patient',
      email: 'test.patient@demo.com',
      phone: '+63 917 000 0000',
      date_of_birth: '1990-01-01'
    };
    
    // Try different approaches
    console.log('Approach 1: Direct insert...');
    const { data: patient1, error: error1 } = await supabase
      .from('patients')
      .insert([testPatient])
      .select();
    
    if (error1) {
      console.log('❌ Direct insert failed:', error1.message);
      
      // Try with upsert
      console.log('Approach 2: Upsert...');
      const { data: patient2, error: error2 } = await supabase
        .from('patients')
        .upsert([testPatient])
        .select();
      
      if (error2) {
        console.log('❌ Upsert failed:', error2.message);
        
        // Show what we found
        console.log('\n📊 Database state:');
        console.log('We need to create test patients directly in your Supabase dashboard.');
        console.log('Go to: https://supabase.com/dashboard/project/[your-project]/editor');
        console.log('Run this SQL:');
        console.log(`
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth)
VALUES 
  ('Test', 'Patient', 'test.patient@demo.com', '+63 917 000 0000', '1990-01-01'),
  ('Demo', 'User', 'demo.user@test.com', '+63 917 111 1111', '1985-06-15');
        `);
      } else {
        console.log('✅ Upsert succeeded!');
        console.log('Patient created:', patient2[0]);
      }
    } else {
      console.log('✅ Direct insert succeeded!');
      console.log('Patient created:', patient1[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestPatient().then(() => {
  console.log('✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
