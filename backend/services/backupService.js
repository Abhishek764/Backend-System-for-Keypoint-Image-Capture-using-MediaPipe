const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { pgPool } = require('../config/database');
const Image = require('../models/imageModel');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backup');
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  /**
   * Export PostgreSQL database to SQL file
   */
  async exportPostgreSQL(outputPath) {
    try {
      const {
        POSTGRES_HOST = 'localhost',
        POSTGRES_PORT = 5432,
        POSTGRES_USER = 'postgres',
        POSTGRES_PASSWORD,
        POSTGRES_DB = 'keypoints_db',
      } = process.env;

      // Use pg_dump to export database
      const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
      const connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
      
      const command = `"${pgDumpPath}" "${connectionString}" > "${outputPath}"`;
      
      // Set PGPASSWORD environment variable for Windows compatibility
      const env = { ...process.env };
      if (POSTGRES_PASSWORD) {
        env.PGPASSWORD = POSTGRES_PASSWORD;
      }

      await execAsync(command, { 
        env,
        shell: true,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      return true;
    } catch (error) {
      console.error('PostgreSQL export error:', error);
      // Fallback: Manual export using Node.js
      return await this.exportPostgreSQLManual(outputPath);
    }
  }

  /**
   * Manual PostgreSQL export using Node.js queries
   */
  async exportPostgreSQLManual(outputPath) {
    const client = await pgPool.connect();
    try {
      const result = await client.query('SELECT * FROM keypoints ORDER BY created_at');
      
      const sqlContent = [
        '-- PostgreSQL Database Backup',
        `-- Generated: ${new Date().toISOString()}`,
        '',
        'DROP TABLE IF EXISTS keypoints CASCADE;',
        '',
        `CREATE TABLE keypoints (
          id SERIAL PRIMARY KEY,
          image_id VARCHAR(255) UNIQUE NOT NULL,
          keypoints JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
        '',
        'CREATE INDEX IF NOT EXISTS idx_image_id ON keypoints(image_id);',
        'CREATE INDEX IF NOT EXISTS idx_created_at ON keypoints(created_at);',
        '',
      ];

      for (const row of result.rows) {
        const keypointsJson = JSON.stringify(row.keypoints).replace(/'/g, "''");
        sqlContent.push(
          `INSERT INTO keypoints (id, image_id, keypoints, created_at, updated_at) VALUES ` +
          `(${row.id}, '${row.image_id.replace(/'/g, "''")}', '${keypointsJson}'::jsonb, ` +
          `'${row.created_at.toISOString()}', '${row.updated_at.toISOString()}');`
        );
      }

      await fs.writeFile(outputPath, sqlContent.join('\n'), 'utf8');
      return true;
    } catch (error) {
      console.error('Manual PostgreSQL export error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Export MongoDB collection to JSON file
   */
  async exportMongoDB(outputPath) {
    try {
      const images = await Image.find({});
      
      const exportData = {
        collection: 'images',
        exportDate: new Date().toISOString(),
        count: images.length,
        data: images.map(img => ({
          imageId: img.imageId,
          originalName: img.originalName,
          mimeType: img.mimeType,
          size: img.size,
          imageData: img.imageData.toString('base64'),
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        })),
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('MongoDB export error:', error);
      throw error;
    }
  }

  /**
   * Create ZIP archive of all backups
   */
  async createZipArchive(files, outputPath) {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add files to archive
      files.forEach((file) => {
        if (require('fs').existsSync(file.path)) {
          archive.file(file.path, { name: file.name });
        }
      });

      archive.finalize();
    });
  }

  /**
   * Perform complete backup: SQL + NoSQL + ZIP
   */
  async performBackup() {
    try {
      await this.ensureBackupDir();

      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = Date.now();
      
      const sqlPath = path.join(this.backupDir, `postgresql-${dateStr}-${timestamp}.sql`);
      const mongoPath = path.join(this.backupDir, `mongodb-${dateStr}-${timestamp}.json`);
      const zipPath = path.join(this.backupDir, `${dateStr}-backup.zip`);

      console.log('Starting backup process...');
      
      // Export databases
      console.log('Exporting PostgreSQL...');
      await this.exportPostgreSQL(sqlPath);
      
      console.log('Exporting MongoDB...');
      await this.exportMongoDB(mongoPath);

      // Create ZIP archive
      console.log('Creating ZIP archive...');
      await this.createZipArchive(
        [
          { path: sqlPath, name: `postgresql-${dateStr}.sql` },
          { path: mongoPath, name: `mongodb-${dateStr}.json` },
        ],
        zipPath
      );

      // Clean up individual files (optional - keep them for now)
      // await fs.unlink(sqlPath);
      // await fs.unlink(mongoPath);

      console.log(`Backup completed: ${zipPath}`);
      
      return {
        success: true,
        zipPath,
        sqlPath,
        mongoPath,
        date: dateStr,
      };
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  /**
   * Clean old backup files (keep last N days)
   */
  async cleanOldBackups(daysToKeep = 7) {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }
}

module.exports = new BackupService();

