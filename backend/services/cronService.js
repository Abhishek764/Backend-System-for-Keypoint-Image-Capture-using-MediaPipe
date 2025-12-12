const cron = require('node-cron');
const backupService = require('./backupService');
const emailService = require('./emailService');

class CronService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize and start all cron jobs
   */
  start() {
    // Daily backup at 11:59 PM
    const backupJob = cron.schedule('59 23 * * *', async () => {
      console.log('🔄 Starting scheduled daily backup...');
      try {
        const backupResult = await backupService.performBackup();
        const date = new Date().toISOString().split('T')[0];
        
        // Send email notification
        try {
          await emailService.sendBackupEmail(backupResult.zipPath, date);
          console.log('✅ Backup and email notification completed successfully');
        } catch (emailError) {
          console.error('⚠️ Backup completed but email failed:', emailError.message);
          // Backup succeeded even if email failed
        }
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC',
    });

    this.jobs.push({ name: 'daily-backup', job: backupJob });

    // Optional: Clean old backups weekly (Sundays at 2 AM)
    const cleanupJob = cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Cleaning old backup files...');
      try {
        const daysToKeep = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
        await backupService.cleanOldBackups(daysToKeep);
        console.log('✅ Old backups cleaned successfully');
      } catch (error) {
        console.error('❌ Backup cleanup failed:', error);
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC',
    });

    this.jobs.push({ name: 'backup-cleanup', job: cleanupJob });

    console.log('✅ Cron jobs started successfully');
    console.log('   - Daily backup: 11:59 PM');
    console.log('   - Backup cleanup: Sundays at 2:00 AM');
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs = [];
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    return this.jobs.map(({ name, job }) => ({
      name,
      running: job.running || false,
    }));
  }

  /**
   * Manually trigger backup (for testing)
   */
  async triggerManualBackup() {
    console.log('🔄 Triggering manual backup...');
    try {
      const backupResult = await backupService.performBackup();
      const date = new Date().toISOString().split('T')[0];
      
      await emailService.sendBackupEmail(backupResult.zipPath, date);
      
      return {
        success: true,
        message: 'Manual backup completed successfully',
        backupResult,
      };
    } catch (error) {
      console.error('❌ Manual backup failed:', error);
      throw error;
    }
  }
}

module.exports = new CronService();

