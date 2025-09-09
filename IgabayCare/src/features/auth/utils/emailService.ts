import { supabase } from '../../../supabaseClient';

interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
}

interface EmailTemplate {
  type: 'appointment_confirmation' | 'payment_confirmation' | 'appointment_reminder' | 'follow_up_reminder' | 'payment_failure' | 'appointment_cancelled';
  data: any;
}

export const emailService = {
  /**
   * Send email using configured email service
   */
  async sendEmail(emailData: EmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      console.log('📧 Sending email to:', emailData.to);

      // Check if email service is configured
      const emailProvider = import.meta.env.VITE_EMAIL_PROVIDER || 'console'; // 'nodemailer', 'sendgrid', 'console'
      
      switch (emailProvider) {
        case 'nodemailer':
          return await this.sendWithNodemailer(emailData);
        case 'sendgrid':
          return await this.sendWithSendGrid(emailData);
        case 'console':
        default:
          return await this.sendWithConsole(emailData);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  },

  /**
   * Send email using NodeMailer (for development/self-hosted)
   */
  async sendWithNodemailer(emailData: EmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // This would require NodeMailer to be set up on the backend
      // For now, we'll simulate the process
      
      const smtpConfig = {
        host: import.meta.env.VITE_SMTP_HOST,
        port: import.meta.env.VITE_SMTP_PORT,
        secure: import.meta.env.VITE_SMTP_SECURE === 'true',
        auth: {
          user: import.meta.env.VITE_SMTP_USER,
          pass: import.meta.env.VITE_SMTP_PASS
        }
      };

      if (!smtpConfig.host || !smtpConfig.auth.user) {
        console.warn('⚠️ SMTP configuration incomplete, using console fallback');
        return await this.sendWithConsole(emailData);
      }

      // In a real implementation, you would use NodeMailer here
      console.log('📧 NodeMailer email would be sent:', {
        from: emailData.from || smtpConfig.auth.user,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent
      });

      return { 
        success: true, 
        messageId: `nodemailer-${Date.now()}` 
      };
    } catch (error) {
      console.error('❌ NodeMailer error:', error);
      return { success: false, error: 'NodeMailer failed' };
    }
  },

  /**
   * Send email using SendGrid
   */
  async sendWithSendGrid(emailData: EmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const sendGridApiKey = import.meta.env.VITE_SENDGRID_API_KEY;
      const fromEmail = import.meta.env.VITE_SENDGRID_FROM_EMAIL;

      if (!sendGridApiKey || !fromEmail) {
        console.warn('⚠️ SendGrid configuration incomplete, using console fallback');
        return await this.sendWithConsole(emailData);
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }],
            subject: emailData.subject
          }],
          from: { email: emailData.from || fromEmail },
          content: [
            {
              type: 'text/html',
              value: emailData.htmlContent
            },
            ...(emailData.textContent ? [{
              type: 'text/plain',
              value: emailData.textContent
            }] : [])
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ SendGrid API error:', error);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }

      const messageId = response.headers.get('x-message-id') || `sendgrid-${Date.now()}`;
      console.log('✅ Email sent via SendGrid:', messageId);
      return { success: true, messageId };

    } catch (error) {
      console.error('❌ SendGrid error:', error);
      return { success: false, error: 'SendGrid failed' };
    }
  },

  /**
   * Console logging for development (fallback)
   */
  async sendWithConsole(emailData: EmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    console.log('📧 EMAIL SIMULATION (Console Mode):');
    console.log('=====================================');
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('-------------------------------------');
    console.log('HTML Content:');
    console.log(emailData.htmlContent);
    if (emailData.textContent) {
      console.log('-------------------------------------');
      console.log('Text Content:');
      console.log(emailData.textContent);
    }
    console.log('=====================================');

    return { 
      success: true, 
      messageId: `console-${Date.now()}` 
    };
  },

  /**
   * Send templated email
   */
  async sendTemplatedEmail(template: EmailTemplate, recipientEmail: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const emailContent = await this.generateEmailTemplate(template);
      
      return await this.sendEmail({
        to: recipientEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text
      });
    } catch (error) {
      console.error('❌ Error sending templated email:', error);
      return { success: false, error: 'Failed to send templated email' };
    }
  },

  /**
   * Generate email templates
   */
  async generateEmailTemplate(template: EmailTemplate): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    const clinicName = 'iGabayAtiCare';
    const supportEmail = 'support@igabayaticare.com';

    switch (template.type) {
      case 'appointment_confirmation':
        return {
          subject: 'Appointment Confirmation - iGabayAtiCare',
          html: this.generateAppointmentConfirmationHTML(template.data, clinicName),
          text: this.generateAppointmentConfirmationText(template.data, clinicName)
        };

      case 'payment_confirmation':
        return {
          subject: 'Payment Confirmation - iGabayAtiCare',
          html: this.generatePaymentConfirmationHTML(template.data, clinicName),
          text: this.generatePaymentConfirmationText(template.data, clinicName)
        };

      case 'appointment_reminder':
        return {
          subject: 'Appointment Reminder - iGabayAtiCare',
          html: this.generateAppointmentReminderHTML(template.data, clinicName),
          text: this.generateAppointmentReminderText(template.data, clinicName)
        };

      case 'follow_up_reminder':
        return {
          subject: 'Follow-up Appointment Reminder - iGabayAtiCare',
          html: this.generateFollowUpReminderHTML(template.data, clinicName),
          text: this.generateFollowUpReminderText(template.data, clinicName)
        };

      case 'payment_failure':
        return {
          subject: 'Payment Failed - iGabayAtiCare',
          html: this.generatePaymentFailureHTML(template.data, clinicName, supportEmail),
          text: this.generatePaymentFailureText(template.data, clinicName, supportEmail)
        };

      case 'appointment_cancelled':
        return {
          subject: 'Appointment Cancelled - iGabayAtiCare',
          html: this.generateAppointmentCancelledHTML(template.data, clinicName),
          text: this.generateAppointmentCancelledText(template.data, clinicName)
        };

      default:
        throw new Error(`Unknown email template type: ${template.type}`);
    }
  },

  /**
   * HTML Templates
   */
  generateAppointmentConfirmationHTML(data: any, clinicName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Appointment Confirmed</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your appointment has been successfully booked!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Clinic:</strong> ${data.clinicName}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            <p><strong>Type:</strong> ${data.appointmentType}</p>
            <p><strong>Amount Paid:</strong> ₱${data.amount}</p>
          </div>
          
          <p><strong>Important Reminders:</strong></p>
          <ul>
            <li>Please arrive 15 minutes before your appointment time</li>
            <li>Bring a valid ID and any relevant medical documents</li>
            <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
          </ul>
          
          <p>Thank you for choosing ${clinicName}!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  generatePaymentConfirmationHTML(data: any, clinicName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Payment Confirmed</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your payment has been successfully processed!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <p><strong>Amount:</strong> ₱${data.amount}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Date:</strong> ${data.paymentDate}</p>
          </div>
          
          <p>Your appointment is now confirmed. We look forward to seeing you!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  generateAppointmentReminderHTML(data: any, clinicName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Appointment Reminder</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>This is a reminder about your upcoming appointment:</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3>Appointment Details:</h3>
            <p><strong>Clinic:</strong> ${data.clinicName}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
          </div>
          
          <p>Please remember to arrive 15 minutes early and bring any necessary documents.</p>
          
          <p>See you soon!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  generateFollowUpReminderHTML(data: any, clinicName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Follow-up Appointment Reminder</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your doctor has recommended a follow-up appointment:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Follow-up Details:</h3>
            <p><strong>Recommended Date:</strong> ${data.recommendedDate}</p>
            <p><strong>Type:</strong> ${data.followUpType}</p>
            <p><strong>Fee:</strong> ${data.isFree ? 'FREE' : `₱${data.fee}`}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p>Please schedule your follow-up appointment to ensure continuity of care.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.bookingUrl}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule Appointment</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  generatePaymentFailureHTML(data: any, clinicName: string, supportEmail: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Payment Failed</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Unfortunately, your payment could not be processed.</p>
          
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3>Payment Details:</h3>
            <p><strong>Amount:</strong> ₱${data.amount}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
          
          <p>Please try again or contact our support team for assistance.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.retryUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Try Again</a>
            <a href="mailto:${supportEmail}" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Support</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  generateAppointmentCancelledHTML(data: any, clinicName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6b7280; color: white; padding: 20px; text-align: center;">
          <h1>${clinicName}</h1>
          <h2>Appointment Cancelled</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${data.patientName},</p>
          <p>Your appointment has been cancelled.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Cancelled Appointment:</h3>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          ${data.refundAmount ? `<p>A refund of ₱${data.refundAmount} will be processed within 3-5 business days.</p>` : ''}
          
          <p>We apologize for any inconvenience. Please feel free to book a new appointment at your convenience.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;
  },

  /**
   * Text Templates (simplified versions)
   */
  generateAppointmentConfirmationText(data: any, clinicName: string): string {
    return `
${clinicName} - Appointment Confirmed

Dear ${data.patientName},

Your appointment has been successfully booked!

Appointment Details:
- Clinic: ${data.clinicName}
- Date: ${data.appointmentDate}
- Time: ${data.appointmentTime}
- Type: ${data.appointmentType}
- Amount Paid: ₱${data.amount}

Important Reminders:
- Please arrive 15 minutes before your appointment time
- Bring a valid ID and any relevant medical documents
- If you need to reschedule, please contact us at least 24 hours in advance

Thank you for choosing ${clinicName}!

This is an automated message. Please do not reply to this email.
    `;
  },

  generatePaymentConfirmationText(data: any, clinicName: string): string {
    return `
${clinicName} - Payment Confirmed

Dear ${data.patientName},

Your payment has been successfully processed!

Payment Details:
- Amount: ₱${data.amount}
- Payment Method: ${data.paymentMethod}
- Transaction ID: ${data.transactionId}
- Date: ${data.paymentDate}

Your appointment is now confirmed. We look forward to seeing you!

This is an automated message. Please do not reply to this email.
    `;
  },

  generateAppointmentReminderText(data: any, clinicName: string): string {
    return `
${clinicName} - Appointment Reminder

Dear ${data.patientName},

This is a reminder about your upcoming appointment:

Appointment Details:
- Clinic: ${data.clinicName}
- Date: ${data.appointmentDate}
- Time: ${data.appointmentTime}

Please remember to arrive 15 minutes early and bring any necessary documents.

See you soon!

This is an automated message. Please do not reply to this email.
    `;
  },

  generateFollowUpReminderText(data: any, clinicName: string): string {
    return `
${clinicName} - Follow-up Appointment Reminder

Dear ${data.patientName},

Your doctor has recommended a follow-up appointment:

Follow-up Details:
- Recommended Date: ${data.recommendedDate}
- Type: ${data.followUpType}
- Fee: ${data.isFree ? 'FREE' : `₱${data.fee}`}
${data.reason ? `- Reason: ${data.reason}` : ''}

Please schedule your follow-up appointment to ensure continuity of care.

This is an automated message. Please do not reply to this email.
    `;
  },

  generatePaymentFailureText(data: any, clinicName: string, supportEmail: string): string {
    return `
${clinicName} - Payment Failed

Dear ${data.patientName},

Unfortunately, your payment could not be processed.

Payment Details:
- Amount: ₱${data.amount}
- Reason: ${data.reason}

Please try again or contact our support team at ${supportEmail} for assistance.

This is an automated message. Please do not reply to this email.
    `;
  },

  generateAppointmentCancelledText(data: any, clinicName: string): string {
    return `
${clinicName} - Appointment Cancelled

Dear ${data.patientName},

Your appointment has been cancelled.

Cancelled Appointment:
- Date: ${data.appointmentDate}
- Time: ${data.appointmentTime}
${data.reason ? `- Reason: ${data.reason}` : ''}

${data.refundAmount ? `A refund of ₱${data.refundAmount} will be processed within 3-5 business days.` : ''}

We apologize for any inconvenience. Please feel free to book a new appointment at your convenience.

This is an automated message. Please do not reply to this email.
    `;
  }
};
