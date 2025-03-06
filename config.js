/**
 * Configuration for Puzzle Detector Pro
 * Contains threshold values, constants, and settings
 */
const CONFIG = {
    // Detection thresholds
    DETECTION_THRESHOLD: 0.40,       // Minimum threshold to consider a match (reduced from 0.45)
    MATCH_CONFIDENCE_THRESHOLD: 0.60, // Threshold for displaying match
    HIGH_CONFIDENCE_THRESHOLD: 0.75,  // Threshold for high confidence matching
    
    // Performance settings
    FRAME_SKIP: 3,                    // Number of frames to skip (reduced to improve responsiveness)
    MAX_STABLE_COUNT: 10,             // Maximum stability counter
    CLEANUP_INTERVAL: 60000,          // Memory cleanup interval in ms
    PERFORMANCE_UPDATE_INTERVAL: 15,  // Frames between performance updates
    
    // Camera settings
    CAMERA: {
        WIDTH: { ideal: 1280 },
        HEIGHT: { ideal: 720 },
        FACING_MODE: 'environment'
    },
    
    // Template settings
    TEMPLATE: {
        WIDTH_FACTOR: 0.35,           // Width factor for template (percentage of video width)
        HEIGHT_FACTOR: 0.35,          // Height factor for template (percentage of video height)
        MIN_SIZE: 20,                 // Minimum template size in pixels
    },
    
    // Match settings
    MATCH: {
        STABLE_POSITION_THRESHOLD: 20,   // Maximum position difference for stable match
        STABLE_SIZE_THRESHOLD: 20,       // Maximum size difference for stable match
        STABLE_ROTATION_THRESHOLD: 15,   // Maximum rotation difference for stable match
        MAX_SEARCH_ITERATIONS: 10,       // Maximum search iterations before giving up
    },
    
    // ROI settings for focused processing
    ROI: {
        ENABLED: true,                   // Enable/disable ROI processing
        MARGIN_FACTOR_HIGH: 0.5,         // Margin factor for high confidence (increased for better tracking)
        MARGIN_FACTOR_LOW: 0.7,          // Margin factor for low confidence (increased for better tracking)
    },
    
    // Algorithm settings
    ALGORITHM: {
        // Rotation settings for different modes
        ROTATIONS: {
            COARSE: [0, 90, 180, 270],
            MEDIUM: [0, 45, 90, 135, 180, 225, 270, 315],
            FINE: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 
                  195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345]
        },
        
        // Scale settings for different modes
        SCALES: {
            COARSE: [0.3, 0.5, 0.7, 1.0],    // Added smaller scale for tiny pieces
            MEDIUM: [0.4, 0.6, 0.8, 1.0],
            FINE: [0.5, 0.7, 0.9, 1.1]
        },
        
        // Blur settings
        BLUR_SIZE: new cv.Size(3, 3),
        BLUR_SIGMA: 0,
        
        // Special optimizations
        USE_COMMON_ANGLES_CACHE: true,
        COMMON_ROTATION_ANGLES: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 
                                195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345],
    },
    
    // UI settings
    UI: {
        MATCH_COLORS: {
            HIGH: 'lime',
            MEDIUM: 'yellow',
            LOW: 'orange'
        },
        DEFAULT_PIECE_SCALE: 0.50,      // Fixed scale for piece detection outline (reduced for smaller pieces)
    },
    
    // Debug settings
    DEBUG: {
        ENABLED: false,                 // Enable/disable debug mode
        SHOW_ROI: false,                // Visualize ROI in reference image
        LOG_LEVEL: 'info'               // 'info', 'warn', 'error', 'debug'
    }
};

// Pre-computed values
CONFIG.PI_180 = Math.PI / 180;
CONFIG.EARLY_TERMINATION_THRESHOLD = 0.85; // Confidence threshold for early termination