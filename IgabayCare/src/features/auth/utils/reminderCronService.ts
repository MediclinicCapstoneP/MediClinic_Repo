import { supabase } from '../../../supabaseClient';
import { enhancedNotificationService } from './enhancedNotificationService';

interface CronJobConfig {
  intervalMinutes: number;
  enabled: boolean;
  lastRun?: string;
}

export class ReminderCronService {
  private config: CronJobConfig;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: CronJobConfig = { intervalMinutes: 5, enabled: true }) {
    this.config = config;
  }

  /**
   * Start the cron service
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⏸️ Reminder cron service is disabled');
      return;
    }

    if (this.intervalId) {
      console.log('⚠️ Cron service is already running');
      return;
    }

    console.log(`🚀 Starting reminder cron service (every ${this.config.intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.processReminders();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the cron service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Reminder cron service stopped');
    }
  }

  /**
   * Process all scheduled reminders
   */
  private async processReminders(): Promise<void> {
    try {
      console.log('🔄 Processing scheduled reminders...');
      const startTime = Date.now();

      // Process appointment reminders
      const reminderResult = await enhancedNotificationService.processScheduledReminders();
      
      // Process follow-up reminders
      const followUpResult = await this.processFollowUpReminders();
      
      // Process expired appointment cleanup
      const cleanupResult = await this.cleanupExpiredReminders();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Reminder processing completed in ${duration}ms:`);
      console.log(`   - Appointment reminders: ${reminderResult.processed || 0}`);
      console.log(`   - Follow-up reminders: ${followUpResult.processed || 0}`);
      console.log(`   - Cleaned up: ${cleanupResult.cleaned || 0}`);

      // Update last run timestamp
      this.config.lastRun = new Date().toISOString();

    } catch (error) {
      console.error('❌ Error in reminder cron service:', error);
    }
  }

  /**
   * Process follow-up appointment reminders
   */
  private async processFollowUpReminders(): Promise<{
    success: boolean;
    processed?: number;
    error?: string;
  }> {
    try {
      // Get follow-up recommendations that are expiring soon (within 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: followUps, error } = await supabase
        .from('follow_up_appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email),
          clinic:clinics(name),
          original_appointment:appointments!original_appointment_id(appointment_date, appointment_type)
        `)
        .eq('status', 'recommended')
        .lte('recommended_date', threeDaysFromNow.toISOString().split('T')[0])
        .is('follow_up_appointment_id', null);

      if (error) {
        console.error('❌ Error fetching follow-up reminders:', error);
        return { success: false, error: error.message };
      }

      let processedCount = 0;

      for (const followUp of followUps || []) {
        try {
          const daysUntilRecommended = Math.ceil(
            (new Date(followUp.recommended_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          let title: string;
          let message: string;

          if (daysUntilRecommended <= 0) {
            title = 'Follow-up Appointment Overdue';
            message = `Your recommended follow-up appointment is overdue. Please schedule your appointment soon to ensure continuity of care.`;
          } else if (daysUntilRecommended <= 1) {
            title = 'Follow-up Appointment Due Tomorrow';
            message = `Your follow-up appointment is recommended for tomorrow (${new Date(followUp.recommended_date).toLocaleDateString()}). Please schedule your appointment.`;
          } else {
            title = 'Follow-up Appointment Reminder';
            message = `Your follow-up appointment is recommended for ${new Date(followUp.recommended_date).toLocaleDateString()} (in ${daysUntilRecommended} days). Please schedule your appointment.`;
          }

          const feeText = followUp.is_free ? 'FREE' : `₱${followUp.discounted_fee.toFixed(2)}`;
          message += ` Fee: ${feeText}`;

          await enhancedNotificationService.createNotification({
            userId: followUp.patient_id,
            userType: 'patient',
            title,
            message,
            type: 'follow_up_reminder',
            notificationType: 'follow_up_scheduled',
            sendEmail: true
          });

          processedCount++;
        } catch (followUpError) {
          console.error(`❌ Error processing follow-up reminder ${followUp.id}:`, followUpError);
        }
      }

      return { success: true, processed: processedCount };
    } catch (error) {
      console.error('❌ Error processing follow-up reminders:', error);
      return { success: false, error: 'Failed to process follow-up reminders' };
    }
  }

  /**
   * Clean up expired and old reminders
   */
  private async cleanupExpiredReminders(): Promise<{
    success: boolean;
    cleaned?: number;
    error?: string;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Mark expired reminders as cancelled
      const { data: expiredReminders, error: expiredError } = await supabase
        .from('appointment_reminders')
        .update({ status: 'cancelled' })
        .eq('status', 'scheduled')
        .lt('reminder_time', oneDayAgo.toISOString())
        .select('id');

      if (expiredError) {
        console.error('❌ Error cleaning up expired reminders:', expiredError);
        return { success: false, error: expiredError.message };
      }

      // Mark old follow-up recommendations as expired (after 90 days)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const { data: expiredFollowUps, error: followUpError } = await supabase
        .from('follow_up_appointments')
        .update({ status: 'expired' })
        .eq('status', 'recommended')
        .lt('recommended_date', ninetyDaysAgo.toISOString().split('T')[0])
        .select('id');

      if (followUpError) {
        console.error('❌ Error cleaning up expired follow-ups:', followUpError);
      }

      const totalCleaned = (expiredReminders?.length || 0) + (expiredFollowUps?.length || 0);
      return { success: true, cleaned: totalCleaned };
    } catch (error) {
      console.error('❌ Error in cleanup process:', error);
      return { success: false, error: 'Failed to cleanup expired reminders' };
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    running: boolean;
    config: CronJobConfig;
    uptime?: number;
  } {
    return {
      running: this.intervalId !== null,
      config: this.config,
      uptime: this.config.lastRun ? Date.now() - new Date(this.config.lastRun).getTime() : undefined
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CronJobConfig>): void {
    const wasRunning = this.intervalId !== null;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    try {
      console.log('🔧 Manual trigger of reminder processing...');
      await this.processReminders();
      return { success: true, results: 'Manual processing completed' };
    } catch (error) {
      console.error('❌ Error in manual trigger:', error);
      return { success: false, error: 'Manual processing failed' };
    }
  }
}

// Export singleton instance
export const reminderCronService = new ReminderCronService();

// Auto-start in production (you may want to control this differently)
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  reminderCronService.start();
}

// For development, you can manually start/stop:
// reminderCronService.start();
// reminderCronService.stop();
