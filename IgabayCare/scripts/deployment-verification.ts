import { createClient } from '@supabase/supabase-js';

/**
 * Deployment Verification Script
 * 
 * This script verifies that all components of the appointment booking system
 * are properly configured and ready for production deployment.
 */

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class DeploymentVerifier {
  private results: VerificationResult[] = [];
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Run all verification checks
   */
  async runVerification(): Promise<{
    success: boolean;
    results: VerificationResult[];
    summary: string;
  }> {
    console.log('🔍 Starting Deployment Verification...\n');

    // Environment Variables Check
    await this.checkEnvironmentVariables();

    // Database Schema Check
    await this.checkDatabaseSchema();

    // Service Dependencies Check
    await this.checkServiceDependencies();

    // PayMongo Configuration Check
    await this.checkPayMongoConfiguration();

    // Email Service Configuration Check
    await this.checkEmailServiceConfiguration();

    // File Structure Check
    await this.checkFileStructure();

    // Build Verification
    await this.checkBuildStatus();

    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const totalChecks = this.results.length;

    const success = failCount === 0;
    const summary = `Verification Complete: ${passCount} passed, ${warningCount} warnings, ${failCount} failed (${totalChecks} total)`;

    console.log('\n' + '='.repeat(60));
    console.log(summary);
    console.log('='.repeat(60));

    this.printResults();

    return {
      success,
      results: this.results,
      summary
    };
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    console.log('🔧 Checking Environment Variables...');

    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_PAYMONGO_PUBLIC_KEY'
    ];

    const optionalVars = [
      'VITE_PAYMONGO_SECRET_KEY',
      'EMAIL_SERVICE_PROVIDER',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        this.results.push({
          component: 'Environment Variables',
          status: 'pass',
          message: `${varName} is configured`
        });
      } else {
        this.results.push({
          component: 'Environment Variables',
          status: 'fail',
          message: `${varName} is missing (required)`
        });
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value) {
        this.results.push({
          component: 'Environment Variables',
          status: 'pass',
          message: `${varName} is configured`
        });
      } else {
        this.results.push({
          component: 'Environment Variables',
          status: 'warning',
          message: `${varName} is not configured (optional)`
        });
      }
    }
  }

  /**
   * Check database schema
   */
  private async checkDatabaseSchema(): Promise<void> {
    console.log('🗄️ Checking Database Schema...');

    if (!this.supabase) {
      this.results.push({
        component: 'Database Schema',
        status: 'fail',
        message: 'Cannot connect to Supabase - check environment variables'
      });
      return;
    }

    const requiredTables = [
      'appointments',
      'transactions',
      'notifications',
      'follow_up_appointments',
      'appointment_reminders'
    ];

    try {
      for (const tableName of requiredTables) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          this.results.push({
            component: 'Database Schema',
            status: 'fail',
            message: `Table '${tableName}' is missing or inaccessible`,
            details: error.message
          });
        } else {
          this.results.push({
            component: 'Database Schema',
            status: 'pass',
            message: `Table '${tableName}' exists and is accessible`
          });
        }
      }
    } catch (error) {
      this.results.push({
        component: 'Database Schema',
        status: 'fail',
        message: 'Database connection failed',
        details: error
      });
    }
  }

  /**
   * Check service dependencies
   */
  private async checkServiceDependencies(): Promise<void> {
    console.log('⚙️ Checking Service Dependencies...');

    const serviceFiles = [
      'src/features/auth/utils/appointmentManagementAPI.ts',
      'src/features/auth/utils/followUpAppointmentService.ts',
      'src/features/auth/utils/enhancedNotificationService.ts',
      'src/features/auth/utils/paymentConfirmationService.ts',
      'src/features/auth/utils/reminderCronService.ts',
      'src/features/auth/utils/emailService.ts'
    ];

    for (const filePath of serviceFiles) {
      try {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(process.cwd(), filePath);
        
        if (fs.existsSync(fullPath)) {
          this.results.push({
            component: 'Service Dependencies',
            status: 'pass',
            message: `Service file exists: ${filePath}`
          });
        } else {
          this.results.push({
            component: 'Service Dependencies',
            status: 'fail',
            message: `Service file missing: ${filePath}`
          });
        }
      } catch (error) {
        this.results.push({
          component: 'Service Dependencies',
          status: 'warning',
          message: `Cannot verify service file: ${filePath}`,
          details: error
        });
      }
    }
  }

  /**
   * Check PayMongo configuration
   */
  private async checkPayMongoConfiguration(): Promise<void> {
    console.log('💳 Checking PayMongo Configuration...');

    const publicKey = process.env.VITE_PAYMONGO_PUBLIC_KEY;
    const secretKey = process.env.VITE_PAYMONGO_SECRET_KEY;

    if (publicKey) {
      if (publicKey.startsWith('pk_test_')) {
        this.results.push({
          component: 'PayMongo Configuration',
          status: 'warning',
          message: 'PayMongo is configured for TEST mode'
        });
      } else if (publicKey.startsWith('pk_live_')) {
        this.results.push({
          component: 'PayMongo Configuration',
          status: 'pass',
          message: 'PayMongo is configured for LIVE mode'
        });
      } else {
        this.results.push({
          component: 'PayMongo Configuration',
          status: 'warning',
          message: 'PayMongo public key format is unrecognized'
        });
      }
    } else {
      this.results.push({
        component: 'PayMongo Configuration',
        status: 'fail',
        message: 'PayMongo public key is missing'
      });
    }

    if (secretKey) {
      this.results.push({
        component: 'PayMongo Configuration',
        status: 'pass',
        message: 'PayMongo secret key is configured'
      });
    } else {
      this.results.push({
        component: 'PayMongo Configuration',
        status: 'warning',
        message: 'PayMongo secret key is missing (needed for server-side operations)'
      });
    }
  }

  /**
   * Check email service configuration
   */
  private async checkEmailServiceConfiguration(): Promise<void> {
    console.log('📧 Checking Email Service Configuration...');

    const provider = process.env.EMAIL_SERVICE_PROVIDER || 'console';

    switch (provider) {
      case 'nodemailer':
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
          this.results.push({
            component: 'Email Service',
            status: 'pass',
            message: 'NodeMailer SMTP configuration is complete'
          });
        } else {
          this.results.push({
            component: 'Email Service',
            status: 'fail',
            message: 'NodeMailer SMTP configuration is incomplete'
          });
        }
        break;

      case 'sendgrid':
        const sendgridKey = process.env.SENDGRID_API_KEY;
        const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;

        if (sendgridKey && sendgridFrom) {
          this.results.push({
            component: 'Email Service',
            status: 'pass',
            message: 'SendGrid configuration is complete'
          });
        } else {
          this.results.push({
            component: 'Email Service',
            status: 'fail',
            message: 'SendGrid configuration is incomplete'
          });
        }
        break;

      case 'console':
        this.results.push({
          component: 'Email Service',
          status: 'warning',
          message: 'Email service is set to console mode (development only)'
        });
        break;

      default:
        this.results.push({
          component: 'Email Service',
          status: 'warning',
          message: `Unknown email service provider: ${provider}`
        });
    }
  }

  /**
   * Check file structure
   */
  private async checkFileStructure(): Promise<void> {
    console.log('📁 Checking File Structure...');

    const criticalFiles = [
      'database/complete_appointment_flow_schema.sql',
      'src/components/patient/AppointmentBookingModal.tsx',
      '.env.example',
      'APPOINTMENT_BOOKING_SYSTEM_SETUP.md'
    ];

    const fs = require('fs');
    const path = require('path');

    for (const filePath of criticalFiles) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          this.results.push({
            component: 'File Structure',
            status: 'pass',
            message: `Critical file exists: ${filePath}`
          });
        } else {
          this.results.push({
            component: 'File Structure',
            status: 'fail',
            message: `Critical file missing: ${filePath}`
          });
        }
      } catch (error) {
        this.results.push({
          component: 'File Structure',
          status: 'warning',
          message: `Cannot verify file: ${filePath}`,
          details: error
        });
      }
    }
  }

  /**
   * Check build status
   */
  private async checkBuildStatus(): Promise<void> {
    console.log('🏗️ Checking Build Status...');

    const fs = require('fs');
    const path = require('path');

    try {
      const distPath = path.join(process.cwd(), 'dist');
      const indexPath = path.join(distPath, 'index.html');

      if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
        this.results.push({
          component: 'Build Status',
          status: 'pass',
          message: 'Application has been built successfully'
        });
      } else {
        this.results.push({
          component: 'Build Status',
          status: 'warning',
          message: 'Application build not found - run npm run build'
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Build Status',
        status: 'warning',
        message: 'Cannot verify build status',
        details: error
      });
    }
  }

  /**
   * Print verification results
   */
  private printResults(): void {
    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(60));

    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.component]) {
        acc[result.component] = [];
      }
      acc[result.component].push(result);
      return acc;
    }, {} as Record<string, VerificationResult[]>);

    for (const [component, results] of Object.entries(groupedResults)) {
      console.log(`\n${component}:`);
      for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${icon} ${result.message}`);
        if (result.details) {
          console.log(`     Details: ${result.details}`);
        }
      }
    }

    console.log('\n📝 Next Steps:');
    console.log('-'.repeat(60));

    const failures = this.results.filter(r => r.status === 'fail');
    const warnings = this.results.filter(r => r.status === 'warning');

    if (failures.length > 0) {
      console.log('\n❌ Critical Issues (Must Fix):');
      failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings (Recommended to Fix):');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
      });
    }

    if (failures.length === 0 && warnings.length === 0) {
      console.log('\n🎉 All checks passed! System is ready for deployment.');
    } else if (failures.length === 0) {
      console.log('\n✅ No critical issues found. System can be deployed with warnings.');
    } else {
      console.log('\n🚨 Critical issues found. Please fix before deployment.');
    }
  }
}

// Export for use in other scripts
export { DeploymentVerifier };

// Main execution function
export async function runDeploymentVerification(): Promise<void> {
  const verifier = new DeploymentVerifier();
  const results = await verifier.runVerification();
  
  if (!results.success) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDeploymentVerification().catch(console.error);
}
