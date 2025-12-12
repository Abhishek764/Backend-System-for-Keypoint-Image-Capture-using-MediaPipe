# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v16+) installed
- ✅ Python (v3.8+) installed
- ✅ PostgreSQL installed and running
- ✅ MongoDB installed and running
- ✅ SendGrid account (for email notifications)

## Step-by-Step Setup

### 1. Install Node.js Dependencies

```bash
cd backend
npm install
```

### 2. Install Python Dependencies

```bash
cd ../mediapipe
pip install -r requirements.txt
```

**Note:** On some systems, you may need to use `pip3` instead of `pip`.

### 3. Setup Databases

#### PostgreSQL

```bash
# Create database
createdb keypoints_db

# Or using psql
psql -U postgres
CREATE DATABASE keypoints_db;
\q
```

#### MongoDB

MongoDB will automatically create the database on first connection. Just ensure MongoDB is running:

```bash
# Start MongoDB (varies by OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 4. Configure Environment Variables

```bash
cd backend
# Copy the example file
cp env.example.txt .env

# Edit .env with your settings
# Use your favorite text editor
```

**Required Environment Variables:**
- `POSTGRES_PASSWORD` - Your PostgreSQL password
- `SENDGRID_API_KEY` - Your SendGrid API key (get from https://app.sendgrid.com/settings/api_keys)
- `SENDGRID_FROM_EMAIL` - Verified sender email in SendGrid
- `SENDGRID_TO_EMAIL` - Email address to receive backup notifications

### 5. Verify Python Installation

Test that Python and MediaPipe are working:

```bash
cd mediapipe
python extract_keypoints.py test_image.jpg
```

If you get an error about missing dependencies, install them:
```bash
pip install -r requirements.txt
```

### 6. Start the Server

```bash
cd backend
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 7. Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

## Troubleshooting

### "Python not found" error
- Ensure Python is in your PATH
- On Windows, you may need to use `python` or `py` instead of `python3`
- Check with: `python --version` or `python3 --version`

### Database connection errors
- Verify PostgreSQL is running: `pg_isready` or check service status
- Verify MongoDB is running: `mongosh` or check service status
- Double-check credentials in `.env` file

### MediaPipe import errors
- Ensure you're using Python 3.8+
- Reinstall dependencies: `pip install --upgrade -r requirements.txt`
- On some systems, you may need: `pip3 install mediapipe opencv-python numpy`

### SendGrid email not working
- Verify API key is correct
- Ensure sender email is verified in SendGrid dashboard
- Check SendGrid account isn't in sandbox mode (or verify recipient email)

## Next Steps

1. Test the `/api/extract-pose` endpoint with a sample image
2. Check that backups are created in the `/backup` directory
3. Verify cron jobs are running (check logs)
4. Test email notifications

## Production Deployment

For production:
1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2: `pm2 start server.js`
3. Configure reverse proxy (nginx/Apache)
4. Use HTTPS
5. Set up proper logging
6. Configure firewall rules
7. Set up database backups (in addition to application backups)

