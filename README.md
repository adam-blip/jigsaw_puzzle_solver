![](https://github.com/adam-blip/jigsaw_puzzle_solver/blob/main/logo.png)
# Jigsaw Puzzle Solver

An advanced web-based application that uses computer vision to help find where puzzle pieces fit in complex puzzles with 500+ pieces.

## 🧩 Overview

Puzzle Detector Pro is a sophisticated puzzle-solving assistant that uses your device's camera to detect where individual puzzle pieces belong in a completed puzzle. Using advanced computer vision algorithms through OpenCV.js, it features high-resolution image capture with optimized detection for both simple and complex puzzles.

## ✨ Features

### Core Features
- **High-Resolution Photo Capture**: Takes full-resolution photos instead of video frames for reference images
- **Multi-Scale Detection**: Works with puzzles of various sizes, from simple to 500+ pieces
- **Dual Camera View**: Capture the reference puzzle image in the upper view and detect individual pieces in the lower view
- **Portrait Mode Enforcement**: Automatically detects device orientation and prompts for portrait mode
- **Mobile-Friendly**: Optimized for use on smartphones and tablets
- **No Server Required**: Runs entirely in the browser with no data sent to any server

### Advanced Detection Technology
- **Multi-Resolution Image Pyramid**: Uses 4 levels of resolution for efficient detection
- **Two-Stage Detection Process**: Quick coarse matching followed by precise refinement
- **Adaptive Scale Increments**: Uses finer increments (0.05) for small pieces in 500+ piece puzzles
- **Region of Interest (ROI) Optimization**: Focuses detailed detection in promising areas only
- **Multiple Matching Algorithms**: Combines different OpenCV matching methods for better results
- **Histogram Equalization**: Improves detection under varying lighting conditions
- **Smart Resource Management**: Caches processed images for better performance

## 🚀 Getting Started

### Prerequisites

- A modern web browser with JavaScript enabled
- Camera access on your device
- For best results, use good lighting conditions

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/puzzle-detector-pro.git
   ```

2. Navigate to the project directory:
   ```
   cd puzzle-detector-pro
   ```

3. Open `index.html` in a web server. 
   - For local development, you can use:
     ```
     npx http-server .
     ```
   - Or with Python:
     ```
     python -m http.server
     ```

4. Access through your browser (usually at http://localhost:8080)

## 📱 How to Use

1. **Capture High-Resolution Reference Image**:
   - Place your completed puzzle in view of the camera
   - Tap the upper section to capture a high-resolution photo
   - The app will automatically process the image for optimal detection

2. **Detect Puzzle Pieces**:
   - Once the reference is captured, the lower section activates
   - Position individual puzzle pieces within the green outline
   - The app will show where in the reference image your piece belongs
   - Confidence percentage indicates how certain the match is

3. **Reset**:
   - Double-tap the lower section or tap the upper section to reset and recapture the reference

## 🔧 Technical Details

### Performance Optimizations

- **Multi-Resolution Approach**:
  - Uses an image pyramid with 4 resolution levels
  - Initial matching at lowest resolution for maximum speed
  - Refines matches at higher resolutions for accuracy

- **Adaptive Scale Detection**:
  - Uses coarse scale increments for initial matching [0.5, 1.0, 1.5]
  - Automatically switches to finer increments (0.05) for small pieces
  - Full scale range from 0.25 to 1.75 to detect pieces of all sizes

- **Reference Image Caching**:
  - Pre-processes and caches grayscale, blurred, and equalized versions of the reference image
  - Creates and stores an image pyramid to avoid repeated downsampling
  - Properly manages OpenCV resources to prevent memory leaks

- **Region of Interest (ROI) Optimization**:
  - After finding a coarse match, only searches within a region around it
  - Dramatically reduces the search area for refined matching

### Computer Vision Techniques

- **Multiple Template Matching Methods**:
  - Uses both `cv.TM_CCOEFF_NORMED` and `cv.TM_CCORR_NORMED` matching methods
  - Each method excels at detecting different types of puzzle pieces
  - Dynamically adjusts confidence thresholds based on the method used

- **Image Enhancement**:
  - Applies histogram equalization to both reference and template images
  - Helps with varying lighting conditions and improves matching quality
  - Gaussian blur reduces noise for more reliable matching

- **Efficient Processing**:
  - Uses `cv.INTER_NEAREST` for faster initial resizing
  - Intelligent memory management for better performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- Puzzle piece rotation detection
- Machine learning integration for improved detection
- Background worker implementation for smoother UI
- Pinch-to-zoom for examining the reference image
- Local storage for saving reference images between sessions

## AI Chatbot Prompt for Creation

Create a web-based puzzle piece detector application that uses computer vision to help users find where a specific puzzle piece belongs in a completed puzzle image. The app should:

1. Capture two video streams from the device camera:
   - Top view: For capturing the reference (completed puzzle)
   - Bottom view: For capturing individual puzzle pieces

2. Use OpenCV.js for image processing with these key features:
   - Template matching to find pieces in the reference image
   - Multi-scale detection to handle different piece sizes
   - Rotation handling (0°, 90°, 180°, 270° + finer angles)
   - Performance optimization (frame skipping, ROI tracking)
   - Adaptive confidence thresholds (0.45 for detection, 0.60 for matching)

3. UI requirements:
   - Split-screen layout with reference image on top, piece detector on bottom
   - Visual indicators showing match location with confidence percentage
   - Green outline for detected pieces with rotation visualization
   - Performance stats (processing time and FPS)
   - Simple tap controls to capture reference and reset application

4. Technical optimizations:
   - Pre-process reference image once instead of every frame
   - Use cached OpenCV matrices to prevent memory allocation overhead
   - Implement adaptive rotation/scale search based on previous matches
   - Skip frames for better performance (process every Nth frame)
   - Use region-of-interest tracking to focus processing on likely areas

5. Mobile-friendly features:
   - Responsive layout that works on mobile devices
   - Camera access using getUserMedia with environment-facing camera
   - Touch controls for capturing images and resetting the app
   - Minimal UI with clear visual feedback

Use HTML5, CSS3, and vanilla JavaScript. The entire application should be self-contained in a single HTML file that loads OpenCV.js from a CDN.
If you have any questions or suggestions, please open an issue in this repository.

---

Made with ❤️ for puzzle enthusiasts everywhere
