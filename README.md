# Video to MP3 Converter - WordPress Plugin

Convert video files and YouTube videos to MP3 format. Local files are processed in the browser (100% client-side), while YouTube URLs are handled by an optional external microservice.

## ✨ Features

- **Dual-Mode Conversion**
  - 🎬 Local video files → Browser-based (ffmpeg.wasm)
  - 🎥 YouTube URLs → Microservice-based (yt-dlp)
- **Privacy-Friendly** - Local files never leave the browser
- **No Server Load** - Client-side processing for uploads
- **High Quality** - 320kbps MP3 output
- **Modern UI** - Responsive design with drag & drop
- **Progress Tracking** - Real-time conversion status
- **Pantheon Compatible** - Works on restricted WordPress hosting

## 📋 Requirements

- WordPress 5.0+
- PHP 7.4+
- Modern browser (Chrome, Firefox, Edge, Safari)
- Optional: Node.js microservice for YouTube support

## 🚀 Quick Start

### 1. Install Plugin

Upload to `/wp-content/plugins/video-to-mp3-converter/` and activate.

### 2. Add Shortcode

```
[video_to_mp3]
```

### 3. Configure YouTube (Optional)

1. Deploy the `microservice/` folder (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))
2. Go to Settings → Video to MP3
3. Enter your microservice URL
4. Save

## 📁 Structure

```
├── video-to-mp3-converter.php    # Main plugin
├── assets/
│   ├── css/style.css              # Styles
│   └── js/converter-legacy.js     # FFmpeg 0.11.6 (production)
├── templates/
│   └── converter-template.php    # UI template
├── microservice/                  # YouTube conversion service
│   ├── server.js                  # Node.js/Express + yt-dlp
│   ├── Dockerfile                 # Docker config
│   └── render.yaml                # Render deployment
├── demo.html                      # Standalone demo
├── DEPLOYMENT_GUIDE.md           # Full setup guide
└── README.md                      # This file
```

## 🎯 Supported Formats

**Local Files:** MP4, WebM, MKV, AVI, MOV, FLV  
**YouTube:** Standard and short URLs (single videos only)

## ⚙️ Configuration

**WordPress Admin → Settings → Video to MP3**

- Microservice URL: Your deployed service endpoint
- Connection test automatically verifies setup

## 🔧 Development

### Local Testing

```bash
# Start development server
python3 server.py
# or with WSL
wsl python3 server.py

# Open http://localhost:8000/demo.html
```

### Testing Files

- `demo.html` - Standalone converter demo
- `simple-test.html` - Basic FFmpeg test
- `test-ffmpeg-012.html` - 0.12.x compatibility test

## 🐛 Troubleshooting

**Local files won't convert**
- Use a modern browser
- Check console for errors
- Try a smaller file first

**YouTube fails**
- Verify microservice URL in settings
- Check microservice health endpoint
- Ensure video is public

## 📊 Technical Details

- **FFmpeg**: Version 0.11.6 (browser compatibility)
- **Processing**: Client-side for local, server-side for YouTube
- **Memory**: ~2-3x video file size for browser conversion
- **Timeout**: 5 minutes for YouTube conversions

## 🔒 Security

- Local files: Never uploaded, processed in-browser
- YouTube files: Deleted immediately after download
- Automatic cleanup: Files removed after 1 hour
- Input validation: URL and file type checking

## 📝 Changelog

### v2.0.0
- Added YouTube URL support
- Switched to FFmpeg 0.11.6 for reliability
- Added admin settings page
- Improved error handling
- Multiple deployment options

### v1.0.0
- Initial release
- Browser-based conversion
- Drag & drop upload

## 📄 License

GPL v2 or later

## 🆘 Support

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup instructions.

---

**Built with FFmpeg.wasm and yt-dlp**
