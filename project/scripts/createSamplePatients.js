const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SAMPLE_PATIENTS = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+63 917 123 4567',
    date_of_birth: '1990-05-15',
    address: '123 Main Street, Makati City',
    blood_type: 'O+',
    user_id: null // We'll set this later if needed
  },
  {
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@example.com',
    phone: '+63 917 234 5678',
    date_of_birth: '1985-08-22',
    address: '456 Oak Avenue, Quezon City',
    blood_type: 'A+',
    user_id: null
  },
  {
    first_name: 'Carlos',
    last_name: 'Garcia',
    email: 'carlos.garcia@example.com',
    phone: '+63 917 345 6789',
    date_of_birth: '1992-12-03',
    address: '789 Pine Street, Cebu City',
    blood_type: 'B+',
    user_id: null
  }
];

async function createSamplePatients() {
  console.log('👥 Creating sample patients for testing...\n');
  
  try {
    // Check if patients already exist
    const { data: existingPatients, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing patients:', checkError);
      return;
    }
    
    if (existingPatients && existingPatients.length > 0) {
      console.log('✅ Patients already exist. Skipping creation.');
      return;
    }
    
    // Insert sample patients
    console.log('📝 Inserting sample patients...');
    const { data: patients, error: insertError } = await supabase
      .from('patients')
      .insert(SAMPLE_PATIENTS)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting patients:', insertError);
      return;
    }
    
    console.log(`✅ Created ${patients?.length} sample patients:`);
    patients?.forEach((patient, i) => {
      console.log(`   ${i+1}. ${patient.first_name} ${patient.last_name} (${patient.email})`);
    });
    
    console.log('\n🎉 Sample patients created successfully!');
    console.log('💡 You can now test the booking flow in the app.');
    
  } catch (error) {
    console.error('❌ Error during patient creation:', error);
  }
}

createSamplePatients().then(() => {
  console.log('\n✨ Patient creation completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Patient creation failed:', error);
  process.exit(1);
});
