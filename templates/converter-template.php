<div class="v2mp3-converter-container">
    <div class="v2mp3-header">
        <h2 class="v2mp3-title">
            <svg class="v2mp3-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
            Video to MP3 Converter
        </h2>
        <p class="v2mp3-subtitle">Convert local videos or YouTube videos to MP3 format</p>
    </div>

    <div class="v2mp3-main-content">
        <div class="v2mp3-input-section">
            <label for="videoUrl" class="v2mp3-label">YouTube URL or Direct Video Link</label>
            <div class="v2mp3-input-wrapper">
                <input 
                    type="url" 
                    id="videoUrl" 
                    class="v2mp3-input" 
                    placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                    autocomplete="off"
                />
                <button id="convertBtn" class="v2mp3-button v2mp3-button-primary">
                    <svg class="v2mp3-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                    Convert to MP3
                </button>
            </div>
            <div id="errorMessage" class="v2mp3-error" style="display: none;"></div>
            <div class="v2mp3-info">
                <svg class="v2mp3-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                </svg>
                <span>✨ YouTube URLs supported! Also accepts direct video links and uploaded files.</span>
            </div>
        </div>

        <div id="uploadSection" class="v2mp3-upload-section" style="display: none;">
            <label for="videoFile" class="v2mp3-label">Or upload a video file directly</label>
            <div class="v2mp3-upload-area" id="uploadArea">
                <input type="file" id="videoFile" accept="video/*" class="v2mp3-file-input" />
                <label for="videoFile" class="v2mp3-upload-label">
                    <svg class="v2mp3-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                    <span class="v2mp3-upload-text">Click to upload or drag and drop</span>
                    <span class="v2mp3-upload-subtext">Supports MP4, WebM, AVI, MOV, and more</span>
                </label>
            </div>
        </div>

        <div id="progressSection" class="v2mp3-progress-section" style="display: none;">
            <div class="v2mp3-progress-info">
                <span id="progressStatus" class="v2mp3-progress-status">Initializing...</span>
                <span id="progressPercent" class="v2mp3-progress-percent">0%</span>
            </div>
            <div class="v2mp3-progress-bar">
                <div id="progressFill" class="v2mp3-progress-fill"></div>
            </div>
            <div id="progressDetails" class="v2mp3-progress-details"></div>
        </div>

        <div id="resultSection" class="v2mp3-result-section" style="display: none;">
            <div class="v2mp3-success-message">
                <svg class="v2mp3-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    <path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                </svg>
                <span>Conversion complete!</span>
            </div>
            <button id="downloadBtn" class="v2mp3-button v2mp3-button-success">
                <svg class="v2mp3-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                </svg>
                Download MP3
            </button>
            <button id="convertAnotherBtn" class="v2mp3-button v2mp3-button-secondary">
                Convert Another
            </button>
        </div>
    </div>

    <div class="v2mp3-features">
        <div class="v2mp3-feature">
            <svg class="v2mp3-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
            <h3>100% Private</h3>
            <p>All processing happens in your browser</p>
        </div>
        <div class="v2mp3-feature">
            <svg class="v2mp3-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
            <h3>Fast & Free</h3>
            <p>No uploads, no waiting, no fees</p>
        </div>
        <div class="v2mp3-feature">
            <svg class="v2mp3-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
            <h3>High Quality</h3>
            <p>Get the best audio from your videos</p>
        </div>
    </div>
</div>
