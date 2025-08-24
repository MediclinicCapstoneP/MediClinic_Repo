/**
 * Environment Configuration Checker
 * Helps diagnose Supabase configuration issues
 */

export const checkEnvironmentConfig = () => {
  const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE
  };

  console.log('=== ENVIRONMENT CONFIGURATION ===');
  console.log('Supabase URL:', config.supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Supabase Anon Key:', config.supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('Development Mode:', config.isDev ? '✅ Yes' : '❌ No');
  console.log('Vite Mode:', config.mode);
  console.log('==================================');

  const issues = [];
  
  if (!config.supabaseUrl) {
    issues.push('VITE_SUPABASE_URL environment variable is missing');
  }
  
  if (!config.supabaseAnonKey) {
    issues.push('VITE_SUPABASE_ANON_KEY environment variable is missing');
  }

  if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
    issues.push('VITE_SUPABASE_URL should start with https://');
  }

  if (issues.length > 0) {
    console.error('❌ Configuration Issues:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    console.log('\n📋 To fix these issues:');
    console.log('1. Create a .env file in your project root');
    console.log('2. Add the following variables:');
    console.log('   VITE_SUPABASE_URL=your_supabase_project_url');
    console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('3. Restart your development server');
  } else {
    console.log('✅ All environment variables are properly configured');
  }

  return {
    isValid: issues.length === 0,
    issues,
    config
  };
};

// Auto-check configuration in development
if (import.meta.env.DEV) {
  checkEnvironmentConfig();
}