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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create temp directory if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Clean up old files periodically (every hour)
setInterval(async () => {
    try {
        const files = await fs.readdir(TEMP_DIR);
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = await fs.stat(filePath);
            if (stats.mtimeMs < oneHourAgo) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
}, 60 * 60 * 1000);

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

    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        // Get video info using yt-dlp with Node.js runtime
        const { stdout } = await execAsync(
            `yt-dlp --dump-json --no-playlist --extractor-args "youtube:player_client=web" --js-runtimes node "${url}"`,
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

    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const jobId = crypto.randomBytes(16).toString('hex');
    const outputPath = path.join(TEMP_DIR, `${jobId}.mp3`);

    try {
        console.log(`Starting conversion for job ${jobId}`);
        
        // Download and convert to MP3 using yt-dlp
        // -x: extract audio
        // --audio-format mp3: convert to mp3
        // --audio-quality 0: best quality
        // -o: output template
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist --extractor-args "youtube:player_client=web" --js-runtimes node -o "${outputPath}" "${url}"`;
        
        await execAsync(command, { 
            maxBuffer: 50 * 1024 * 1024,
            timeout: 5 * 60 * 1000 // 5 minute timeout
        });

        // Check if file exists
        const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
        
        if (!fileExists) {
            throw new Error('Conversion completed but file not found');
        }

        const stats = await fs.stat(outputPath);
        
        res.json({
            success: true,
            jobId: jobId,
            fileSize: stats.size,
            downloadUrl: `/api/download/${jobId}`
        });

    } catch (error) {
        console.error(`Error converting video (job ${jobId}):`, error);
        
        // Clean up partial file if exists
        try {
            await fs.unlink(outputPath);
        } catch {}

        res.status(500).json({ 
            error: 'Failed to convert video',
            details: error.message 
        });
    }
});

/**
 * Download converted MP3 file
 */
app.get('/api/download/:jobId', async (req, res) => {
    const { jobId } = req.params;
    
    // Validate jobId format
    if (!/^[a-f0-9]{32}$/.test(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
    }

    const filePath = path.join(TEMP_DIR, `${jobId}.mp3`);

    try {
        await fs.access(filePath);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="audio-${jobId}.mp3"`);
        
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

        // Delete file after sending
        fileStream.on('end', async () => {
            try {
                await fs.unlink(filePath);
                console.log(`Cleaned up file after download: ${jobId}`);
            } catch (error) {
                console.error(`Error deleting file ${jobId}:`, error);
            }
        });

    } catch (error) {
        res.status(404).json({ error: 'File not found or expired' });
    }
});

/**
 * Validate YouTube URL
 */
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i,
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+/i,
        /^(https?:\/\/)?(www\.)?youtu\.be\/.+/i
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
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
