/**
 * Camera Manager for Puzzle Detector Pro
 * Handles camera setup, streaming, and canvas operations
 */
class CameraManager {
    constructor() {
        this.stream = null;
        this.videoTrack = null;
        this.capabilities = null;
        this.referenceImage = null;
        this.referenceWidth = 0;
        this.referenceHeight = 0;
        this.isInitialized = false;
    }
    
    /**
     * Initialize camera stream
     * @returns {Promise} - Promise that resolves when camera is initialized
     */
    async initialize() {
        try {
            // Get DOM elements
            this.upperVideo = domUtils.elements.upperVideo;
            this.lowerVideo = domUtils.elements.lowerVideo;
            this.referenceCanvas = domUtils.elements.referenceCanvas;
            this.detectionCanvas = domUtils.elements.detectionCanvas;
            
            // Set important video attributes
            this.setupVideoElements();
            
            // Set up camera with optimized constraints
            const constraints = {
                video: {
                    facingMode: CONFIG.CAMERA.FACING_MODE,
                    width: CONFIG.CAMERA.WIDTH,
                    height: CONFIG.CAMERA.HEIGHT
                }
            };
            
            // Request camera access with promise-based approach
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Get video track and capabilities
            this.videoTrack = this.stream.getVideoTracks()[0];
            this.capabilities = this.videoTrack.getCapabilities();
            
            // Apply optimal camera settings if available
            this.applyOptimalCameraSettings();
            
            // Set up video streams
            this.upperVideo.srcObject = this.stream;
            this.lowerVideo.srcObject = this.stream;
            
            // Explicitly start playing videos
            await Promise.all([
                this.upperVideo.play().catch(e => console.error("Upper video play error:", e)),
                this.lowerVideo.play().catch(e => console.error("Lower video play error:", e))
            ]);
            
            // Wait for videos to be ready
            await Promise.all([
                this.waitForVideoReady(this.upperVideo),
                this.waitForVideoReady(this.lowerVideo)
            ]);
            
            domUtils.updateStatus(`Camera ready: ${this.videoTrack.getSettings().width}x${this.videoTrack.getSettings().height}`, 'success');
            this.isInitialized = true;
            
            // Set up periodic check to ensure video is still playing
            this.setupVideoPlaybackMonitor();
            
            return true;
        } catch (error) {
            domUtils.updateStatus(`Camera access error: ${error.message}`, 'error');
            console.error('Camera initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Setup video elements with required attributes
     */
    setupVideoElements() {
        // Apply to both videos
        [this.upperVideo, this.lowerVideo].forEach(video => {
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', ''); // Required for iOS
            video.setAttribute('muted', '');
            video.setAttribute('disablePictureInPicture', '');
            
            // Prevent the video from pausing when inactive
            video.onpause = () => {
                video.play().catch(e => console.warn('Auto-resume failed:', e));
            };
        });
    }
    
    /**
     * Sets up a periodic check to ensure videos are playing
     */
    setupVideoPlaybackMonitor() {
        setInterval(() => {
            [this.upperVideo, this.lowerVideo].forEach(video => {
                if (video && video.paused && this.isInitialized) {
                    console.log('Video playback paused, attempting to restart...');
                    video.play().catch(e => console.warn('Failed to restart video:', e));
                }
            });
        }, 2000); // Check every 2 seconds
    }
    
    /**
     * Apply optimal camera settings for puzzle detection
     */
    applyOptimalCameraSettings() {
        if (!this.videoTrack || !this.capabilities) return;
        
        const settings = {};
        
        // Apply focus mode if available (prefer continuous auto focus)
        if (this.capabilities.focusMode && 
            this.capabilities.focusMode.includes('continuous')) {
            settings.focusMode = 'continuous';
        }
        
        // Apply white balance if available
        if (this.capabilities.whiteBalanceMode && 
            this.capabilities.whiteBalanceMode.includes('continuous')) {
            settings.whiteBalanceMode = 'continuous';
        }
        
        // Apply exposure mode if available
        if (this.capabilities.exposureMode && 
            this.capabilities.exposureMode.includes('continuous')) {
            settings.exposureMode = 'continuous';
        }
        
        // Try setting zoom to minimum for widest field of view
        if (this.capabilities.zoom) {
            settings.zoom = this.capabilities.zoom.min;
        }
        
        // Try to apply settings
        try {
            this.videoTrack.applyConstraints({ advanced: [settings] });
        } catch (e) {
            console.warn('Could not apply optimal camera settings:', e);
        }
    }
    
    /**
     * Promise-based wait for video to be ready
     * @param {HTMLVideoElement} video - Video element to wait for
     * @returns {Promise} - Promise that resolves when video is ready
     */
    waitForVideoReady(video) {
        return new Promise((resolve) => {
            // More robust check for video readiness
            const checkVideo = () => {
                // Check if video has valid dimensions and is playing
                if (video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
                    console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
                    resolve();
                } else {
                    // If video is paused, try to play it
                    if (video.paused) {
                        video.play().catch(e => console.warn('Play attempt failed:', e));
                    }
                    // Check again in a moment
                    setTimeout(checkVideo, 100);
                }
            };
            
            // Start checking
            checkVideo();
        });
    }
    
    /**
     * Capture reference image from upper video
     * @returns {ImageData} - Captured reference image data
     */
    captureReferenceImage() {
        const video = this.upperVideo;
        const canvas = this.referenceCanvas;
        
        // Make sure video is playing
        if (video.paused) {
            console.warn('Video paused during capture, attempting to resume');
            video.play().catch(e => console.error('Failed to resume video for capture:', e));
            return null; // Return null to indicate capture failure
        }
        
        // Make sure video has dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.error('Video has no dimensions during capture');
            domUtils.updateStatus('Video stream error - reload page', 'error');
            return null;
        }
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        this.referenceWidth = canvas.width;
        this.referenceHeight = canvas.height;
        
        // Use optimized 2D context settings
        const ctx = canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true // Use desynchronized for better performance
        });
        
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        try {
            this.referenceImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return this.referenceImage;
        } catch (e) {
            console.error('Failed to get image data:', e);
            domUtils.updateStatus('Failed to capture image', 'error');
            return null;
        }
    }
    
    /**
     * Capture puzzle piece template from lower video with adaptive sizing
     * @param {number} scale - Scale factor for template
     * @returns {ImageData} - Captured template image data
     */
    capturePuzzlePieceTemplate(scale = CONFIG.UI.DEFAULT_PIECE_SCALE) {
        const video = this.lowerVideo;
        
        // Safety check for video state
        if (video.paused || video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn('Video not ready during template capture');
            if (video.paused) {
                video.play().catch(e => console.warn('Play attempt failed:', e));
            }
            return null;
        }
        
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        
        // Calculate size based on scale factor
        const templateWidth = Math.floor(video.videoWidth * scale);
        const templateHeight = Math.floor(video.videoHeight * scale);
        
        // Center point of video
        const centerX = Math.floor(video.videoWidth / 2);
        const centerY = Math.floor(video.videoHeight / 2);
        
        // Set canvas size
        canvas.width = templateWidth;
        canvas.height = templateHeight;
        
        // Get optimized 2D context
        const ctx = canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true 
        });
        
        try {
            // Draw the video frame to the canvas
            ctx.drawImage(
                video, 
                Math.floor(centerX - templateWidth/2), 
                Math.floor(centerY - templateHeight/2),
                templateWidth,
                templateHeight,
                0, 0, 
                templateWidth, 
                templateHeight
            );
            
            // Get image data
            return ctx.getImageData(0, 0, templateWidth, templateHeight);
        } catch (e) {
            console.error('Failed to capture template:', e);
            return null;
        }
    }
    
    /**
     * Update detection canvas with current video frame
     */
    updateDetectionCanvas() {
        const video = this.lowerVideo;
        const canvas = this.detectionCanvas;
        
        // Safety check for video state
        if (video.paused || video.videoWidth === 0 || video.videoHeight === 0) {
            if (video.paused) {
                video.play().catch(e => console.warn('Play attempt failed:', e));
            }
            return null;
        }
        
        // Update canvas size if needed
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        
        try {
            // Draw current frame
            const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
            ctx.drawImage(video, 0, 0);
            return ctx;
        } catch (e) {
            console.error('Failed to update detection canvas:', e);
            return null;
        }
    }
    
    /**
     * Release camera resources
     */
    releaseCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.videoTrack = null;
        this.capabilities = null;
        this.isInitialized = false;
    }
    
    /**
     * Get reference image dimensions
     * @returns {Object} - Width and height of reference image
     */
    getReferenceDimensions() {
        return {
            width: this.referenceWidth,
            height: this.referenceHeight
        };
    }
}

// Create global instance
const cameraManager = new CameraManager();