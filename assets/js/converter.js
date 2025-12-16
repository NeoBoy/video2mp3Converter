/**
 * Video to MP3 Converter - Main JavaScript
 * Uses ffmpeg.wasm for client-side video processing
 * Uses external microservice for YouTube downloads
 */

// State
let ffmpeg = null;
let isFFmpegLoaded = false;
let currentVideoBlob = null;
let currentFileName = 'audio';
let microserviceUrl = window.v2mp3Data?.microserviceUrl || '';

// DOM Elements
const elements = {
    videoUrl: null,
    videoFile: null,
    convertBtn: null,
    downloadBtn: null,
    convertAnotherBtn: null,
    uploadArea: null,
    errorMessage: null,
    progressSection: null,
    resultSection: null,
    uploadSection: null,
    progressStatus: null,
    progressPercent: null,
    progressFill: null,
    progressDetails: null
};

/**
 * Initialize the converter
 */
function init() {
    // Get DOM elements
    elements.videoUrl = document.getElementById('videoUrl');
    elements.videoFile = document.getElementById('videoFile');
    elements.convertBtn = document.getElementById('convertBtn');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.convertAnotherBtn = document.getElementById('convertAnotherBtn');
    elements.uploadArea = document.getElementById('uploadArea');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.progressSection = document.getElementById('progressSection');
    elements.resultSection = document.getElementById('resultSection');
    elements.uploadSection = document.getElementById('uploadSection');
    elements.progressStatus = document.getElementById('progressStatus');
    elements.progressPercent = document.getElementById('progressPercent');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressDetails = document.getElementById('progressDetails');

    // Check if elements exist
    if (!elements.convertBtn) {
        console.error('Converter elements not found');
        return;
    }

    // Show upload section
    elements.uploadSection.style.display = 'block';

    // Bind event listeners
    bindEvents();

    // Load ffmpeg
    console.log('Initializing FFmpeg...');
    loadFFmpeg();
}

/**
 * Bind event listeners
 */
function bindEvents() {
    elements.convertBtn.addEventListener('click', handleConvertClick);
    elements.downloadBtn.addEventListener('click', handleDownloadClick);
    elements.convertAnotherBtn.addEventListener('click', resetConverter);
    elements.videoFile.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
}

/**
 * Load ffmpeg.wasm
 */
async function loadFFmpeg() {
    try {
        console.log('Starting FFmpeg load...');
        
        // Check if FFmpeg modules are available
        if (typeof window.FFmpegModule === 'undefined') {
            throw new Error('FFmpeg modules not loaded. Please refresh the page.');
        }

        const { FFmpeg, toBlobURL } = window.FFmpegModule;
        
        console.log('Creating FFmpeg instance...');
        ffmpeg = new FFmpeg();
        
        // Set up logging
        ffmpeg.on('log', ({ message }) => {
            console.log('[FFmpeg]:', message);
        });

        // Set up progress tracking
        ffmpeg.on('progress', ({ progress }) => {
            const percent = Math.round(progress * 100);
            if (percent > 0 && percent <= 100) {
                updateProgress('Converting...', percent);
            }
        });

        console.log('Loading FFmpeg core...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const workerURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js';
        
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(workerURL, 'text/javascript'),
        });

        isFFmpegLoaded = true;
        console.log('✅ FFmpeg loaded successfully! Ready to convert videos.');
        
    } catch (error) {
        console.error('❌ Error loading FFmpeg:', error);
        isFFmpegLoaded = false;
        showError(`Failed to load FFmpeg: ${error.message}. Please refresh the page and try again.`);
    }
}

    /**
     * Handle convert button click
     */
    async function handleConvertClick() {
        hideError();
        
        const url = elements.videoUrl.value.trim();
        
        if (!url && !currentVideoBlob) {
            showError('Please enter a video URL or upload a file');
            return;
        }

        // Check if it's a YouTube URL
        if (url && isYouTubeUrl(url)) {
            if (!microserviceUrl) {
                showError('YouTube conversion is not configured. Please contact the site administrator.');
                return;
            }
            await convertYouTubeVideo(url);
            return;
        }

        if (!isFFmpegLoaded) {
            showError('FFmpeg is still loading. Please wait a moment and try again.');
            return;
        }

        if (currentVideoBlob) {
            // Convert uploaded file
            await convertToMP3(currentVideoBlob, currentFileName);
        } else if (url) {
            // Try to fetch from URL
            await fetchAndConvert(url);
        }
    }

    /**
     * Fetch video from URL and convert
     */
    async function fetchAndConvert(url) {
        try {
            elements.convertBtn.disabled = true;
            updateProgress('Fetching video...', 10);
            elements.progressSection.style.display = 'block';

            // Validate URL
            if (!isValidUrl(url)) {
                throw new Error('Please enter a valid URL');
            }

            // Extract filename from URL
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const filename = pathParts[pathParts.length - 1] || 'video';
            currentFileName = filename.replace(/\.[^/.]+$/, ''); // Remove extension

            // Fetch video
            const response = await fetch(url, {
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video. The URL might not be accessible or CORS is blocking the request.');
            }

            updateProgress('Downloading video...', 30);
            const blob = await response.blob();
            
            await convertToMP3(blob, currentFileName);

        } catch (error) {
            console.error('Error fetching video:', error);
            showError(error.message || 'Failed to fetch video. For YouTube videos, please download the video first and upload it directly.');
            resetUI();
        }
    }

    /**
     * Convert video blob to MP3
     */
    async function convertToMP3(videoBlob, filename) {
        try {
            updateProgress('Preparing conversion...', 20);

            // File names
            const inputFileName = 'input.mp4';
            const outputFileName = 'output.mp3';

            updateProgress('Writing file to memory...', 30);
            
            // Convert blob to Uint8Array for FFmpeg 0.12.x
            const videoData = new Uint8Array(await videoBlob.arrayBuffer());
            await ffmpeg.writeFile(inputFileName, videoData);

            updateProgress('Starting conversion...', 40);

            // Execute ffmpeg command (new API uses exec instead of run)
            // -i input.mp4: input file
            // -vn: no video
            // -acodec libmp3lame: use MP3 codec
            // -q:a 2: high quality (0-9, lower is better)
            // -ar 44100: sample rate
            // -ac 2: stereo
            await ffmpeg.exec([
                '-i', inputFileName,
                '-vn',
                '-acodec', 'libmp3lame',
                '-ar', '44100',
                '-ac', '2',
                '-q:a', '2',
                outputFileName
            ]);

            updateProgress('Reading converted file...', 96);

            // Read the output file (new API)
            const data = await ffmpeg.readFile(outputFileName);
            
            updateProgress('Creating download...', 98);
            
            // Create blob for download
            const mp3Blob = new Blob([data.buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(mp3Blob);

            // Store for download
            elements.downloadBtn.dataset.url = url;
            elements.downloadBtn.dataset.filename = `${filename}.mp3`;

            // Clean up ffmpeg filesystem
            try {
                await ffmpeg.deleteFile(inputFileName);
                await ffmpeg.deleteFile(outputFileName);
            } catch (e) {
                console.warn('Error cleaning up files:', e);
            }

            updateProgress('Complete!', 100);
            showResult();

        } catch (error) {
            console.error('Error converting video:', error);
            showError('Failed to convert video. Make sure the file is a valid video format.');
            resetUI();
        }
    }

    /**
     * Handle file selection
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    /**
     * Handle drag over
     */
    function handleDragOver(event) {
        event.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--primary-color)';
        elements.uploadArea.style.background = 'white';
    }

    /**
     * Handle drag leave
     */
    function handleDragLeave(event) {
        event.preventDefault();
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.background = '';
    }

    /**
     * Handle file drop
     */
    function handleDrop(event) {
        event.preventDefault();
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.background = '';

        const file = event.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }

    /**
     * Process selected file
     */
    function processFile(file) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            showError('Please select a valid video file');
            return;
        }

        currentVideoBlob = file;
        currentFileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        
        hideError();
        
        // Update UI to show file is selected
        const uploadText = elements.uploadArea.querySelector('.v2mp3-upload-text');
        uploadText.textContent = `Selected: ${file.name}`;
        uploadText.style.color = 'var(--success-color)';
        
        // Enable convert button
        elements.convertBtn.disabled = false;
    }

    /**
     * Handle download click
     */
    function handleDownloadClick() {
        const url = elements.downloadBtn.dataset.url;
        const filename = elements.downloadBtn.dataset.filename;
        const isExternal = elements.downloadBtn.dataset.external === 'true';

        if (url && filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            if (isExternal) {
                a.target = '_blank'; // Open in new tab for external URLs
            }
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    /**
     * Update progress
     */
    function updateProgress(status, percent) {
        if (elements.progressStatus) {
            elements.progressStatus.textContent = status;
        }
        if (elements.progressPercent) {
            elements.progressPercent.textContent = `${percent}%`;
        }
        if (elements.progressFill) {
            elements.progressFill.style.width = `${percent}%`;
        }
    }

    /**
     * Show result
     */
    function showResult() {
        elements.progressSection.style.display = 'none';
        elements.resultSection.style.display = 'block';
        elements.convertBtn.disabled = false;
    }

    /**
     * Reset converter
     */
    function resetConverter() {
        // Reset state
        currentVideoBlob = null;
        currentFileName = 'audio';
        elements.videoUrl.value = '';
        elements.videoFile.value = '';

        // Reset UI
        elements.progressSection.style.display = 'none';
        elements.resultSection.style.display = 'none';
        elements.convertBtn.disabled = false;
        
        // Reset upload text
        const uploadText = elements.uploadArea.querySelector('.v2mp3-upload-text');
        uploadText.textContent = 'Click to upload or drag and drop';
        uploadText.style.color = '';

        // Clean up download URL (only if it's a blob URL)
        if (elements.downloadBtn.dataset.url && !elements.downloadBtn.dataset.external) {
            URL.revokeObjectURL(elements.downloadBtn.dataset.url);
        }
        delete elements.downloadBtn.dataset.url;
        delete elements.downloadBtn.dataset.filename;
        delete elements.downloadBtn.dataset.external;

        hideError();
    }

    /**
     * Reset UI after error
     */
    function resetUI() {
        elements.progressSection.style.display = 'none';
        elements.convertBtn.disabled = false;
    }

    /**
     * Show error message
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
    }

    /**
     * Hide error message
     */
    function hideError() {
        elements.errorMessage.style.display = 'none';
    }

    /**
     * Validate URL
     */
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Check if URL is a YouTube URL
     */
    function isYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+/i,
            /^(https?:\/\/)?(www\.)?youtu\.be\/.+/i
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * Convert YouTube video using microservice
     */
    async function convertYouTubeVideo(url) {
        try {
            elements.convertBtn.disabled = true;
            updateProgress('Connecting to conversion service...', 10);
            elements.progressSection.style.display = 'block';

            // Get video info first
            updateProgress('Fetching video information...', 20);
            const infoResponse = await fetch(`${microserviceUrl}/api/info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!infoResponse.ok) {
                const error = await infoResponse.json();
                throw new Error(error.error || 'Failed to get video information');
            }

            const videoInfo = await infoResponse.json();
            currentFileName = sanitizeFilename(videoInfo.title || 'youtube-audio');
            
            updateProgress(`Converting: ${videoInfo.title}...`, 40);

            // Start conversion
            const convertResponse = await fetch(`${microserviceUrl}/api/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!convertResponse.ok) {
                const error = await convertResponse.json();
                throw new Error(error.error || 'Failed to convert video');
            }

            const result = await convertResponse.json();
            
            updateProgress('Preparing download...', 90);

            // Set download URL
            const downloadUrl = `${microserviceUrl}${result.downloadUrl}`;
            elements.downloadBtn.dataset.url = downloadUrl;
            elements.downloadBtn.dataset.filename = `${currentFileName}.mp3`;
            elements.downloadBtn.dataset.external = 'true';

            updateProgress('Complete!', 100);
            showResult();

        } catch (error) {
            console.error('Error converting YouTube video:', error);
            showError(error.message || 'Failed to convert YouTube video. Please try again.');
            resetUI();
        }
    }

    /**
     * Sanitize filename
     */
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .substring(0, 100); // Limit length
    }

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
