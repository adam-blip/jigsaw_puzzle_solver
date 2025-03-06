/**
 * Main Application for Puzzle Detector Pro
 * Coordinates components and manages application state
 */
class PuzzleDetectorApp {
    constructor() {
        // Application state
        this.isDetecting = false;
        this.isProcessing = false;
        this.processingTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.skipCounter = 0;
        
        // Performance monitoring
        this.fpsHistory = [];
        this.processingTimeHistory = [];
        this.maxHistoryLength = 30;
        
        // Handle visibility change to manage resources
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }
    
    /**
     * Initialize application
     */
    async initialize() {
        // Initialize components
        domUtils.initialize();
        
        // Wait for OpenCV to be available
        await this.waitForOpenCV();
        
        // Initialize image processor
        if (!imageProcessor.initialize()) {
            console.error('Failed to initialize image processor');
            return false;
        }
        
        // Initialize camera
        if (!(await cameraManager.initialize())) {
            console.error('Failed to initialize camera');
            return false;
        }
        
        // Initialize match detector
        matchDetector.initialize();
        
        // Add event listeners
        this.setupEventListeners();
        
        domUtils.updateStatus('Ready for reference capture', 'success');
        return true;
    }
    
    /**
     * Wait for OpenCV to be available
     * @returns {Promise} - Promise that resolves when OpenCV is ready
     */
    waitForOpenCV() {
        return new Promise((resolve) => {
            const checkInterval = 100;
            const maxInterval = 1000;
            let currentInterval = checkInterval;
            
            const checkOpenCV = () => {
                if (typeof cv !== 'undefined' && cv.Mat) {
                    domUtils.updateStatus('OpenCV loaded, initializing application');
                    resolve();
                } else {
                    currentInterval = Math.min(currentInterval * 1.5, maxInterval);
                    domUtils.updateStatus('Waiting for OpenCV...');
                    setTimeout(checkOpenCV, currentInterval);
                }
            };
            
            checkOpenCV();
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Reference capture event
        document.addEventListener('reference-capture', this.handleReferenceCapture.bind(this));
        
        // Reset application event
        document.addEventListener('app-reset', this.resetApplication.bind(this));
        
        // Page visibility change - pause/resume processing
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle resize events
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle orientation change
        window.addEventListener('orientationchange', this.handleResize.bind(this));
    }
    
    /**
     * Handle visibility change to optimize resource usage
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden (user switched tabs or minimized window)
            console.log('Page hidden, pausing processing');
            this.pauseProcessing();
        } else {
            // Page is visible again
            console.log('Page visible, resuming processing');
            this.resumeProcessing();
        }
    }
    
    /**
     * Pause processing when page is hidden
     */
    pauseProcessing() {
        if (this.isDetecting) {
            this.isDetecting = false;
            domUtils.updateStatus('Processing paused', 'warn');
        }
    }
    
    /**
     * Resume processing when page is visible again
     */
    resumeProcessing() {
        if (!this.isDetecting && cameraManager.isInitialized) {
            // Only resume if we were previously detecting
            if (imageProcessor.cachedRefMat) {
                this.isDetecting = true;
                domUtils.updateStatus('Processing resumed', 'success');
                requestAnimationFrame(this.processDetection.bind(this));
            }
        }
    }
    
    /**
     * Handle resize or orientation change
     */
    handleResize() {
        // Reset performance monitoring when layout changes
        this.fpsHistory = [];
        this.processingTimeHistory = [];
        console.log('Layout changed, resetting performance metrics');
    }
    
    /**
     * Handle reference capture event
     */
    handleReferenceCapture() {
        if (this.isDetecting) {
            this.resetApplication();
            return;
        }
        
        // Capture reference image
        const referenceImage = cameraManager.captureReferenceImage();
        if (!referenceImage) {
            domUtils.updateStatus('Failed to capture reference', 'error');
            return;
        }
        
        // Process reference image
        if (!imageProcessor.processReferenceImage(referenceImage)) {
            domUtils.updateStatus('Failed to process reference', 'error');
            return;
        }
        
        // Update UI
        domUtils.updateReferenceState(true);
        domUtils.updateStatus('Reference captured - Detecting pieces', 'success');
        
        // Start detection
        this.isDetecting = true;
        
        // Reset performance counters
        this.processingTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.skipCounter = 0;
        
        // Start detection processing loop
        requestAnimationFrame(this.processDetection.bind(this));
    }
    
    /**
     * Main detection processing loop
     */
    processDetection() {
        if (!this.isDetecting) {
            return;
        }
        
        // Skip frames to improve performance
        this.skipCounter = (this.skipCounter + 1) % CONFIG.FRAME_SKIP;
        if (this.skipCounter !== 0) {
            requestAnimationFrame(this.processDetection.bind(this));
            return;
        }
        
        // Avoid processing if we're still processing the previous frame
        if (this.isProcessing) {
            requestAnimationFrame(this.processDetection.bind(this));
            return;
        }
        
        this.isProcessing = true;
        const startTime = performance.now();
        
        try {
            // Periodic memory cleanup
            if (this.frameCount % 300 === 0) {
                imageProcessor.cleanupRotationCache();
            }
            
            // Update detection canvas with current video
            const ctx = cameraManager.updateDetectionCanvas();
            if (!ctx) {
                // If we couldn't update the canvas, skip this frame
                this.isProcessing = false;
                requestAnimationFrame(this.processDetection.bind(this));
                return;
            }
            
            // Capture current puzzle piece using the dom-configured scale
            const puzzlePieceTemplate = cameraManager.capturePuzzlePieceTemplate(domUtils.pieceScale);
            if (!puzzlePieceTemplate) {
                // If we couldn't get a template, skip this frame
                this.isProcessing = false;
                requestAnimationFrame(this.processDetection.bind(this));
                return;
            }
            
            // Detect piece in reference image
            const bestMatch = matchDetector.detectPiece(puzzlePieceTemplate);
            
            // Update UI with match result
            this.updateMatchDisplay(bestMatch);
            
            // Update performance statistics
            this.updatePerformanceStats(startTime);
            
            // Increment frame counter
            this.frameCount++;
            
        } catch (error) {
            console.error('Detection error:', error);
            domUtils.updateStatus('Detection Error: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
            
            // Continue processing loop
            requestAnimationFrame(this.processDetection.bind(this));
        }
    }
    
    /**
     * Update match display
     * @param {Object} bestMatch - Best match information
     */
    updateMatchDisplay(bestMatch) {
        const dimensions = cameraManager.getReferenceDimensions();
        
        // Get status message
        let statusMsg;
        if (bestMatch && bestMatch.confidence >= CONFIG.DETECTION_THRESHOLD) {
            statusMsg = `Match: ${(bestMatch.confidence * 100).toFixed(1)}%, ` +
                `Rot: ${bestMatch.rotation.toFixed(0)}°, ` +
                `Scale: ${bestMatch.scale.toFixed(2)}x`;
            
            // Draw ROI for debugging if enabled
            if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.SHOW_ROI) {
                const ctx = domUtils.elements.referenceCanvas.getContext('2d');
                const roi = matchDetector.getCurrentRoi();
                domUtils.drawROI(roi, ctx);
            }
        } else {
            statusMsg = 'No match found';
        }
        
        // Update status
        domUtils.updateStatus(statusMsg);
        
        // Update match indicator
        domUtils.updateMatchIndicator(bestMatch, dimensions.width, dimensions.height);
    }
    
    /**
     * Update performance statistics
     * @param {number} startTime - Start time of processing
     */
    updatePerformanceStats(startTime) {
        const endTime = performance.now();
        const frameTime = endTime - startTime;
        
        // Update processing time history
        this.processingTimeHistory.push(frameTime);
        if (this.processingTimeHistory.length > this.maxHistoryLength) {
            this.processingTimeHistory.shift();
        }
        
        // Calculate average processing time
        const avgTime = this.processingTimeHistory.reduce((a, b) => a + b, 0) / 
                       this.processingTimeHistory.length;
        
        // Calculate FPS
        const timeSinceLastFrame = endTime - this.lastFrameTime;
        this.lastFrameTime = endTime;
        
        const instantFps = 1000 / timeSinceLastFrame;
        this.fpsHistory.push(instantFps);
        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / 
                      this.fpsHistory.length;
        
        // Update UI less frequently for better performance
        if (this.frameCount % CONFIG.PERFORMANCE_UPDATE_INTERVAL === 0) {
            domUtils.showProcessingIndicator(true, {
                avgTime: avgTime,
                fps: avgFps
            });
        }
    }
    
    /**
     * Reset application to initial state
     */
    resetApplication() {
        // Stop detection
        this.isDetecting = false;
        this.isProcessing = false;
        
        // Reset components
        imageProcessor.reset();
        matchDetector.reset();
        
        // Reset UI
        domUtils.updateReferenceState(false);
        domUtils.showProcessingIndicator(false);
        domUtils.updateStatus('Ready for reference capture');
        
        // Reset performance monitoring
        this.processingTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.processingTimeHistory = [];
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PuzzleDetectorApp();
    app.initialize().then(success => {
        if (!success) {
            console.error('Failed to initialize app');
            domUtils.updateStatus('Initialization failed - please reload', 'error');
        }
    }).catch(error => {
        console.error('Initialization error:', error);
        domUtils.updateStatus('Critical error: ' + error.message, 'error');
    });
});