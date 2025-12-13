# YouTube to MP3 Microservice

A Node.js microservice that converts YouTube videos to MP3 using yt-dlp.

## Features

- YouTube video to MP3 conversion
- Video information retrieval
- Automatic cleanup of temporary files
- CORS enabled for cross-origin requests
- Health check endpoint

## Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

1. Push this folder to a Git repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your repository
5. Render will auto-detect the `render.yaml` file
6. Click "Create Web Service"

Your service will be available at: `https://your-service-name.onrender.com`

### Option 2: Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

Or use the web dashboard at [railway.app](https://railway.app)

### Option 3: Docker

```bash
# Build the image
docker build -t youtube-to-mp3 .

# Run the container
docker run -p 3000:3000 youtube-to-mp3
```

### Option 4: Local Development

```bash
# Install dependencies
npm install

# Install yt-dlp (macOS/Linux)
pip install yt-dlp

# Or on macOS with Homebrew
brew install yt-dlp

# Run the server
npm start

# Or with auto-reload
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Get Video Info
```
POST /api/info
Body: { "url": "https://www.youtube.com/watch?v=..." }
```

### Convert to MP3
```
POST /api/convert
Body: { "url": "https://www.youtube.com/watch?v=..." }
```

### Download MP3
```
GET /api/download/:jobId
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

## Requirements

- Node.js 18+
- yt-dlp
- ffmpeg

## WordPress Integration

After deploying, update your WordPress plugin settings with your microservice URL:
- Example: `https://your-service-name.onrender.com`

## Notes

- Files are automatically deleted after download
- Old files are cleaned up every hour
- 5-minute timeout for conversions
- Best audio quality (320kbps) by default
