const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create admin client for user management
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUsers() {
  console.log('👥 Creating demo user accounts...\n');

  try {
    // Demo users data
    const demoUsers = [
      {
        email: 'patient@demo.com',
        password: 'demo123',
        role: 'patient',
        profileData: {
          first_name: 'Demo',
          last_name: 'Patient',
          phone: '+63 917 000 0001',
          date_of_birth: '1990-01-01',
          address: '123 Demo Street, Manila',
          blood_type: 'O+'
        }
      },
      {
        email: 'doctor@demo.com', 
        password: 'demo123',
        role: 'doctor',
        profileData: {
          full_name: 'Dr. Demo Doctor',
          specialization: 'General Medicine',
          phone: '+63 917 000 0002',
          license_number: 'DEMO-DOC-001',
          years_experience: 10,
          rating: 4.8,
          total_patients: 250,
          status: 'active'
        }
      }
    ];

    for (const userData of demoUsers) {
      console.log(`📝 Creating ${userData.role}: ${userData.email}`);
      
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            role: userData.role,
            profile_completed: true
          }
        });

        if (authError) {
          console.log(`⚠️  Auth user might already exist: ${authError.message}`);
          
          // Try to get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers({
            filter: `email.eq.${userData.email}`
          });
          
          if (existingUsers && existingUsers.users.length > 0) {
            console.log(`✅ User already exists: ${userData.email}`);
            const userId = existingUsers.users[0].id;
            
            // Create profile if it doesn't exist
            if (userData.role === 'patient') {
              const { error: profileError } = await supabase
                .from('patients')
                .upsert({
                  user_id: userId,
                  email: userData.email,
                  ...userData.profileData
                });
              
              if (profileError) {
                console.log(`⚠️  Profile creation error: ${profileError.message}`);
              } else {
                console.log(`✅ Patient profile created/updated`);
              }
            } else if (userData.role === 'doctor') {
              const { error: profileError } = await supabase
                .from('doctors')
                .upsert({
                  user_id: userId,
                  email: userData.email,
                  ...userData.profileData
                });
              
              if (profileError) {
                console.log(`⚠️  Profile creation error: ${profileError.message}`);
              } else {
                console.log(`✅ Doctor profile created/updated`);
              }
            }
          }
          continue;
        }

        if (authData.user) {
          console.log(`✅ Auth user created: ${authData.user.id}`);
          
          // Create corresponding profile
          if (userData.role === 'patient') {
            const { error: profileError } = await supabase
              .from('patients')
              .insert({
                user_id: authData.user.id,
                email: userData.email,
                ...userData.profileData
              });
            
            if (profileError) {
              console.log(`❌ Patient profile creation failed: ${profileError.message}`);
            } else {
              console.log(`✅ Patient profile created`);
            }
          } else if (userData.role === 'doctor') {
            // Find a clinic to assign the doctor to
            const { data: clinics } = await supabase
              .from('clinics')
              .select('id')
              .limit(1);
            
            const clinicId = clinics && clinics.length > 0 ? clinics[0].id : null;
            
            const { error: profileError } = await supabase
              .from('doctors')
              .insert({
                user_id: authData.user.id,
                email: userData.email,
                clinic_id: clinicId,
                ...userData.profileData
              });
            
            if (profileError) {
              console.log(`❌ Doctor profile creation failed: ${profileError.message}`);
            } else {
              console.log(`✅ Doctor profile created`);
            }
          }
        }
        
      } catch (userError) {
        console.error(`❌ Error creating ${userData.role}:`, userError);
      }
    }

    console.log('\n🎉 Demo user creation process completed!');
    console.log('\nDemo Credentials:');
    console.log('Patient: patient@demo.com / demo123');
    console.log('Doctor: doctor@demo.com / demo123');
    console.log('\n💡 You can now test the authentication system!');

  } catch (error) {
    console.error('❌ Error during demo user creation:', error);
  }
}

createDemoUsers().then(() => {
  console.log('\n✨ Process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Process failed:', error);
  process.exit(1);
});
