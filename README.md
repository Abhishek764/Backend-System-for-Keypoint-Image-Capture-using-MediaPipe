# Keypoint Extraction System - Backend API

A production-grade full-stack backend system for extracting body keypoints from images using MediaPipe Pose, with complete CRUD operations, automated daily backups, and email notifications.

## 🚀 Features

- **MediaPipe Pose Detection**: Extract 33 body keypoints from images
- **Dual Database Storage**: 
  - PostgreSQL for keypoints data (SQL)
  - MongoDB for original images (NoSQL)
- **RESTful API**: Full CRUD operations for keypoints and images
- **Automated Backups**: Daily cron job at 11:59 PM to backup both databases
- **Email Notifications**: SendGrid integration for backup confirmations
- **Production Ready**: Error handling, logging, validation, and graceful shutdown

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **PostgreSQL** (v12 or higher)
- **MongoDB** (v4.4 or higher)
- **SendGrid Account** (for email notifications)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Smartan
```

### 2. Install Node.js Dependencies

```bash
cd backend
npm install
```

### 3. Install Python Dependencies

```bash
cd ../mediapipe
pip install -r requirements.txt
```

### 4. Database Setup

#### PostgreSQL Setup

```bash
# Create database
createdb keypoints_db

# Or using psql
psql -U postgres
CREATE DATABASE keypoints_db;
```

#### MongoDB Setup

```bash
# MongoDB will create the database automatically on first connection
# Ensure MongoDB is running
mongod
```

### 5. Environment Configuration

Copy the example environment file and configure it:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=production

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=keypoints_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/images_db

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TO_EMAIL=admin@yourdomain.com

# Backup
BACKUP_RETENTION_DAYS=7
```

### 6. SendGrid Setup

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key in Settings > API Keys
3. Add the API key to your `.env` file
4. Verify your sender email address

## 🏃 Running the Application

### Development Mode

```bash
cd backend
npm run dev
```

### Production Mode

```bash
cd backend
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📡 API Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Extract Pose Keypoints

```http
POST /api/extract-pose
Content-Type: multipart/form-data
```

**Request:**
- `image` (file): Image file (max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "imageId": "uuid",
    "keypoints": {
      "landmarks": [...],
      "visibility": [...],
      "presence": [...],
      "detected": true,
      "total_keypoints": 33
    },
    "image": {
      "id": "...",
      "originalName": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 12345,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Keypoints CRUD

#### Get All Keypoints
```http
GET /api/keypoints?page=1&limit=10
```

#### Get Keypoint by ID
```http
GET /api/keypoints/:id
```

#### Get Keypoint by Image ID
```http
GET /api/keypoints/image/:imageId
```

#### Update Keypoint
```http
PUT /api/keypoints/image/:imageId
Content-Type: application/json

{
  "keypoints": {...}
}
```

#### Delete Keypoint
```http
DELETE /api/keypoints/:id
DELETE /api/keypoints/image/:imageId
```

### Images CRUD

#### Get All Images
```http
GET /api/images?page=1&limit=10
```

#### Get Image by ID
```http
GET /api/images/:imageId
```

#### Get Image Metadata
```http
GET /api/images/:imageId/metadata
```

#### Update Image
```http
PUT /api/images/:imageId
Content-Type: application/json

{
  "originalName": "new-name.jpg"
}
```

#### Delete Image
```http
DELETE /api/images/:imageId
```

### Backup Operations

#### Trigger Manual Backup
```http
POST /api/backup/trigger
```

#### Get Backup Status
```http
GET /api/backup/status
```

#### Send Test Email
```http
POST /api/backup/test-email
```

## 🔄 Cron Jobs

The system includes automated cron jobs:

- **Daily Backup**: Runs at 11:59 PM daily
  - Exports PostgreSQL database to SQL file
  - Exports MongoDB database to JSON file
  - Creates ZIP archive: `/backup/yyyy-mm-dd-backup.zip`
  - Sends email notification with ZIP attachment

- **Backup Cleanup**: Runs on Sundays at 2:00 AM
  - Removes backup files older than configured retention days (default: 7 days)

## 📦 Backup Files

Backups are stored in the `/backup` directory:

```
backup/
├── 2024-01-01-backup.zip
├── 2024-01-02-backup.zip
└── ...
```

Each ZIP file contains:
- `postgresql-YYYY-MM-DD.sql` - PostgreSQL database export
- `mongodb-YYYY-MM-DD.json` - MongoDB database export

## 🧪 Testing with Postman/cURL

### Extract Pose from Image

```bash
curl -X POST http://localhost:3000/api/extract-pose \
  -F "image=@/path/to/image.jpg"
```

### Get All Keypoints

```bash
curl http://localhost:3000/api/keypoints?page=1&limit=10
```

### Trigger Manual Backup

```bash
curl -X POST http://localhost:3000/api/backup/trigger
```

## 📁 Project Structure

```
Smartan/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connections
│   ├── controllers/
│   │   ├── poseController.js    # Pose extraction & keypoints CRUD
│   │   ├── imageController.js   # Images CRUD
│   │   └── backupController.js  # Backup operations
│   ├── models/
│   │   └── imageModel.js        # MongoDB image model
│   ├── routes/
│   │   └── api.js               # API routes
│   ├── services/
│   │   ├── mediapipeService.js  # MediaPipe integration
│   │   ├── keypointService.js   # PostgreSQL keypoints service
│   │   ├── imageService.js      # MongoDB images service
│   │   ├── backupService.js     # Backup operations
│   │   ├── emailService.js      # SendGrid email service
│   │   └── cronService.js       # Cron job management
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
├── mediapipe/
│   ├── extract_keypoints.py     # Python MediaPipe script
│   └── requirements.txt         # Python dependencies
├── backup/                      # Backup files directory (auto-created)
└── README.md
```

## 🔒 Security Considerations

- Store sensitive credentials in `.env` file (never commit to version control)
- Use strong database passwords
- Configure CORS appropriately for production
- Implement rate limiting for production use
- Use HTTPS in production
- Validate and sanitize all inputs

## 🐛 Troubleshooting

### MediaPipe Not Working

- Ensure Python 3.8+ is installed
- Install Python dependencies: `pip install -r mediapipe/requirements.txt`
- Check Python path in environment variables
- Verify image file format is supported (JPEG, PNG)

### Database Connection Issues

- Verify PostgreSQL and MongoDB are running
- Check connection credentials in `.env`
- Ensure databases exist and user has proper permissions

### Email Not Sending

- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Review SendGrid dashboard for delivery status

### Backup Failures

- Ensure `/backup` directory is writable
- Check disk space availability
- Verify `pg_dump` is in PATH (or set `PG_DUMP_PATH`)

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js, Express, MediaPipe, PostgreSQL, and MongoDB**

