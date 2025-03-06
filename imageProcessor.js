/**
 * Image Processor for Puzzle Detector Pro
 * Handles OpenCV operations, image transformations, and optimization strategies
 */
class ImageProcessor {
    constructor() {
        // Cached OpenCV objects to prevent reallocation
        this.cachedRefMat = null;
        this.cachedRefGray = null;
        this.cachedBlurredRef = null;
        
        // Rotation cache for frequently used angles
        this.rotationCache = {};
        
        // Last cleanup time for memory management
        this.lastCleanupTime = Date.now();
        
        // Flag to check if OpenCV is ready
        this.isReady = false;
    }
    
    /**
     * Initialize the image processor with OpenCV
     */
    initialize() {
        if (typeof cv !== 'undefined' && cv.Mat) {
            this.isReady = true;
            domUtils.updateStatus('OpenCV ready', 'success');
            return true;
        } else {
            domUtils.updateStatus('OpenCV not loaded', 'error');
            return false;
        }
    }
    
    /**
     * Process reference image for matching
     * @param {ImageData} referenceImage - Reference image data
     */
    processReferenceImage(referenceImage) {
        if (!this.isReady || !referenceImage) return false;
        
        try {
            // Clean up previous Mats
            this.cleanupRefMats();
            
            // Create new reference Mats
            this.cachedRefMat = cv.matFromImageData(referenceImage);
            this.cachedRefGray = new cv.Mat();
            this.cachedBlurredRef = new cv.Mat();
            
            // Convert to grayscale and blur for faster template matching
            cv.cvtColor(this.cachedRefMat, this.cachedRefGray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(
                this.cachedRefGray, 
                this.cachedBlurredRef, 
                CONFIG.ALGORITHM.BLUR_SIZE, 
                CONFIG.ALGORITHM.BLUR_SIGMA
            );
            
            return true;
        } catch (error) {
            console.error('Error processing reference image:', error);
            domUtils.updateStatus('Reference processing error', 'error');
            return false;
        }
    }
    
    /**
     * Process puzzle piece template for matching
     * @param {ImageData} templateImage - Template image data
     * @returns {Object} - Processed template data { mat, gray, blurred }
     */
    processTemplateImage(templateImage) {
        if (!this.isReady || !templateImage) return null;
        
        try {
            // Create Mats for template
            const templateMat = cv.matFromImageData(templateImage);
            const templateGray = new cv.Mat();
            const blurredTemplate = new cv.Mat();
            
            // Convert to grayscale and blur with same parameters as reference
            cv.cvtColor(templateMat, templateGray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(
                templateGray, 
                blurredTemplate,
                CONFIG.ALGORITHM.BLUR_SIZE, 
                CONFIG.ALGORITHM.BLUR_SIGMA
            );
            
            return {
                mat: templateMat,
                gray: templateGray,
                blurred: blurredTemplate
            };
        } catch (error) {
            console.error('Error processing template image:', error);
            return null;
        }
    }
    
    /**
     * Rotate an image with caching optimization
     * @param {cv.Mat} mat - Image to rotate
     * @param {number} angleDegrees - Rotation angle in degrees
     * @returns {cv.Mat} - Rotated image
     */
    rotateImage(mat, angleDegrees) {
        // Use integer angles only
        angleDegrees = Math.round(angleDegrees);
        
        // Check cache first with a compound key
        const cacheKey = `${angleDegrees}_${mat.cols}_${mat.rows}`;
        if (this.rotationCache[cacheKey]) {
            return this.rotationCache[cacheKey].clone();
        }
        
        // Optimization: special cases for common rotations
        if (angleDegrees === 0) {
            return mat.clone();
        }
        
        // For 90, 180, 270 degrees, use faster rotation methods
        if (angleDegrees === 90 || angleDegrees === 270) {
            const rotated = new cv.Mat();
            const transpose = new cv.Mat();
            cv.transpose(mat, transpose);
            
            if (angleDegrees === 90) {
                cv.flip(transpose, rotated, 1); // Flip around y-axis
            } else { // 270 degrees
                cv.flip(transpose, rotated, 0); // Flip around x-axis
            }
            
            transpose.delete();
            
            // Cache if required
            if (CONFIG.ALGORITHM.USE_COMMON_ANGLES_CACHE) {
                this.rotationCache[cacheKey] = rotated.clone();
            }
            
            return rotated;
        }
        
        if (angleDegrees === 180) {
            const rotated = new cv.Mat();
            cv.flip(mat, rotated, -1); // Flip around both axes
            
            // Cache if required
            if (CONFIG.ALGORITHM.USE_COMMON_ANGLES_CACHE) {
                this.rotationCache[cacheKey] = rotated.clone();
            }
            
            return rotated;
        }
        
        // For other angles, use the rotation matrix
        const angleRadians = angleDegrees * CONFIG.PI_180;
        const width = mat.cols;
        const height = mat.rows;
        const center = new cv.Point(Math.floor(width / 2), Math.floor(height / 2));
        
        // Fast calculation of rotated dimensions
        const cosAngle = Math.cos(angleRadians);
        const sinAngle = Math.sin(angleRadians);
        const absCos = Math.abs(cosAngle);
        const absSin = Math.abs(sinAngle);
        const newWidth = Math.floor(height * absSin + width * absCos);
        const newHeight = Math.floor(height * absCos + width * absSin);
        
        // Create rotation matrix
        const rotationMatrix = cv.getRotationMatrix2D(center, angleDegrees, 1);
        rotationMatrix.data[2] += (newWidth / 2) - center.x;
        rotationMatrix.data[5] += (newHeight / 2) - center.y;
        
        const rotated = new cv.Mat();
        const dsize = new cv.Size(newWidth, newHeight);
        
        // Use a fixed border type for better consistency
        cv.warpAffine(
            mat, 
            rotated, 
            rotationMatrix, 
            dsize, 
            cv.INTER_LINEAR, 
            cv.BORDER_CONSTANT, 
            new cv.Scalar(0, 0, 0, 255)
        );
        
        rotationMatrix.delete();
        
        // Store in cache for common angles
        if (CONFIG.ALGORITHM.USE_COMMON_ANGLES_CACHE && 
            CONFIG.ALGORITHM.COMMON_ROTATION_ANGLES.includes(angleDegrees)) {
            this.rotationCache[cacheKey] = rotated.clone();
        }
        
        return rotated;
    }
    
    /**
     * Resize a template with improved quality
     * @param {cv.Mat} mat - Image to resize
     * @param {number} scale - Scale factor
     * @returns {cv.Mat} - Resized image
     */
    resizeTemplate(mat, scale) {
        const scaledSize = new cv.Size(
            Math.floor(mat.cols * scale),
            Math.floor(mat.rows * scale)
        );
        
        const scaledTemplate = new cv.Mat();
        
        // Use different interpolation methods based on scale
        const interpolation = scale < 1.0 ? cv.INTER_AREA : cv.INTER_CUBIC;
        
        cv.resize(mat, scaledTemplate, scaledSize, 0, 0, interpolation);
        
        return scaledTemplate;
    }
    
    /**
     * Extract region of interest from reference image
     * @param {Object} roi - Region of interest parameters
     * @returns {cv.Mat} - ROI image
     */
    extractRoi(roi) {
        if (!this.cachedBlurredRef) return null;
        
        // Create a safe roi that fits within the image bounds
        const safeRoi = new cv.Rect(
            Math.max(0, Math.min(roi.x, this.cachedBlurredRef.cols - 1)),
            Math.max(0, Math.min(roi.y, this.cachedBlurredRef.rows - 1)),
            Math.min(roi.width, this.cachedBlurredRef.cols - roi.x),
            Math.min(roi.height, this.cachedBlurredRef.rows - roi.y)
        );
        
        return this.cachedBlurredRef.roi(safeRoi);
    }
    
    /**
     * Match template in reference image
     * @param {cv.Mat} roiMat - Region of interest in reference image
     * @param {cv.Mat} template - Template to match
     * @returns {Object} - Match result with location and confidence
     */
    matchTemplate(roiMat, template) {
        if (!roiMat || !template || template.cols >= roiMat.cols || template.rows >= roiMat.rows) {
            return { maxVal: 0, maxLoc: { x: 0, y: 0 } };
        }
        
        const result = new cv.Mat();
        cv.matchTemplate(roiMat, template, result, cv.TM_CCOEFF_NORMED);
        
        const minMax = cv.minMaxLoc(result);
        result.delete();
        
        return minMax;
    }
    
    /**
     * Clean up reference image matrices
     */
    cleanupRefMats() {
        if (this.cachedRefMat) {
            this.cachedRefMat.delete();
            this.cachedRefMat = null;
        }
        if (this.cachedRefGray) {
            this.cachedRefGray.delete();
            this.cachedRefGray = null;
        }
        if (this.cachedBlurredRef) {
            this.cachedBlurredRef.delete();
            this.cachedBlurredRef = null;
        }
    }
    
    /**
     * Clean up rotation cache to free memory
     */
    cleanupRotationCache() {
        const now = Date.now();
        if (now - this.lastCleanupTime > CONFIG.CLEANUP_INTERVAL) {
            // Clear rotation cache selectively - keep common angles
            for (let angle in this.rotationCache) {
                if (!CONFIG.ALGORITHM.COMMON_ROTATION_ANGLES.includes(parseInt(angle.split('_')[0])) && 
                    this.rotationCache[angle]) {
                    this.rotationCache[angle].delete();
                    delete this.rotationCache[angle];
                }
            }
            this.lastCleanupTime = now;
            
            // Force garbage collection hint
            if (window.gc) window.gc();
        }
    }
    
    /**
     * Clean up matrices to release memory
     * @param {Array} mats - Array of matrices to clean up
     */
    cleanupMats(mats) {
        if (!mats || !Array.isArray(mats)) return;
        
        mats.forEach(mat => {
            if (mat && typeof mat.delete === 'function') {
                try {
                    mat.delete();
                } catch (e) {
                    console.warn('Error deleting matrix:', e);
                }
            }
        });
    }
    
    /**
     * Clean up all resources for application reset
     */
    reset() {
        this.cleanupRefMats();
        
        // Clear all rotation cache
        for (let key in this.rotationCache) {
            if (this.rotationCache[key]) {
                this.rotationCache[key].delete();
                delete this.rotationCache[key];
            }
        }
    }
}

// Create global instance
const imageProcessor = new ImageProcessor();