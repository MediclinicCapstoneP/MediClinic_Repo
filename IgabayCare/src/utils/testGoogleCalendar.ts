import googleCalendarService from '../services/googleCalendarService';

/**
 * Test function to verify Google Calendar integration
 * Call this from your browser console to test the integration
 */
export async function testGoogleCalendarIntegration() {
  console.log('🔍 Testing Google Calendar Integration...');
  
  try {
    // Test creating a sample appointment event
    const testAppointment = {
      patientName: 'John Doe',
      doctorName: 'Dr. Sarah Smith',
      service: 'General Consultation',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      time: '10:00:00',
      duration: 30,
      patientEmail: 'john.doe@example.com',
      doctorEmail: 'dr.smith@clinic.com',
      notes: 'Test appointment created via IgabayCare system'
    };

    console.log('📅 Creating test appointment event...', testAppointment);
    
    const eventId = await googleCalendarService.createAppointmentEvent(testAppointment);
    
    if (eventId) {
      console.log('✅ Test appointment created successfully!');
      console.log('📋 Event ID:', eventId);
      console.log('🔗 Check your Google Calendar to see the event');
      
      // Test updating the event
      console.log('📝 Testing event update...');
      const updateSuccess = await googleCalendarService.updateAppointmentEvent(eventId, {
        notes: 'Updated test appointment - integration working!'
      });
      
      if (updateSuccess) {
        console.log('✅ Event update successful!');
      } else {
        console.log('❌ Event update failed');
      }
      
      // Test getting events
      console.log('📖 Testing event retrieval...');
      const events = await googleCalendarService.getAppointmentEvents();
      console.log('📊 Found events:', events.length);
      console.log('📝 Events:', events.slice(0, 3)); // Show first 3 events
      
      // Optionally delete the test event (uncomment to test deletion)
      /*
      console.log('🗑️ Testing event deletion...');
      const deleteSuccess = await googleCalendarService.deleteAppointmentEvent(eventId);
      if (deleteSuccess) {
        console.log('✅ Event deletion successful!');
      } else {
        console.log('❌ Event deletion failed');
      }
      */
      
      return {
        success: true,
        eventId,
        message: 'Google Calendar integration test completed successfully!'
      };
    } else {
      console.log('❌ Failed to create test appointment');
      return {
        success: false,
        message: 'Failed to create test appointment. Check console for errors.'
      };
    }
  } catch (error) {
    console.error('💥 Google Calendar integration test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Google Calendar integration test failed. Check console for details.'
    };
  }
}

/**
 * Simple test to check if Google Calendar service is properly configured
 */
export async function checkGoogleCalendarConfig() {
  console.log('🔧 Checking Google Calendar configuration...');
  
  const requiredEnvVars = [
    'VITE_GOOGLE_PROJECT_ID',
    'VITE_GOOGLE_PRIVATE_KEY_ID', 
    'VITE_GOOGLE_PRIVATE_KEY',
    'VITE_GOOGLE_CLIENT_EMAIL',
    'VITE_GOOGLE_CLIENT_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars);
    console.log('📝 Please check your .env file and ensure all Google Calendar variables are set');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  console.log('📋 Project ID:', import.meta.env.VITE_GOOGLE_PROJECT_ID);
  console.log('📧 Client Email:', import.meta.env.VITE_GOOGLE_CLIENT_EMAIL);
  
  return true;
}

// Export for use in browser console during development
if (typeof window !== 'undefined') {
  (window as any).testGoogleCalendar = testGoogleCalendarIntegration;
  (window as any).checkGoogleCalendarConfig = checkGoogleCalendarConfig;
  
  console.log('🧪 Google Calendar test functions available:');
  console.log('  - testGoogleCalendar() - Run full integration test');
  console.log('  - checkGoogleCalendarConfig() - Check environment configuration');
}
