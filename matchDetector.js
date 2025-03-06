/**
 * Match Detector for Puzzle Detector Pro
 * Implements the template matching and puzzle piece detection algorithms
 */
class MatchDetector {
    constructor() {
        // Detection state variables
        this.rotationMode = 'coarse';
        this.lastConfidence = 0;
        this.lastMatchRegion = null;
        this.stableMatchCount = 0;
        this.roi = null;
    }
    
    /**
     * Initialize the detector
     */
    initialize() {
        this.reset();
    }
    
    /**
     * Detect puzzle piece in reference image
     * @param {ImageData} templateImage - Template image data of puzzle piece
     * @returns {Object} - Best match information
     */
    detectPiece(templateImage) {
        if (!imageProcessor.isReady || !imageProcessor.cachedBlurredRef) {
            return null;
        }
        
        try {
            // Process template image
            const template = imageProcessor.processTemplateImage(templateImage);
            if (!template) return null;
            
            // Get optimal parameters based on current state
            const scales = this.getOptimalScales();
            const rotations = this.getRotationAngles();
            
            // Prepare for matching
            let bestMatch = null;
            
            // Define region of interest for focused processing
            let searchROI;
            if (CONFIG.ROI.ENABLED && this.lastMatchRegion && this.lastConfidence > CONFIG.MATCH_CONFIDENCE_THRESHOLD) {
                // Use a tighter ROI when we have high confidence
                const marginFactor = this.lastConfidence > CONFIG.HIGH_CONFIDENCE_THRESHOLD 
                    ? CONFIG.ROI.MARGIN_FACTOR_HIGH 
                    : CONFIG.ROI.MARGIN_FACTOR_LOW;
                
                const margin = Math.floor(Math.max(this.lastMatchRegion.width, this.lastMatchRegion.height) * marginFactor);
                const roiX = Math.max(0, Math.floor(this.lastMatchRegion.x - margin));
                const roiY = Math.max(0, Math.floor(this.lastMatchRegion.y - margin));
                const roiWidth = Math.min(
                    imageProcessor.cachedBlurredRef.cols - roiX, 
                    Math.floor(this.lastMatchRegion.width + 2 * margin)
                );
                const roiHeight = Math.min(
                    imageProcessor.cachedBlurredRef.rows - roiY, 
                    Math.floor(this.lastMatchRegion.height + 2 * margin)
                );
                
                searchROI = { x: roiX, y: roiY, width: roiWidth, height: roiHeight };
                this.roi = searchROI;
            } else {
                searchROI = { 
                    x: 0, 
                    y: 0, 
                    width: imageProcessor.cachedBlurredRef.cols, 
                    height: imageProcessor.cachedBlurredRef.rows 
                };
                this.roi = null;
            }
            
            // Extract the region of interest
            const roiMat = imageProcessor.extractRoi(searchROI);
            if (!roiMat) {
                imageProcessor.cleanupMats([template.mat, template.gray, template.blurred]);
                return null;
            }
            
            // Optimization: Early termination criteria
            let earlyTermination = false;
            let iterationCount = 0;
            
            // Process each rotation in order of likelihood
            for (let rotation of rotations) {
                if (earlyTermination || iterationCount > CONFIG.MATCH.MAX_SEARCH_ITERATIONS) break;
                
                // Rotate the template
                const rotatedTemplate = imageProcessor.rotateImage(template.blurred, rotation);
                
                // Try each scale
                for (let scale of scales) {
                    if (earlyTermination || iterationCount > CONFIG.MATCH.MAX_SEARCH_ITERATIONS) break;
                    iterationCount++;
                    
                    // Get scaled template
                    const scaledTemplate = imageProcessor.resizeTemplate(rotatedTemplate, scale);
                    
                    // Skip invalid sizes
                    if (scaledTemplate.cols >= roiMat.cols || 
                        scaledTemplate.rows >= roiMat.rows || 
                        scaledTemplate.cols <= CONFIG.TEMPLATE.MIN_SIZE || 
                        scaledTemplate.rows <= CONFIG.TEMPLATE.MIN_SIZE) {
                        scaledTemplate.delete();
                        continue;
                    }
                    
                    // Match the template within ROI
                    const minMax = imageProcessor.matchTemplate(roiMat, scaledTemplate);
                    
                    if (minMax.maxVal >= CONFIG.DETECTION_THRESHOLD && 
                        (!bestMatch || minMax.maxVal > bestMatch.confidence)) {
                        
                        // Adjust coordinates based on ROI offset
                        bestMatch = {
                            confidence: minMax.maxVal,
                            scale: scale,
                            rotation: rotation,
                            x: minMax.maxLoc.x + (this.roi ? this.roi.x : 0),
                            y: minMax.maxLoc.y + (this.roi ? this.roi.y : 0),
                            width: scaledTemplate.cols,
                            height: scaledTemplate.rows
                        };
                        
                        // Early termination if we found a very good match
                        if (bestMatch.confidence > CONFIG.EARLY_TERMINATION_THRESHOLD) {
                            earlyTermination = true;
                        }
                    }
                    
                    // Clean up
                    scaledTemplate.delete();
                }
                
                // Clean up rotated template
                rotatedTemplate.delete();
            }
            
            // Clean up
            roiMat.delete();
            imageProcessor.cleanupMats([template.mat, template.gray, template.blurred]);
            
            // Update match stability tracking
            this.updateMatchStability(bestMatch);
            
            return bestMatch;
        } catch (error) {
            console.error('Error in detectPiece:', error);
            return null;
        }
    }
    
    /**
     * Update match stability based on current and last match
     * @param {Object} bestMatch - Current best match
     */
    updateMatchStability(bestMatch) {
        if (bestMatch && bestMatch.confidence >= CONFIG.DETECTION_THRESHOLD) {
            // Track match stability
            if (this.lastMatchRegion) {
                const xDiff = Math.abs(this.lastMatchRegion.x - bestMatch.x);
                const yDiff = Math.abs(this.lastMatchRegion.y - bestMatch.y);
                const sizeDiff = Math.abs(this.lastMatchRegion.width - bestMatch.width);
                const rotDiff = Math.abs(this.lastMatchRegion.rotation - bestMatch.rotation);
                
                // If match is stable, increment counter
                if (xDiff < CONFIG.MATCH.STABLE_POSITION_THRESHOLD && 
                    yDiff < CONFIG.MATCH.STABLE_POSITION_THRESHOLD && 
                    sizeDiff < CONFIG.MATCH.STABLE_SIZE_THRESHOLD && 
                    rotDiff < CONFIG.MATCH.STABLE_ROTATION_THRESHOLD) {
                    this.stableMatchCount = Math.min(CONFIG.MAX_STABLE_COUNT, this.stableMatchCount + 1);
                } else {
                    this.stableMatchCount = Math.max(0, this.stableMatchCount - 1);
                }
            }
            
            // Update match state
            this.lastMatchRegion = bestMatch;
            this.lastConfidence = bestMatch.confidence;
            
            // Adapt rotation mode based on confidence
            this.updateRotationMode();
        } else {
            // Decay confidence if no match
            this.lastConfidence = Math.max(0, this.lastConfidence - 0.1);
            this.stableMatchCount = Math.max(0, this.stableMatchCount - 1);
            
            // Reset to coarse mode if no matches found consistently
            if (this.stableMatchCount === 0 && this.rotationMode !== 'coarse') {
                this.rotationMode = 'coarse';
            }
        }
    }
    
    /**
     * Update rotation mode based on match confidence
     */
    updateRotationMode() {
        if (this.lastConfidence > 0.8 && this.rotationMode === 'coarse') {
            this.rotationMode = 'medium';
        } else if (this.lastConfidence > 0.85 && this.rotationMode === 'medium') {
            this.rotationMode = 'fine';
        }
    }
    
    /**
     * Get optimal rotation angles based on current state
     * @returns {Array} - Array of rotation angles to try
     */
    getRotationAngles() {
        // If we have a stable match, only check small variations
        if (this.lastMatchRegion && 
            this.lastConfidence > CONFIG.HIGH_CONFIDENCE_THRESHOLD && 
            this.stableMatchCount > CONFIG.MAX_STABLE_COUNT / 2) {
            
            // Use just the known good angle with small variations
            const baseAngle = Math.round(this.lastMatchRegion.rotation);
            return [baseAngle];
        }
        
        // Progressive rotation search based on confidence
        switch (this.rotationMode) {
            case 'coarse':
                return CONFIG.ALGORITHM.ROTATIONS.COARSE;
            case 'medium':
                return CONFIG.ALGORITHM.ROTATIONS.MEDIUM;
            case 'fine':
                return CONFIG.ALGORITHM.ROTATIONS.FINE;
            default:
                return CONFIG.ALGORITHM.ROTATIONS.COARSE;
        }
    }
    
    /**
     * Get optimal scales based on current state
     * @returns {Array} - Array of scales to try
     */
    getOptimalScales() {
        // If we have a stable match, use tighter scale range
        if (this.lastMatchRegion && 
            this.lastConfidence > CONFIG.HIGH_CONFIDENCE_THRESHOLD && 
            this.stableMatchCount > CONFIG.MAX_STABLE_COUNT / 2) {
            const baseScale = this.lastMatchRegion.scale;
            // Just use a narrow range around the known good scale
            return [baseScale * 0.95, baseScale, baseScale * 1.05];
        }
        
        // Progressive scale search based on confidence
        switch (this.rotationMode) {
            case 'coarse':
                return CONFIG.ALGORITHM.SCALES.COARSE;
            case 'medium':
                return CONFIG.ALGORITHM.SCALES.MEDIUM;
            case 'fine':
                return CONFIG.ALGORITHM.SCALES.FINE;
            default:
                return CONFIG.ALGORITHM.SCALES.COARSE;
        }
    }
    
    /**
     * Get current region of interest
     * @returns {Object} - Current ROI if available
     */
    getCurrentRoi() {
        return this.roi;
    }
    
    /**
     * Get current match state information
     * @returns {Object} - Current match state
     */
    getMatchState() {
        return {
            rotationMode: this.rotationMode,
            confidence: this.lastConfidence,
            stableCount: this.stableMatchCount,
            lastMatch: this.lastMatchRegion
        };
    }
    
    /**
     * Reset detector state
     */
    reset() {
        this.rotationMode = 'coarse';
        this.lastConfidence = 0;
        this.lastMatchRegion = null;
        this.stableMatchCount = 0;
        this.roi = null;
    }
}

// Create global instance
const matchDetector = new MatchDetector();