const backupService = require('../services/backupService');
const emailService = require('../services/emailService');
const cronService = require('../services/cronService');

class BackupController {
  /**
   * Trigger manual backup
   * POST /api/backup/trigger
   */
  async triggerBackup(req, res, next) {
    try {
      const backupResult = await backupService.performBackup();
      const date = new Date().toISOString().split('T')[0];

      // Send email notification
      let emailResult = null;
      try {
        emailResult = await emailService.sendBackupEmail(backupResult.zipPath, date);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Continue even if email fails
      }

      res.json({
        success: true,
        message: 'Backup completed successfully',
        data: {
          backup: backupResult,
          email: emailResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cron job status
   * GET /api/backup/status
   */
  async getBackupStatus(req, res, next) {
    try {
      const status = cronService.getStatus();

      res.json({
        success: true,
        data: {
          cronJobs: status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send test email
   * POST /api/backup/test-email
   */
  async testEmail(req, res, next) {
    try {
      const result = await emailService.sendTestEmail();

      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BackupController();

