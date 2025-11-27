import { supabase } from '../lib/supabase';

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
    status: 'approved',
    operating_hours: {
      "monday": { "open": "08:00", "close": "20:00" },
      "tuesday": { "open": "08:00", "close": "20:00" },
      "wednesday": { "open": "08:00", "close": "20:00" },
      "thursday": { "open": "08:00", "close": "20:00" },
      "friday": { "open": "08:00", "close": "20:00" },
      "saturday": { "open": "08:00", "close": "16:00" },
      "sunday": { "open": "10:00", "close": "16:00" }
    }
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
    status: 'approved',
    operating_hours: {
      "monday": { "open": "07:00", "close": "19:00" },
      "tuesday": { "open": "07:00", "close": "19:00" },
      "wednesday": { "open": "07:00", "close": "19:00" },
      "thursday": { "open": "07:00", "close": "19:00" },
      "friday": { "open": "07:00", "close": "19:00" },
      "saturday": { "open": "08:00", "close": "17:00" },
      "sunday": { "open": "09:00", "close": "15:00" }
    }
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
    status: 'approved',
    operating_hours: {
      "monday": { "open": "08:00", "close": "18:00" },
      "tuesday": { "open": "08:00", "close": "18:00" },
      "wednesday": { "open": "08:00", "close": "18:00" },
      "thursday": { "open": "08:00", "close": "18:00" },
      "friday": { "open": "08:00", "close": "18:00" },
      "saturday": { "open": "09:00", "close": "15:00" },
      "sunday": { "open": "closed", "close": "closed" }
    }
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
    status: 'approved',
    operating_hours: {
      "monday": { "open": "07:30", "close": "19:30" },
      "tuesday": { "open": "07:30", "close": "19:30" },
      "wednesday": { "open": "07:30", "close": "19:30" },
      "thursday": { "open": "07:30", "close": "19:30" },
      "friday": { "open": "07:30", "close": "19:30" },
      "saturday": { "open": "08:00", "close": "16:00" },
      "sunday": { "open": "09:00", "close": "15:00" }
    }
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
    status: 'approved',
    operating_hours: {
      "monday": { "open": "06:00", "close": "20:00" },
      "tuesday": { "open": "06:00", "close": "20:00" },
      "wednesday": { "open": "06:00", "close": "20:00" },
      "thursday": { "open": "06:00", "close": "20:00" },
      "friday": { "open": "06:00", "close": "20:00" },
      "saturday": { "open": "07:00", "close": "18:00" },
      "sunday": { "open": "08:00", "close": "16:00" }
    }
  }
];

const SAMPLE_DOCTORS = [
  {
    full_name: 'Dr. Maria Santos',
    specialization: 'Cardiology',
    email: 'maria.santos@manilamedical.com',
    phone: '+63 917 123 4567',
    license_number: 'PRC-12345',
    years_experience: 15,
    rating: 4.8,
    total_patients: 1250,
    status: 'active'
  },
  {
    full_name: 'Dr. Juan Rodriguez',
    specialization: 'Orthopedics',
    email: 'juan.rodriguez@cebugeneral.com',
    phone: '+63 917 234 5678',
    license_number: 'PRC-23456',
    years_experience: 12,
    rating: 4.7,
    total_patients: 980,
    status: 'active'
  },
  {
    full_name: 'Dr. Ana Garcia',
    specialization: 'Dermatology',
    email: 'ana.garcia@davaomedical.com',
    phone: '+63 917 345 6789',
    license_number: 'PRC-34567',
    years_experience: 10,
    rating: 4.9,
    total_patients: 1500,
    status: 'active'
  },
  {
    full_name: 'Dr. Carlos Mendoza',
    specialization: 'Internal Medicine',
    email: 'carlos.mendoza@baguiomedical.com',
    phone: '+63 917 456 7890',
    license_number: 'PRC-45678',
    years_experience: 18,
    rating: 4.6,
    total_patients: 2100,
    status: 'active'
  },
  {
    full_name: 'Dr. Lisa Cruz',
    specialization: 'Radiology',
    email: 'lisa.cruz@iloilodiagnostic.com',
    phone: '+63 917 567 8901',
    license_number: 'PRC-56789',
    years_experience: 8,
    rating: 4.8,
    total_patients: 800,
    status: 'active'
  }
];

export async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Insert clinics
    console.log('Inserting clinics...');
    const { data: clinics, error: clinicError } = await supabase
      .from('clinics')
      .insert(SAMPLE_CLINICS)
      .select();
    
    if (clinicError) {
      console.error('Error inserting clinics:', clinicError);
      return;
    }
    
    console.log(`✅ Inserted ${clinics?.length} clinics`);
    
    // Insert doctors
    console.log('Inserting doctors...');
    const doctorsWithClinicIds = SAMPLE_DOCTORS.map((doctor, index) => ({
      ...doctor,
      clinic_id: clinics?.[index]?.id || null
    }));
    
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .insert(doctorsWithClinicIds)
      .select();
    
    if (doctorError) {
      console.error('Error inserting doctors:', doctorError);
      return;
    }
    
    console.log(`✅ Inserted ${doctors?.length} doctors`);
    
    // Insert clinic services
    console.log('Inserting clinic services...');
    const clinicServices = [];
    
    for (const clinic of clinics || []) {
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
    
    const { data: services, error: serviceError } = await supabase
      .from('clinic_services')
      .insert(clinicServices);
    
    if (serviceError) {
      console.error('Error inserting services:', serviceError);
      return;
    }
    
    console.log(`✅ Inserted ${clinicServices.length} clinic services`);
    
    // Insert some sample reviews
    console.log('Inserting sample reviews...');
    const sampleReviews = clinics?.slice(0, 3).map((clinic, index) => ({
      clinic_id: clinic.id,
      patient_id: null, // We'll need to create patients separately
      rating: [5, 4, 5][index],
      review_text: [
        'Excellent service and professional staff. Highly recommended!',
        'Good facilities and experienced doctors. Clean environment.',
        'Amazing medical care with modern equipment. Very satisfied.'
      ][index],
      is_verified: true
    })) || [];
    
    if (sampleReviews.length > 0) {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert(sampleReviews);
      
      if (reviewError) {
        console.error('Error inserting reviews:', reviewError);
      } else {
        console.log(`✅ Inserted ${sampleReviews.length} sample reviews`);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}
