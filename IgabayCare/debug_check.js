// Quick Debug Check - Run this in browser console to test if new code is active
console.log('🔍 Debug Check: Testing if enhanced debugging is active...');
console.log('🔬 If you see this message, the new debugging code should be working');
console.log('💡 If you still see old messages, please hard refresh: Ctrl+Shift+R');

// Test the clinic service directly if available
if (window.clinicService || window.supabase) {
    console.log('✅ Clinic service or Supabase is available for testing');
} else {
    console.log('⚠️ Clinic service not available in global scope');
}

console.log('📋 Next steps:');
console.log('   1. Hard refresh browser (Ctrl+Shift+R)');
console.log('   2. Run SQL script: database/comprehensive_clinic_fix.sql');
console.log('   3. Check for new debug messages starting with 🔬');