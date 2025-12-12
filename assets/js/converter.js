/**
 * Video to MP3 Converter - Main JavaScript
 * Uses ffmpeg.wasm for client-side video processing
 */

(function() {
    'use strict';

    // State
    let ffmpeg = null;
    let isFFmpegLoaded = false;
    let currentVideoBlob = null;
    let currentFileName = 'audio';

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

        // Check FFmpeg library availability
        console.log('Checking FFmpeg availability...');
        console.log('createFFmpeg function:', typeof createFFmpeg);
        
        // Add a small delay to ensure CDN script is fully loaded
        setTimeout(() => {
            loadFFmpeg();
        }, 500);
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
            
            // Check if createFFmpeg function is available (version 0.11.x)
            if (typeof createFFmpeg === 'undefined') {
                console.error('createFFmpeg function not found');
                throw new Error('FFmpeg library not loaded from CDN. Please check your internet connection and refresh the page.');
            }

            console.log('FFmpeg library found, creating instance...');
            
            // Create FFmpeg instance with logging
            const { createFFmpeg, fetchFile } = FFmpegWASM;
            ffmpeg = createFFmpeg({
                log: true,
                progress: ({ ratio }) => {
                    const percent = Math.round(ratio * 100);
                    if (percent > 0 && percent <= 100) {
                        updateProgress('Converting...', Math.min(50 + percent / 2, 95));
                    }
                }
            });
            
            // Store fetchFile for later use
            window.fetchFile = fetchFile;

            console.log('Loading FFmpeg core...');
            await ffmpeg.load();

            isFFmpegLoaded = true;
            console.log('✅ FFmpeg loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error loading FFmpeg:', error);
            isFFmpegLoaded = false;
            
            let errorMsg = 'Failed to load FFmpeg. ';
            if (error.message && error.message.includes('not loaded from CDN')) {
                errorMsg += 'Please check your internet connection and refresh the page.';
            } else if (error.message && error.message.includes('fetch')) {
                errorMsg += 'Network error - check your internet connection.';
            } else {
                errorMsg += error.message || 'Unknown error occurred.';
            }
            
            showError(errorMsg);
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

            // Write video file to ffmpeg filesystem (version 0.11.x API)
            const inputFileName = 'input.mp4';
            const outputFileName = 'output.mp3';

            updateProgress('Writing file to memory...', 30);
            ffmpeg.FS('writeFile', inputFileName, await window.fetchFile(videoBlob));

            updateProgress('Starting conversion...', 40);

            // Execute ffmpeg command
            // -i input.mp4: input file
            // -vn: no video
            // -acodec libmp3lame: use MP3 codec
            // -q:a 2: high quality (0-9, lower is better)
            // -ar 44100: sample rate
            // -ac 2: stereo
            await ffmpeg.run(
                '-i', inputFileName,
                '-vn',
                '-acodec', 'libmp3lame',
                '-ar', '44100',
                '-ac', '2',
                '-q:a', '2',
                outputFileName
            );

            updateProgress('Reading converted file...', 96);

            // Read the output file
            const data = ffmpeg.FS('readFile', outputFileName);
            
            updateProgress('Creating download...', 98);
            
            // Create blob for download
            const mp3Blob = new Blob([data.buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(mp3Blob);

            // Store for download
            elements.downloadBtn.dataset.url = url;
            elements.downloadBtn.dataset.filename = `${filename}.mp3`;

            // Clean up ffmpeg filesystem
            try {
                ffmpeg.FS('unlink', inputFileName);
                ffmpeg.FS('unlink', outputFileName);
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

        if (url && filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
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

        // Clean up download URL
        if (elements.downloadBtn.dataset.url) {
            URL.revokeObjectURL(elements.downloadBtn.dataset.url);
            delete elements.downloadBtn.dataset.url;
            delete elements.downloadBtn.dataset.filename;
        }

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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
