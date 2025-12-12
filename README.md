# Video to MP3 Converter - WordPress Plugin

A modern, client-side video to MP3 converter plugin for WordPress. Convert videos to MP3 format directly in the browser using ffmpeg.wasm - no server processing required!

## Features

✨ **100% Client-Side Processing** - All conversion happens in the user's browser  
🚀 **Fast & Free** - No uploads to server, no waiting, no fees  
🔒 **Privacy First** - Your files never leave your device  
🎵 **High Quality** - Convert videos to high-quality MP3 audio  
📱 **Responsive Design** - Works on desktop, tablet, and mobile  
🎨 **Modern UI** - Clean, intuitive interface with smooth animations  

## Requirements

- WordPress 5.0 or higher
- PHP 7.2 or higher
- Modern browser with WebAssembly support (Chrome, Firefox, Safari, Edge)

## Installation

### Method 1: Upload Plugin via WordPress Admin

1. Download the plugin folder as a ZIP file
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin"
4. Choose the ZIP file and click "Install Now"
5. Activate the plugin

### Method 2: Manual Installation

1. Clone or download this repository
2. Upload the `Project01_video2mp3` folder to `/wp-content/plugins/` directory
3. Activate the plugin through the 'Plugins' menu in WordPress

### Method 3: Git Clone (for Development)

```bash
cd /path/to/wordpress/wp-content/plugins/
git clone <repository-url> video-to-mp3-converter
```

## Usage

### Adding the Converter to a Page or Post

1. Create or edit a page/post in WordPress
2. Add the following shortcode where you want the converter to appear:

```
[video_to_mp3]
```

3. Publish or update the page
4. The converter interface will appear on the frontend

### Using the Converter

#### Option 1: Upload a Video File
1. Click the upload area or drag and drop a video file
2. Supported formats: MP4, WebM, AVI, MOV, and more
3. Click "Convert to MP3"
4. Wait for the conversion to complete
5. Download your MP3 file

#### Option 2: Use a Direct Video URL
1. Enter a direct video file URL in the input field
2. Note: Due to CORS restrictions, this works best with:
   - Your own hosted videos
   - URLs that allow cross-origin requests
   - Direct video file links (not YouTube/social media pages)
3. Click "Convert to MP3"
4. Download your MP3 file

### Important Notes

- **YouTube Videos**: Due to CORS restrictions, you cannot directly convert YouTube URLs. Instead:
  1. Download the video first using a YouTube downloader
  2. Upload the downloaded file to the converter
  
- **Large Files**: Very large video files may take longer to process and require more memory

- **Browser Compatibility**: Requires a modern browser with WebAssembly support

## File Structure

```
Project01_video2mp3/
├── assets/
│   ├── css/
│   │   └── style.css          # Plugin styles
│   └── js/
│       └── converter.js       # Main JavaScript logic
├── templates/
│   └── converter-template.php # HTML template
├── .gitignore                 # Git ignore file
├── video-to-mp3-converter.php # Main plugin file
└── README.md                  # This file
```

## Technical Details

### Technologies Used

- **ffmpeg.wasm**: WebAssembly port of FFmpeg for browser-based video processing
- **WordPress Plugin API**: Hooks, shortcodes, and WordPress best practices
- **Modern JavaScript (ES6+)**: Async/await, modules, and modern syntax
- **CSS3**: Custom properties, flexbox, grid, animations
- **HTML5**: Semantic markup, drag-and-drop API, File API

### How It Works

1. **File Input**: User uploads a video file or provides a URL
2. **FFmpeg Loading**: The plugin loads ffmpeg.wasm in the browser
3. **Conversion**: FFmpeg processes the video and extracts audio
4. **MP3 Generation**: Audio is encoded to MP3 format with high quality settings
5. **Download**: The MP3 file is made available for download

### FFmpeg Command Used

```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3
```

- `-i input.mp4`: Input video file
- `-vn`: No video (audio only)
- `-acodec libmp3lame`: Use MP3 encoder
- `-q:a 2`: High quality (0-9 scale, lower is better)

## Customization

### Styling

Edit [assets/css/style.css](assets/css/style.css) to customize the appearance. CSS custom properties at the top of the file allow easy theming:

```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    --error-color: #ef4444;
    /* ... more variables */
}
```

### JavaScript

Edit [assets/js/converter.js](assets/js/converter.js) to modify functionality. Key functions:

- `loadFFmpeg()`: Loads ffmpeg.wasm library
- `convertToMP3()`: Handles the conversion process
- `updateProgress()`: Updates the progress bar

### Template

Edit [templates/converter-template.php](templates/converter-template.php) to modify the HTML structure.

## Development

### Setting Up Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd Project01_video2mp3

# Install in WordPress plugins directory
cp -r . /path/to/wordpress/wp-content/plugins/video-to-mp3-converter/
```

### Git Workflow

```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to remote
git push origin main
```

## Browser Support

- ✅ Chrome 57+
- ✅ Firefox 52+
- ✅ Safari 11+
- ✅ Edge 16+
- ❌ Internet Explorer (not supported)

## Troubleshooting

### "FFmpeg is still loading" error
- Wait a few seconds for ffmpeg.wasm to fully load
- Check your internet connection
- Try refreshing the page

### "Failed to fetch video" error
- Make sure the URL is a direct video file link
- Check if the URL allows CORS requests
- Try uploading the file instead

### Conversion fails
- Ensure the video file is in a supported format
- Check browser console for detailed error messages
- Try with a smaller video file first

### Memory issues with large files
- Use smaller video files (under 500MB recommended)
- Close other browser tabs to free up memory
- Try a different browser

## Performance Tips

1. **Optimal File Size**: Keep videos under 500MB for best performance
2. **Browser Resources**: Close unnecessary tabs before conversion
3. **File Format**: MP4 files typically convert faster
4. **Quality Settings**: Current settings provide excellent quality; adjust in [converter.js](assets/js/converter.js) if needed

## Security

- ✅ No files uploaded to server
- ✅ All processing happens client-side
- ✅ No data collection or tracking
- ✅ WordPress security best practices followed
- ✅ Sanitized inputs and outputs

## Changelog

### Version 1.0.0
- Initial release
- Client-side video to MP3 conversion
- Drag-and-drop file upload
- URL input support
- Progress tracking
- Modern, responsive UI

## License

This plugin is licensed under GPL v2 or later.

## Credits

- **FFmpeg.wasm**: https://github.com/ffmpegwasm/ffmpeg.wasm
- **FFmpeg**: https://ffmpeg.org/

## Support

For issues, questions, or contributions, please visit the repository or contact the developer.

## Roadmap

Future features under consideration:
- [ ] Batch conversion support
- [ ] Additional audio format options (AAC, WAV, etc.)
- [ ] Audio quality selector
- [ ] Trim/cut audio before conversion
- [ ] Audio metadata editing
- [ ] Browser storage for conversion history

---

Made with ❤️ for the WordPress community
