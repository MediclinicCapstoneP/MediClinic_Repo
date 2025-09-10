const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugClinics() {
  console.log('🔍 Debugging clinic data...\n');
  
  try {
    // Test 1: Check raw clinic data
    console.log('1️⃣ Testing raw clinic query...');
    const { data: rawClinics, error: rawError } = await supabase
      .from('clinics')
      .select('id, clinic_name, status, city')
      .limit(5);
    
    if (rawError) {
      console.error('❌ Raw clinic error:', rawError);
      return;
    }
    
    console.log(`✅ Found ${rawClinics?.length || 0} raw clinics:`);
    rawClinics?.forEach((clinic, i) => {
      console.log(`   ${i+1}. ${clinic.clinic_name} (${clinic.status}) - ${clinic.city || 'No city'}`);
    });
    
    // Test 2: Check approved clinics only
    console.log('\n2️⃣ Testing approved clinics only...');
    const { data: approvedClinics, error: approvedError } = await supabase
      .from('clinics')
      .select('id, clinic_name, status, city')
      .eq('status', 'approved');
    
    if (approvedError) {
      console.error('❌ Approved clinic error:', approvedError);
      return;
    }
    
    console.log(`✅ Found ${approvedClinics?.length || 0} approved clinics:`);
    approvedClinics?.forEach((clinic, i) => {
      console.log(`   ${i+1}. ${clinic.clinic_name} - ${clinic.city || 'No city'}`);
    });
    
    // Test 3: Test the full clinic service query
    console.log('\n3️⃣ Testing full clinic service query...');
    const { data: fullClinics, error: fullError } = await supabase
      .from('clinics')
      .select(`
        *,
        clinic_services:clinic_services (
          id, service_name, service_category, base_price, duration_minutes
        ),
        doctors (
          id, full_name, specialization, rating, profile_picture_url
        ),
        reviews (
          id, rating, review_text, created_at
        )
      `)
      .eq('status', 'approved')
      .limit(2);
    
    if (fullError) {
      console.error('❌ Full query error:', fullError);
      return;
    }
    
    console.log(`✅ Full query returned ${fullClinics?.length || 0} clinics:`);
    fullClinics?.forEach((clinic, i) => {
      console.log(`   ${i+1}. ${clinic.clinic_name}`);
      console.log(`      Services: ${clinic.clinic_services?.length || 0}`);
      console.log(`      Doctors: ${clinic.doctors?.length || 0}`);
      console.log(`      Reviews: ${clinic.reviews?.length || 0}`);
    });
    
    // Test 4: Check clinic services separately
    console.log('\n4️⃣ Testing clinic services...');
    const { data: services, error: servicesError } = await supabase
      .from('clinic_services')
      .select('clinic_id, service_name, service_category')
      .limit(10);
    
    if (servicesError) {
      console.error('❌ Services error:', servicesError);
    } else {
      console.log(`✅ Found ${services?.length || 0} clinic services`);
      services?.slice(0, 3).forEach((service, i) => {
        console.log(`   ${i+1}. ${service.service_name} (${service.service_category})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

debugClinics().then(() => {
  console.log('\n✨ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
