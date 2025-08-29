// Test script to verify appointment confirmation functionality
// Run this in the browser console to test the fix

async function testAppointmentConfirmation() {
  console.log('🧪 Testing Appointment Confirmation Fix...');
  
  const appointmentId = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';
  
  try {
    console.log('📋 Testing appointment ID:', appointmentId);
    
    // Import the AppointmentService (adjust path as needed)
    const { AppointmentService } = await import('./src/features/auth/utils/appointmentService.js');
    
    console.log('🔍 Attempting to confirm appointment...');
    
    // Try to confirm the appointment
    const result = await AppointmentService.confirmAppointment(appointmentId);
    
    if (result) {
      console.log('✅ SUCCESS: Appointment confirmed successfully!');
      console.log('📊 Confirmation result:', result);
      
      // Check the confirmation fields
      if (result.confirmation_sent) {
        console.log('✅ confirmation_sent field is set to:', result.confirmation_sent);
      }
      
      if (result.confirmation_sent_at) {
        console.log('✅ confirmation_sent_at field is set to:', result.confirmation_sent_at);
      }
      
      console.log('✅ Status is now:', result.status);
      
    } else {
      console.log('⚠️ WARNING: Confirmation returned null - check if appointment exists');
    }
    
  } catch (error) {
    console.error('❌ ERROR during confirmation:', error);
    
    if (error.code === 'PGRST204') {
      console.log('🔧 SCHEMA ERROR: Missing database columns detected');
      console.log('💡 SOLUTION: Run the database fix script:');
      console.log('   database/quick_fix_confirmation_sent.sql');
    } else {
      console.log('🔍 This appears to be a different type of error');
    }
  }
  
  console.log('🏁 Test completed');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAppointmentConfirmation };
} else if (typeof window !== 'undefined') {
  window.testAppointmentConfirmation = testAppointmentConfirmation;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🎯 Appointment Confirmation Test Loaded');
  console.log('📋 Run testAppointmentConfirmation() to test the fix');
}