/**
 * DOM Utils for Puzzle Detector Pro
 * Manages DOM element access, UI updates, and event handling
 */
class DOMUtils {
    constructor() {
        // DOM elements cache
        this.elements = {};
        
        // Use fixed piece scale
        this.pieceScale = CONFIG.UI.DEFAULT_PIECE_SCALE;
    }
    
    /**
     * Initialize DOM elements and event handlers
     */
    initialize() {
        this.cacheElements();
        this.setupEventHandlers();
        this.log('DOM Utils initialized');
    }
    
    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        const elements = [
            'upperVideo', 'lowerVideo', 'referenceCanvas', 'detectionCanvas', 
            'upperOverlay', 'lowerOverlay', 'matchIndicator', 'workerStatus',
            'matchOverlay', 'processingIndicator', 'lowerSection', 'upperSection'
        ];
        
        elements.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }
    
    /**
     * Set up all event handlers
     */
    setupEventHandlers() {
        // Reference image capture
        this.elements.upperSection.addEventListener('click', () => {
            // Dispatch capture event
            const captureEvent = new CustomEvent('reference-capture');
            document.dispatchEvent(captureEvent);
        }, { passive: true });
        
        // Reset application
        this.elements.lowerSection.addEventListener('dblclick', () => {
            const resetEvent = new CustomEvent('app-reset');
            document.dispatchEvent(resetEvent);
        }, { passive: true });
    }
    
    // Removed pan, zoom, and piece size control handlers
    
    /**
     * Update worker status
     * @param {string} msg - Message to display
     * @param {string} type - Log type ('info', 'warn', 'error')
     */
    updateStatus(msg, type = 'info') {
        this.elements.workerStatus.textContent = msg;
        
        // Update status color based on type
        switch (type) {
            case 'error':
                this.elements.workerStatus.style.color = '#f55';
                break;
            case 'warn':
                this.elements.workerStatus.style.color = '#ff5';
                break;
            case 'success':
                this.elements.workerStatus.style.color = '#5f5';
                break;
            default:
                this.elements.workerStatus.style.color = '#0f0';
        }
        
        // Console logging based on debug level
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.LOG_LEVEL !== 'info' || type !== 'info') {
            console[type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log'](`[${type.toUpperCase()}] ${msg}`);
        }
    }
    
    /**
     * Show/hide processing indicator
     * @param {boolean} show - Whether to show the indicator
     */
    showProcessingIndicator(show, stats = null) {
        if (show) {
            this.elements.processingIndicator.style.display = 'block';
            if (stats) {
                this.elements.processingIndicator.textContent = 
                    `Avg: ${stats.avgTime.toFixed(1)}ms | FPS: ${stats.fps.toFixed(1)}`;
            }
        } else {
            this.elements.processingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Update match indicator visualization
     * @param {Object} match - Match data
     * @param {number} referenceWidth - Width of reference image
     * @param {number} referenceHeight - Height of reference image
     */
    updateMatchIndicator(match, referenceWidth, referenceHeight) {
        const indicator = this.elements.matchIndicator;
        
        if (match && match.confidence >= CONFIG.DETECTION_THRESHOLD) {
            // Percentage-based positioning
            indicator.style.left = (match.x / referenceWidth * 100) + '%';
            indicator.style.top = (match.y / referenceHeight * 100) + '%';
            indicator.style.width = (match.width / referenceWidth * 100) + '%';
            indicator.style.height = (match.height / referenceHeight * 100) + '%';
            
            // Set rotation
            indicator.style.transform = `rotate(${match.rotation}deg)`;
            
            // Color-coded match outline based on confidence
            const color = this.getMatchColor(match.confidence);
            indicator.style.borderColor = color;
            
            // Add high confidence animation
            if (match.confidence > CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
                indicator.classList.add('match-high-confidence');
            } else {
                indicator.classList.remove('match-high-confidence');
            }
            
            indicator.style.display = 'block';
        } else if (!match) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Get color based on match confidence
     * @param {number} confidence - Match confidence
     * @returns {string} - Color value
     */
    getMatchColor(confidence) {
        if (confidence > CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
            return CONFIG.UI.MATCH_COLORS.HIGH;
        } else if (confidence > CONFIG.MATCH_CONFIDENCE_THRESHOLD) {
            return CONFIG.UI.MATCH_COLORS.MEDIUM;
        } else {
            return CONFIG.UI.MATCH_COLORS.LOW;
        }
    }
    
    /**
     * Update UI elements for reference capture state
     * @param {boolean} captured - Whether reference is captured
     */
    updateReferenceState(captured) {
        if (captured) {
            this.elements.upperOverlay.textContent = 'Reference captured - Tap to recapture';
            this.elements.lowerSection.style.display = 'block';
        } else {
            this.elements.upperOverlay.textContent = 'Tap to capture complete puzzle reference';
            this.elements.lowerSection.style.display = 'none';
            this.elements.matchIndicator.style.display = 'none';
        }
    }
    
    /**
     * Wrapper for logging
     * @param {string} msg - Message to log
     */
    log(msg) {
        if (CONFIG.DEBUG.ENABLED) {
            console.log(`[DOM] ${msg}`);
        }
    }
    
    /**
     * Draw ROI on canvas for debugging
     * @param {Object} roi - Region of interest
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawROI(roi, ctx) {
        if (CONFIG.DEBUG.ENABLED && CONFIG.DEBUG.SHOW_ROI && roi) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
        }
    }
}

// Create global instance
const domUtils = new DOMUtils();