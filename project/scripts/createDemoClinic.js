const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoClinic() {
  console.log('🏥 Creating demo clinic...\n');

  try {
    // Demo clinic data
    const clinicData = {
      user_id: null, // Will need to be set if we have a clinic admin user
      clinic_name: 'Demo Medical Clinic',
      address: '456 Health Avenue, Makati City',
      phone: '+63 2 8000 0000',
      email: 'clinic@demo.com',
      city: 'Makati City',
      state: 'Metro Manila',
      zip_code: '1200',
      description: 'A comprehensive healthcare facility providing quality medical services to the community.',
      operating_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '14:00', closed: false },
        sunday: { open: '09:00', close: '13:00', closed: false }
      },
      services: [
        'General Medicine',
        'Pediatrics',
        'Internal Medicine',
        'Dermatology',
        'Laboratory Services',
        'X-Ray Services'
      ],
      specialties: [
        'General Medicine',
        'Pediatrics',
        'Internal Medicine',
        'Dermatology'
      ],
      number_of_doctors: 1,
      number_of_staff: 5,
      status: 'approved',
      year_established: 2020
    };

    console.log('📝 Checking if demo clinic exists...');
    
    // Check if clinic already exists
    const { data: existingClinics, error: checkError } = await supabase
      .from('clinics')
      .select('id, clinic_name')
      .eq('email', clinicData.email);

    if (checkError) {
      console.error('❌ Error checking existing clinics:', checkError);
      return;
    }

    if (existingClinics && existingClinics.length > 0) {
      console.log(`✅ Demo clinic already exists: ${existingClinics[0].clinic_name}`);
      return existingClinics[0].id;
    }

    console.log('📝 Creating new demo clinic...');
    
    const { data: clinicResult, error: clinicError } = await supabase
      .from('clinics')
      .insert(clinicData)
      .select('id, clinic_name')
      .single();

    if (clinicError) {
      console.error('❌ Error creating demo clinic:', clinicError);
      return null;
    }

    console.log(`✅ Demo clinic created: ${clinicResult.clinic_name} (ID: ${clinicResult.id})`);

    // Create some demo time slots for the clinic
    console.log('📝 Creating demo time slots...');
    
    const today = new Date();
    const timeSlots = [];
    
    // Generate time slots for the next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Morning slots (9:00 AM - 12:00 PM)
      const morningHours = ['09:00', '10:00', '11:00'];
      // Afternoon slots (2:00 PM - 5:00 PM)  
      const afternoonHours = ['14:00', '15:00', '16:00', '17:00'];
      
      const allHours = [...morningHours, ...afternoonHours];
      
      for (const time of allHours) {
        timeSlots.push({
          clinic_id: clinicResult.id,
          date: dateString,
          time: time,
          is_available: true
        });
      }
    }

    const { error: slotsError } = await supabase
      .from('available_slots')
      .insert(timeSlots);

    if (slotsError) {
      console.log('⚠️  Error creating time slots:', slotsError.message);
    } else {
      console.log(`✅ Created ${timeSlots.length} time slots for the next 7 days`);
    }

    console.log('\n🎉 Demo clinic creation completed!');
    console.log(`\nClinic Details:`);
    console.log(`Name: ${clinicData.clinic_name}`);
    console.log(`Email: ${clinicData.email}`);
    console.log(`Phone: ${clinicData.phone}`);
    console.log(`Address: ${clinicData.address}`);
    
    return clinicResult.id;

  } catch (error) {
    console.error('❌ Error during demo clinic creation:', error);
    return null;
  }
}

createDemoClinic().then((clinicId) => {
  if (clinicId) {
    console.log(`\n✨ Demo clinic created successfully with ID: ${clinicId}`);
  } else {
    console.log('\n⚠️  Demo clinic creation had issues');
  }
  process.exit(0);
}).catch((error) => {
  console.error('💥 Process failed:', error);
  process.exit(1);
});
