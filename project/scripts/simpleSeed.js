// Simple seed script for MediClinic database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SAMPLE_CLINICS = [
  {
    clinic_name: 'Manila Medical Center',
    email: 'contact@manilamedical.com',
    phone: '+63 2 8123 4567',
    website: 'www.manilamedical.com',
    address: '1234 Taft Avenue, Ermita',
    city: 'Manila',
    state: 'Metro Manila',
    zip_code: '1000',
    license_number: 'MED-2024-001',
    accreditation: 'DOH Accredited',
    description: 'Comprehensive healthcare services with modern facilities and experienced medical professionals.',
    specialties: ['General Medicine', 'Cardiology', 'Pediatrics', 'Emergency Medicine'],
    services: ['Consultation', 'Laboratory Tests', 'X-Ray', 'Emergency Care'],
    latitude: 14.5995,
    longitude: 120.9842,
    status: 'approved'
  },
  {
    clinic_name: 'Cebu General Hospital',
    email: 'info@cebugeneral.com',
    phone: '+63 32 234 5678',
    website: 'www.cebugeneral.com',
    address: '567 Colon Street, Barangay Centro',
    city: 'Cebu City',
    state: 'Cebu',
    zip_code: '6000',
    license_number: 'CEB-2024-002',
    accreditation: 'DOH & PhilHealth Accredited',
    description: 'Leading healthcare provider in Central Visayas with specialized medical services.',
    specialties: ['Orthopedics', 'Neurology', 'Oncology', 'Obstetrics & Gynecology'],
    services: ['Surgery', 'ICU', 'Dialysis', 'Physical Therapy'],
    latitude: 10.3157,
    longitude: 123.8854,
    status: 'approved'
  },
  {
    clinic_name: 'Davao Medical Specialists',
    email: 'admin@davaomedical.com',
    phone: '+63 82 345 6789',
    website: 'www.davaomedical.com',
    address: '890 J.P. Laurel Avenue, Bajada',
    city: 'Davao City',
    state: 'Davao del Sur',
    zip_code: '8000',
    license_number: 'DAV-2024-003',
    accreditation: 'DOH Accredited',
    description: 'Premier medical facility in Mindanao offering specialized healthcare services.',
    specialties: ['Dermatology', 'Ophthalmology', 'ENT', 'Psychiatry'],
    services: ['Cosmetic Surgery', 'Eye Surgery', 'Mental Health', 'Allergy Testing'],
    latitude: 7.0731,
    longitude: 125.6128,
    status: 'approved'
  },
  {
    clinic_name: 'Baguio City Medical Center',
    email: 'contact@baguiomedical.com',
    phone: '+63 74 456 7890',
    website: 'www.baguiomedical.com',
    address: '123 Session Road, Baguio City',
    city: 'Baguio City',
    state: 'Benguet',
    zip_code: '2600',
    license_number: 'BAG-2024-004',
    accreditation: 'DOH & PCAHO Accredited',
    description: 'Trusted healthcare provider in Northern Luzon with comprehensive medical services.',
    specialties: ['Internal Medicine', 'Pulmonology', 'Gastroenterology', 'Rheumatology'],
    services: ['Endoscopy', 'Pulmonary Function Test', 'Colonoscopy', 'Joint Injection'],
    latitude: 16.4023,
    longitude: 120.5960,
    status: 'approved'
  },
  {
    clinic_name: 'Iloilo Diagnostic Center',
    email: 'services@iloilodiagnostic.com',
    phone: '+63 33 567 8901',
    website: 'www.iloilodiagnostic.com',
    address: '456 Gen. Luna Street, Iloilo City Proper',
    city: 'Iloilo City',
    state: 'Iloilo',
    zip_code: '5000',
    license_number: 'ILO-2024-005',
    accreditation: 'DOH Accredited',
    description: 'Advanced diagnostic and imaging center with state-of-the-art equipment.',
    specialties: ['Radiology', 'Pathology', 'Laboratory Medicine', 'Nuclear Medicine'],
    services: ['CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Blood Tests'],
    latitude: 10.7202,
    longitude: 122.5621,
    status: 'approved'
  }
];

async function seedDatabase() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // First check if data already exists
    const { data: existingClinics, error: checkError } = await supabase
      .from('clinics')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }
    
    if (existingClinics && existingClinics.length > 0) {
      console.log('✅ Database already has clinic data. Skipping seed.');
      return;
    }
    
    // Insert clinics
    console.log('📝 Inserting clinics...');
    const { data: clinics, error: clinicError } = await supabase
      .from('clinics')
      .insert(SAMPLE_CLINICS)
      .select();
    
    if (clinicError) {
      console.error('❌ Error inserting clinics:', clinicError);
      return;
    }
    
    console.log(`✅ Inserted ${clinics?.length} clinics successfully!`);
    
    // Insert clinic services for each clinic
    if (clinics && clinics.length > 0) {
      console.log('📝 Inserting clinic services...');
      const clinicServices = [];
      
      for (const clinic of clinics) {
        const services = [
          {
            clinic_id: clinic.id,
            service_name: 'General Consultation',
            service_category: 'consultation',
            description: 'Standard medical consultation with experienced doctors',
            base_price: 1500,
            duration_minutes: 30,
            is_available: true
          },
          {
            clinic_id: clinic.id,
            service_name: 'Laboratory Tests',
            service_category: 'lab_test',
            description: 'Complete blood count, urinalysis, and other lab services',
            base_price: 800,
            duration_minutes: 15,
            is_available: true
          },
          {
            clinic_id: clinic.id,
            service_name: 'X-Ray Imaging',
            service_category: 'imaging',
            description: 'Digital X-ray services for diagnostic imaging',
            base_price: 1200,
            duration_minutes: 20,
            is_available: true
          }
        ];
        
        clinicServices.push(...services);
      }
      
      const { error: serviceError } = await supabase
        .from('clinic_services')
        .insert(clinicServices);
      
      if (serviceError) {
        console.error('❌ Error inserting services:', serviceError);
      } else {
        console.log(`✅ Inserted ${clinicServices.length} clinic services!`);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('👀 You should now see clinics in your app!');
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  }
}

// Run the seeding function
seedDatabase().then(() => {
  console.log('✨ Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});
