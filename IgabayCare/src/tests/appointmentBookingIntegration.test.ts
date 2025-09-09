import { appointmentManagementAPI } from '../features/auth/utils/appointmentManagementAPI';
import { followUpAppointmentService } from '../features/auth/utils/followUpAppointmentService';
import { enhancedNotificationService } from '../features/auth/utils/enhancedNotificationService';
import { paymentConfirmationService } from '../features/auth/utils/paymentConfirmationService';
import { reminderCronService } from '../features/auth/utils/reminderCronService';
import { emailService } from '../features/auth/utils/emailService';

/**
 * Integration Test Suite for Complete Appointment Booking Flow
 * 
 * This test suite validates the entire appointment booking system including:
 * - Appointment booking with payment
 * - Follow-up scheduling
 * - Notification system
 * - Email service
 * - Reminder system
 * - Payment confirmation
 */

interface TestAppointmentData {
  patientId: string;
  clinicId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  patientNotes?: string;
  paymentMethod: string;
  paymentProvider: string;
  externalPaymentId: string;
  totalAmount: number;
  consultationFee: number;
  bookingFee?: number;
}

interface TestResults {
  success: boolean;
  step: string;
  error?: string;
  data?: any;
}

export class AppointmentBookingIntegrationTest {
  private testResults: TestResults[] = [];

  /**
   * Run complete integration test
   */
  async runCompleteTest(): Promise<{
    success: boolean;
    results: TestResults[];
    summary: string;
  }> {
    console.log('🧪 Starting Complete Appointment Booking Integration Test...');
    
    try {
      // Test data
      const testData: TestAppointmentData = {
        patientId: 'test-patient-uuid',
        clinicId: 'test-clinic-uuid',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00:00',
        appointmentType: 'consultation',
        patientNotes: 'Integration test appointment',
        paymentMethod: 'gcash',
        paymentProvider: 'paymongo',
        externalPaymentId: 'pi_test_integration_123',
        totalAmount: 550,
        consultationFee: 500,
        bookingFee: 50
      };

      // Step 1: Test complete appointment booking with payment
      await this.testCompleteAppointmentBooking(testData);

      // Step 2: Test follow-up appointment creation
      await this.testFollowUpAppointmentFlow(testData);

      // Step 3: Test notification system
      await this.testNotificationSystem(testData);

      // Step 4: Test email service
      await this.testEmailService();

      // Step 5: Test payment confirmation
      await this.testPaymentConfirmation(testData);

      // Step 6: Test reminder system
      await this.testReminderSystem();

      // Step 7: Test appointment status updates
      await this.testAppointmentStatusUpdates(testData);

      const successCount = this.testResults.filter(r => r.success).length;
      const totalTests = this.testResults.length;
      const success = successCount === totalTests;

      const summary = `Integration Test Complete: ${successCount}/${totalTests} tests passed`;
      
      console.log(`✅ ${summary}`);
      return {
        success,
        results: this.testResults,
        summary
      };

    } catch (error) {
      console.error('❌ Integration test failed:', error);
      return {
        success: false,
        results: this.testResults,
        summary: `Integration test failed: ${error}`
      };
    }
  }

  /**
   * Test complete appointment booking with payment
   */
  private async testCompleteAppointmentBooking(testData: TestAppointmentData): Promise<void> {
    try {
      console.log('📅 Testing complete appointment booking...');
      
      const result = await appointmentManagementAPI.completeAppointmentBooking(testData);
      
      this.testResults.push({
        success: result.success,
        step: 'Complete Appointment Booking',
        error: result.error,
        data: result.appointment
      });

      if (result.success) {
        console.log('✅ Appointment booking test passed');
      } else {
        console.log('❌ Appointment booking test failed:', result.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Complete Appointment Booking',
        error: `Exception: ${error}`
      });
      console.log('❌ Appointment booking test exception:', error);
    }
  }

  /**
   * Test follow-up appointment flow
   */
  private async testFollowUpAppointmentFlow(testData: TestAppointmentData): Promise<void> {
    try {
      console.log('🔄 Testing follow-up appointment flow...');
      
      // Test follow-up recommendation creation
      const followUpResult = await followUpAppointmentService.createFollowUpRecommendation({
        originalAppointmentId: 'test-appointment-uuid',
        patientId: testData.patientId,
        clinicId: testData.clinicId,
        followUpType: 'routine',
        recommendedDate: '2024-01-22',
        reason: 'Integration test follow-up',
        doctorNotes: 'Test follow-up notes'
      });

      this.testResults.push({
        success: followUpResult.success,
        step: 'Follow-up Recommendation Creation',
        error: followUpResult.error,
        data: followUpResult.followUp
      });

      if (followUpResult.success) {
        console.log('✅ Follow-up recommendation test passed');
        
        // Test follow-up scheduling
        const scheduleResult = await followUpAppointmentService.scheduleFollowUpAppointment({
          followUpId: followUpResult.followUp?.id || 'test-followup-uuid',
          scheduledDate: '2024-01-22',
          appointmentTime: '14:00',
          appointmentType: 'follow_up'
        });

        this.testResults.push({
          success: scheduleResult.success,
          step: 'Follow-up Appointment Scheduling',
          error: scheduleResult.error,
          data: scheduleResult.appointment
        });

        if (scheduleResult.success) {
          console.log('✅ Follow-up scheduling test passed');
        } else {
          console.log('❌ Follow-up scheduling test failed:', scheduleResult.error);
        }
      } else {
        console.log('❌ Follow-up recommendation test failed:', followUpResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Follow-up Appointment Flow',
        error: `Exception: ${error}`
      });
      console.log('❌ Follow-up appointment test exception:', error);
    }
  }

  /**
   * Test notification system
   */
  private async testNotificationSystem(testData: TestAppointmentData): Promise<void> {
    try {
      console.log('🔔 Testing notification system...');
      
      // Test notification creation
      const notificationResult = await enhancedNotificationService.createNotification({
        userId: testData.patientId,
        userType: 'patient',
        title: 'Integration Test Notification',
        message: 'This is a test notification for integration testing',
        type: 'test_notification',
        notificationType: 'general',
        sendEmail: false
      });

      this.testResults.push({
        success: notificationResult.success,
        step: 'Notification Creation',
        error: notificationResult.error,
        data: notificationResult.notification
      });

      if (notificationResult.success) {
        console.log('✅ Notification creation test passed');
        
        // Test notification retrieval
        const notificationsResult = await enhancedNotificationService.getUserNotifications(
          testData.patientId,
          'patient',
          10,
          0
        );

        this.testResults.push({
          success: notificationsResult.success,
          step: 'Notification Retrieval',
          error: notificationsResult.error,
          data: { count: notificationsResult.notifications?.length || 0 }
        });

        if (notificationsResult.success) {
          console.log('✅ Notification retrieval test passed');
        } else {
          console.log('❌ Notification retrieval test failed:', notificationsResult.error);
        }
      } else {
        console.log('❌ Notification creation test failed:', notificationResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Notification System',
        error: `Exception: ${error}`
      });
      console.log('❌ Notification system test exception:', error);
    }
  }

  /**
   * Test email service
   */
  private async testEmailService(): Promise<void> {
    try {
      console.log('📧 Testing email service...');
      
      // Test email sending (console mode for testing)
      const emailResult = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Integration Test Email',
        htmlContent: '<h1>Test Email</h1><p>This is a test email for integration testing.</p>',
        textContent: 'Test Email - This is a test email for integration testing.'
      });

      this.testResults.push({
        success: emailResult.success,
        step: 'Email Service',
        error: emailResult.error,
        data: { messageId: emailResult.messageId }
      });

      if (emailResult.success) {
        console.log('✅ Email service test passed');
        
        // Test templated email
        const templatedEmailResult = await emailService.sendTemplatedEmail({
          type: 'appointment_confirmation',
          data: {
            patientName: 'Test Patient',
            clinicName: 'Test Clinic',
            appointmentDate: 'Monday, January 15, 2024',
            appointmentTime: '10:00 AM',
            appointmentType: 'consultation',
            amount: '550.00'
          }
        }, 'test@example.com');

        this.testResults.push({
          success: templatedEmailResult.success,
          step: 'Templated Email Service',
          error: templatedEmailResult.error,
          data: { messageId: templatedEmailResult.messageId }
        });

        if (templatedEmailResult.success) {
          console.log('✅ Templated email service test passed');
        } else {
          console.log('❌ Templated email service test failed:', templatedEmailResult.error);
        }
      } else {
        console.log('❌ Email service test failed:', emailResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Email Service',
        error: `Exception: ${error}`
      });
      console.log('❌ Email service test exception:', error);
    }
  }

  /**
   * Test payment confirmation
   */
  private async testPaymentConfirmation(testData: TestAppointmentData): Promise<void> {
    try {
      console.log('💳 Testing payment confirmation...');
      
      // Test payment confirmation (mock data)
      const paymentResult = await paymentConfirmationService.confirmPayment({
        transactionId: 'test-transaction-uuid',
        externalPaymentId: testData.externalPaymentId,
        paymentMethod: testData.paymentMethod,
        paymentProvider: testData.paymentProvider,
        status: 'completed'
      });

      this.testResults.push({
        success: paymentResult.success,
        step: 'Payment Confirmation',
        error: paymentResult.error,
        data: paymentResult.transaction
      });

      if (paymentResult.success) {
        console.log('✅ Payment confirmation test passed');
      } else {
        console.log('❌ Payment confirmation test failed:', paymentResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Payment Confirmation',
        error: `Exception: ${error}`
      });
      console.log('❌ Payment confirmation test exception:', error);
    }
  }

  /**
   * Test reminder system
   */
  private async testReminderSystem(): Promise<void> {
    try {
      console.log('⏰ Testing reminder system...');
      
      // Test reminder service status
      const status = reminderCronService.getStatus();
      
      this.testResults.push({
        success: true,
        step: 'Reminder Service Status',
        data: status
      });

      console.log('✅ Reminder service status test passed');

      // Test manual reminder trigger
      const triggerResult = await reminderCronService.triggerManually();
      
      this.testResults.push({
        success: triggerResult.success,
        step: 'Manual Reminder Trigger',
        error: triggerResult.error,
        data: triggerResult.results
      });

      if (triggerResult.success) {
        console.log('✅ Manual reminder trigger test passed');
      } else {
        console.log('❌ Manual reminder trigger test failed:', triggerResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Reminder System',
        error: `Exception: ${error}`
      });
      console.log('❌ Reminder system test exception:', error);
    }
  }

  /**
   * Test appointment status updates
   */
  private async testAppointmentStatusUpdates(testData: TestAppointmentData): Promise<void> {
    try {
      console.log('📝 Testing appointment status updates...');
      
      // Test appointment completion
      const completionResult = await appointmentManagementAPI.updateAppointmentStatus({
        appointmentId: 'test-appointment-uuid',
        status: 'completed',
        notes: 'Integration test completion',
        completionNotes: 'Test completion notes',
        followUpRecommended: true,
        followUpType: 'routine',
        followUpDate: '2024-01-22',
        followUpReason: 'Follow-up integration test'
      });

      this.testResults.push({
        success: completionResult.success,
        step: 'Appointment Status Update',
        error: completionResult.error,
        data: completionResult.appointment
      });

      if (completionResult.success) {
        console.log('✅ Appointment status update test passed');
      } else {
        console.log('❌ Appointment status update test failed:', completionResult.error);
      }
    } catch (error) {
      this.testResults.push({
        success: false,
        step: 'Appointment Status Updates',
        error: `Exception: ${error}`
      });
      console.log('❌ Appointment status update test exception:', error);
    }
  }

  /**
   * Get test summary
   */
  getTestSummary(): string {
    const successCount = this.testResults.filter(r => r.success).length;
    const totalTests = this.testResults.length;
    
    let summary = `\n🧪 Integration Test Summary\n`;
    summary += `================================\n`;
    summary += `Total Tests: ${totalTests}\n`;
    summary += `Passed: ${successCount}\n`;
    summary += `Failed: ${totalTests - successCount}\n`;
    summary += `Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%\n\n`;
    
    summary += `Test Results:\n`;
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      summary += `${index + 1}. ${status} ${result.step}\n`;
      if (!result.success && result.error) {
        summary += `   Error: ${result.error}\n`;
      }
    });
    
    return summary;
  }
}

// Export test runner function
export async function runIntegrationTest(): Promise<void> {
  const testRunner = new AppointmentBookingIntegrationTest();
  const results = await testRunner.runCompleteTest();
  
  console.log(testRunner.getTestSummary());
  
  if (!results.success) {
    throw new Error(`Integration test failed: ${results.summary}`);
  }
}

// Export for manual testing
export { AppointmentBookingIntegrationTest };
