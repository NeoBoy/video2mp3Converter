# Video to MP3 Converter - Complete Setup Guide

## Overview

Your converter now supports **two modes**:

1. **Local Files** → Converted in the browser using ffmpeg.wasm (no server needed)
2. **YouTube URLs** → Sent to your microservice for conversion using yt-dlp

## Quick Start

### Step 1: Deploy the Microservice

The microservice handles YouTube video downloads. Choose one of these free options:

#### Option A: Render (Recommended - Free Tier)

1. **Create a Render account** at [render.com](https://render.com)

2. **Push the microservice to GitHub**:
   ```powershell
   cd microservice
   git init
   git add .
   git commit -m "Initial microservice"
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/yourusername/youtube-to-mp3-service.git
   git push -u origin main
   ```

3. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render auto-detects the `render.yaml` file
   - Click "Create Web Service"
   - Wait for deployment (~5-10 minutes)

4. **Copy your service URL**: `https://your-service-name.onrender.com`

#### Option B: Railway

1. Install Railway CLI:
   ```powershell
   npm install -g @railway/cli
   ```

2. Deploy:
   ```powershell
   cd microservice
   railway login
   railway init
   railway up
   ```

3. Get your URL from Railway dashboard

#### Option C: Docker (Local Testing)

```powershell
cd microservice
docker build -t youtube-to-mp3 .
docker run -p 3000:3000 youtube-to-mp3
```

Your service will be at `http://localhost:3000`

### Step 2: Configure WordPress Plugin

1. **Upload plugin to WordPress**:
   - Upload the entire plugin folder to `/wp-content/plugins/`
   - Or zip it and upload via WordPress admin

2. **Activate the plugin**:
   - Go to WordPress Admin → Plugins
   - Activate "Video to MP3 Converter"

3. **Configure the microservice**:
   - Go to Settings → Video to MP3
   - Paste your microservice URL (e.g., `https://your-service.onrender.com`)
   - Click "Save Settings"
   - Verify the green checkmark appears (connection test)

4. **Add to a page**:
   - Edit any page or post
   - Add the shortcode: `[video_to_mp3]`
   - Publish!

## How It Works

### For Local Video Files:
```
User uploads file → ffmpeg.wasm (browser) → MP3 download
```
- 100% client-side
- No server load
- Works even if microservice is down

### For YouTube URLs:
```
User enters URL → Microservice → yt-dlp downloads → Converts to MP3 → Returns download
```
- Requires microservice
- Handles YouTube restrictions
- Better quality for YouTube videos

## Testing

### Test Local Files:
1. Upload any video file (MP4, WebM, etc.)
2. Click "Convert to MP3"
3. Download should work immediately

### Test YouTube:
1. Paste a YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
2. Click "Convert to MP3"
3. Wait for conversion
4. Download the MP3

## Troubleshooting

### "YouTube conversion is not configured"
- The microservice URL is not set in WordPress settings
- Go to Settings → Video to MP3 and add your URL

### Connection test fails (red X)
- Microservice is not running
- URL is incorrect
- Check your deployment logs

### Local files don't work
- Browser doesn't support ffmpeg.wasm
- Try Chrome, Firefox, or Edge (latest versions)
- Check browser console for errors

### YouTube conversion fails
- Invalid YouTube URL
- Video is age-restricted or private
- Microservice timeout (try shorter videos)
- Check microservice logs

## Pantheon Deployment

Since Pantheon doesn't support custom binaries:

1. ✅ **Deploy microservice externally** (Render/Railway)
2. ✅ **Upload WordPress plugin** to Pantheon
3. ✅ **Configure microservice URL** in WordPress settings
4. ✅ **Use the plugin** on your Pantheon site

The WordPress plugin runs entirely client-side (ffmpeg.wasm) for local files, and calls your external microservice for YouTube URLs.

## Cost Analysis

### Free Tier Limits:

**Render Free Tier**:
- 750 hours/month
- Spins down after 15 min of inactivity
- ~5-10 second cold start
- Perfect for low-traffic sites

**Railway Free Tier**:
- $5 credit/month
- ~500 hours execution time
- No sleep mode

**Recommendation**: Start with Render. Upgrade if you get heavy traffic.

## Maintenance

### Update yt-dlp:
The microservice automatically uses the latest yt-dlp version on deployment. To update:

1. Redeploy your service on Render/Railway
2. Or rebuild Docker image: `docker build -t youtube-to-mp3 .`

### Clean up old files:
The microservice automatically:
- Deletes files after download
- Cleans up files older than 1 hour
- Handles cleanup on shutdown

## Security Notes

- ✅ CORS enabled for your WordPress domain
- ✅ YouTube URL validation
- ✅ Filename sanitization
- ✅ Automatic file cleanup
- ✅ No file storage (immediate deletion after download)

## Need Help?

Check these files:
- `microservice/README.md` - Microservice documentation
- `microservice/server.js` - API implementation
- WordPress Admin → Settings → Video to MP3 - Configuration

## Advanced: Environment Variables

If you need to customize the microservice, set these environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

On Render: Add in "Environment" section
On Railway: Add in "Variables" section

## Success Checklist

- [ ] Microservice deployed and URL copied
- [ ] WordPress plugin activated
- [ ] Microservice URL configured in WordPress settings
- [ ] Green checkmark appears in settings (connection verified)
- [ ] Shortcode added to a page
- [ ] Tested with local video file
- [ ] Tested with YouTube URL
- [ ] Both downloads work successfully

Congratulations! Your dual-mode video converter is ready! 🎉
