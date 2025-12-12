const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class MediaPipeService {
  constructor() {
    // Resolve Python script path relative to backend directory
    this.pythonScriptPath = path.resolve(
      __dirname,
      '../../mediapipe/extract_keypoints.py'
    );
    
    // Determine Python command (python3 on Unix, python/py on Windows)
    this.pythonCommand = process.env.PYTHON_COMMAND || 
      (process.platform === 'win32' ? 'python' : 'python3');
  }

  /**
   * Extract keypoints from image using MediaPipe
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} imagePath - Optional: path to image file
   * @returns {Promise<Object>} Keypoints data
   */
  async extractKeypoints(imageBuffer, imagePath = null) {
    try {
      let tempFilePath = null;
      
      // If imagePath is not provided, create a temporary file
      if (!imagePath) {
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });
        tempFilePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
        await fs.writeFile(tempFilePath, imageBuffer);
        imagePath = tempFilePath;
      }

      // Get absolute path to Python script
      const scriptPath = this.pythonScriptPath;
      
      // Verify script exists
      try {
        await fs.access(scriptPath);
      } catch (error) {
        throw new Error(`Python script not found at ${scriptPath}`);
      }
      
      // Execute Python script
      const { stdout, stderr } = await execAsync(
        `${this.pythonCommand} "${scriptPath}" "${imagePath}"`
      );

      // Clean up temporary file if created
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }

      if (stderr && !stderr.includes('INFO:')) {
        console.error('Python script stderr:', stderr);
      }

      // Parse JSON output from Python script
      let keypoints;
      try {
        keypoints = JSON.parse(stdout.trim());
      } catch (parseError) {
        throw new Error(`Failed to parse keypoints JSON: ${parseError.message}`);
      }

      // Validate keypoints structure
      if (!keypoints || typeof keypoints !== 'object') {
        throw new Error('Invalid keypoints structure returned from MediaPipe');
      }
      
      return {
        success: true,
        keypoints,
      };
    } catch (error) {
      console.error('MediaPipe extraction error:', error);
      
      // Clean up temp file on error
      if (imagePath && imagePath.includes('temp_')) {
        await fs.unlink(imagePath).catch(() => {});
      }

      throw new Error(`Failed to extract keypoints: ${error.message}`);
    }
  }
}

module.exports = new MediaPipeService();
