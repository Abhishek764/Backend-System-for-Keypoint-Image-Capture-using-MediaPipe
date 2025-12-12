const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
    this.toEmail = process.env.SENDGRID_TO_EMAIL || 'admin@example.com';
    
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  /**
   * Send backup email with ZIP attachment
   */
  async sendBackupEmail(zipPath, date) {
    try {
      if (!this.apiKey) {
        console.warn('SendGrid API key not configured. Skipping email notification.');
        return { success: false, message: 'SendGrid not configured' };
      }

      // Read ZIP file
      const zipBuffer = await fs.readFile(zipPath);
      const zipBase64 = zipBuffer.toString('base64');
      const zipFileName = path.basename(zipPath);

      const msg = {
        to: this.toEmail,
        from: this.fromEmail,
        subject: `Daily DB Backup - ${date}`,
        text: `Daily database backup for ${date} is attached.\n\nBackup file: ${zipFileName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Daily Database Backup</h2>
            <p>Your daily database backup for <strong>${date}</strong> is ready.</p>
            <p><strong>Backup file:</strong> ${zipFileName}</p>
            <p>The ZIP file contains:</p>
            <ul>
              <li>PostgreSQL database export (SQL format)</li>
              <li>MongoDB database export (JSON format)</li>
            </ul>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        `,
        attachments: [
          {
            content: zipBase64,
            filename: zipFileName,
            type: 'application/zip',
            disposition: 'attachment',
          },
        ],
      };

      await sgMail.send(msg);
      console.log(`Backup email sent successfully to ${this.toEmail}`);
      
      return {
        success: true,
        message: 'Email sent successfully',
        recipient: this.toEmail,
      };
    } catch (error) {
      console.error('Email sending error:', error);
      
      // If SendGrid fails, try fallback SMTP (Nodemailer)
      if (error.response) {
        console.error('SendGrid API error:', error.response.body);
      }
      
      throw new Error(`Failed to send backup email: ${error.message}`);
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail() {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const msg = {
        to: this.toEmail,
        from: this.fromEmail,
        subject: 'Test Email - Keypoint Extraction System',
        text: 'This is a test email from the Keypoint Extraction System.',
        html: '<p>This is a test email from the <strong>Keypoint Extraction System</strong>.</p>',
      };

      await sgMail.send(msg);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('Test email error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();

