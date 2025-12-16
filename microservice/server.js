/**
 * YouTube to MP3 Microservice
 * Handles YouTube video downloads and conversion to MP3
 * Uses yt-dlp for downloading
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Add raw body parser with better error handling
app.use(express.json({ 
    verify: (req, res, buf, encoding) => {
        try {
            // Store raw body for debugging
            req.rawBody = buf.toString(encoding || 'utf8');
        } catch (err) {
            console.error('Error storing raw body:', err);
        }
    }
}));

app.use(express.urlencoded({ extended: true }));

// Log incoming requests for debugging
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`${req.method} ${req.path}`);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        if (req.rawBody && req.rawBody !== JSON.stringify(req.body)) {
            console.log('Raw body:', req.rawBody);
        }
    }
    next();
});

// Create temp directory if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Clean up old files periodically (every 5 minutes)
setInterval(async () => {
    try {
        const files = await fs.readdir(TEMP_DIR);
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = await fs.stat(filePath);
            if (stats.mtimeMs < fiveMinutesAgo) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'youtube-to-mp3' });
});

/**
 * Get video info
 */
app.post('/api/info', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidVideoUrl(url)) {
        return res.status(400).json({ error: 'Invalid video URL. Supported: YouTube, Dailymotion, Facebook, Bilibili, Vimeo, and more.' });
    }

    try {
        // Get video info using yt-dlp
        // yt-dlp supports 1000+ sites and will auto-detect the platform
        const { stdout } = await execAsync(
            `yt-dlp --dump-json --no-playlist "${url}"`,
            { maxBuffer: 10 * 1024 * 1024 }
        );

        const info = JSON.parse(stdout);
        
        res.json({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            formats: info.formats?.filter(f => f.acodec !== 'none').length || 0
        });
    } catch (error) {
        console.error('Error getting video info:', error);
        res.status(500).json({ 
            error: 'Failed to get video information',
            details: error.message 
        });
    }
});

/**
 * Convert YouTube video to MP3
 */
app.post('/api/convert', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidVideoUrl(url)) {
        return res.status(400).json({ error: 'Invalid video URL. Supported: YouTube, Dailymotion, Facebook, Bilibili, Vimeo, and more.' });
    }

    const jobId = crypto.randomBytes(16).toString('hex');
    const outputPath = path.join(TEMP_DIR, `${jobId}.mp3`);
    const metadataPath = path.join(TEMP_DIR, `${jobId}.json`);

    try {
        console.log(`Starting conversion for job ${jobId}`);
        
        // First, get video metadata to extract title
        const { stdout: metadataJson } = await execAsync(
            `yt-dlp --dump-json --no-playlist "${url}"`,
            { maxBuffer: 10 * 1024 * 1024 }
        );
        
        const metadata = JSON.parse(metadataJson);
        const videoTitle = metadata.title || 'audio';
        
        // Sanitize filename (remove invalid characters)
        const sanitizedTitle = videoTitle
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 100); // Limit length
        
        // Store metadata for download endpoint
        await fs.writeFile(metadataPath, JSON.stringify({ title: sanitizedTitle }));
        
        // Download and convert to MP3 using yt-dlp
        // -x: extract audio
        // --audio-format mp3: convert to mp3
        // --audio-quality 0: best quality
        // -o: output template
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}" "${url}"`;
        
        await execAsync(command, { 
            maxBuffer: 50 * 1024 * 1024,
            timeout: 5 * 60 * 1000 // 5 minute timeout
        });

        // Check if file exists (yt-dlp might have created it without .mp3 or with different name)
        let fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        let actualPath = outputPath;
        
        if (!fileExists) {
            // Check if yt-dlp created files in temp directory
            console.log(`File not found at expected path: ${outputPath}`);
            const files = await fs.readdir(TEMP_DIR);
            console.log(`Files in temp directory:`, files);
            
            // Look for files matching the jobId
            const matchingFiles = files.filter(f => f.startsWith(jobId));
            if (matchingFiles.length > 0) {
                actualPath = path.join(TEMP_DIR, matchingFiles[0]);
                console.log(`Found file: ${actualPath}`);
                // Rename to expected path
                await fs.rename(actualPath, outputPath);
            } else {
                throw new Error('Conversion completed but file not found');
            }
        }

        const stats = await fs.stat(outputPath);
        console.log(`Conversion successful: ${jobId}, size: ${stats.size} bytes`);
        
        res.json({
            success: true,
            jobId: jobId,
            fileSize: stats.size,
            downloadUrl: `/api/download/${jobId}`
        });

    } catch (error) {
        console.error(`Error converting video (job ${jobId}):`, error);
        
        // Clean up partial files if they exist
        try {
            await fs.unlink(outputPath);
            await fs.unlink(metadataPath);
        } catch {}

        // Provide more helpful error messages
        let errorMessage = 'Failed to convert video';
        let details = error.message;
        
        if (error.message.includes('HTTP Error 429') || error.message.includes('Too Many Requests')) {
            errorMessage = 'Rate limited by video platform';
            details = 'This video platform is blocking automated downloads. Try again later or use a different platform.';
        } else if (error.message.includes('HTTP Error 403') || error.message.includes('Forbidden')) {
            errorMessage = 'Access denied by video platform';
            details = 'This video may require login or is geo-restricted. Try a public video from a different platform.';
        } else if (error.message.includes('Private video') || error.message.includes('requires login')) {
            errorMessage = 'Video requires authentication';
            details = 'This video is private or requires login. Please use a public video.';
        }

        res.status(500).json({ 
            error: errorMessage,
            details: details
        });
    }
});

/**
 * Download converted MP3 file
 */
app.get('/api/download/:jobId', async (req, res) => {
    const { jobId } = req.params;
    
    console.log(`Download requested for job: ${jobId}`);
    
    // Validate jobId format
    if (!/^[a-f0-9]{32}$/.test(jobId)) {
        console.log(`Invalid job ID format: ${jobId}`);
        return res.status(400).json({ error: 'Invalid job ID' });
    }

    const filePath = path.join(TEMP_DIR, `${jobId}.mp3`);
    const metadataPath = path.join(TEMP_DIR, `${jobId}.json`);

    try {
        await fs.access(filePath);
        
        console.log(`File found, preparing download: ${filePath}`);
        
        // Get filename from metadata or use default
        let filename = 'audio.mp3';
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);
            filename = `${metadata.title}.mp3`;
        } catch (error) {
            console.log('Metadata not found, using default filename');
        }
        
        // Get file stats for Content-Length (required for IDM)
        const stats = await fs.stat(filePath);
        
        // Set headers for proper download and IDM compatibility
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Accept-Ranges', 'bytes'); // Enable resumable downloads for IDM
        res.setHeader('Cache-Control', 'no-cache');
        
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

        // Don't delete immediately - let cleanup cycle handle it (files older than 5 minutes)
        // This prevents 404 errors from browser pre-flight requests and IDM
        fileStream.on('end', () => {
            console.log(`Download completed: ${jobId} (will be cleaned up in 5 min cleanup cycle)`);
        });

    } catch (error) {
        console.log(`Download failed for job ${jobId}:`, error.message);
        
        // List files in temp directory for debugging
        try {
            const files = await fs.readdir(TEMP_DIR);
            console.log(`Available files in temp directory:`, files.filter(f => f.includes(jobId)));
        } catch (e) {
            console.log(`Could not list temp directory:`, e.message);
        }
        
        res.status(404).json({ error: 'File not found or expired' });
    }
});

/**
 * Validate video URL from supported platforms
 * Supports: YouTube, Dailymotion, Facebook, Bilibili, Vimeo, TikTok, Twitter, and 1000+ others via yt-dlp
 */
function isValidVideoUrl(url) {
    // Check if it's a valid URL
    try {
        new URL(url);
    } catch {
        return false;
    }
    
    // Common video platform patterns
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i,
        /^(https?:\/\/)?(www\.)?dailymotion\.com\/.+/i,
        /^(https?:\/\/)?(www\.)?facebook\.com\/(.*\/)?(videos|reel)\/.+/i,
        /^(https?:\/\/)?(www\.)?bilibili\.com\/video\/.+/i,
        /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/i,
        /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/i,
        /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/.+/i,
        /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel)\/.+/i
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // Handle JSON parse errors with helpful message
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ 
            error: 'Invalid JSON in request body',
            details: 'Make sure Content-Type is application/json and body is valid JSON',
            received: error.body ? error.body.substring(0, 100) : 'unknown'
        });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

/**
 * Start server
 */
app.listen(PORT, () => {
    console.log(`YouTube to MP3 microservice running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, cleaning up...');
    
    // Clean up temp directory
    try {
        const files = await fs.readdir(TEMP_DIR);
        for (const file of files) {
            await fs.unlink(path.join(TEMP_DIR, file));
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
    
    process.exit(0);
});
