# Puzzle Detector Pro

A web-based application that uses computer vision to help find where puzzle pieces fit in the completed puzzle image.

![Puzzle Detector Pro Screenshot](https://via.placeholder.com/800x400?text=Puzzle+Detector+Pro)

## 🧩 Overview

Puzzle Detector Pro is a standalone web application that uses your device's camera to detect where individual puzzle pieces belong in a completed puzzle. It employs template matching algorithms through OpenCV.js to identify the exact location of puzzle pieces in real-time.

## ✨ Features

- **Dual Camera View**: Capture the reference puzzle image in the upper view and detect individual pieces in the lower view
- **Real-time Processing**: Instant feedback on where pieces belong
- **Visual Feedback**: Highlights matched areas with confidence percentages
- **Multi-scale Detection**: Works with different sized puzzle pieces through scale-invariant matching
- **Mobile-Friendly**: Optimized for use on smartphones and tablets
- **No Server Required**: Runs entirely in the browser with no data sent to any server

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

1. **Capture Reference Image**:
   - Place your completed puzzle (or box image) in view of the camera
   - Tap the upper section to capture the reference image

2. **Detect Puzzle Pieces**:
   - Once the reference is captured, the lower section activates
   - Position individual puzzle pieces within the green outline
   - The app will show where in the reference image your piece belongs
   - Confidence percentage indicates how certain the match is

3. **Reset**:
   - Double-tap the lower section or tap the upper section to reset and recapture the reference

## 🔧 Technical Details

- **OpenCV.js**: Used for computer vision and template matching algorithms
- **JavaScript ES6**: Core application logic
- **HTML5 Canvas**: Real-time image processing and visualization
- **MediaDevices API**: Camera access and video streams

### Algorithm Overview

The application uses the following techniques:
- Grayscale conversion for better pattern matching
- Gaussian blur to reduce noise
- Template matching with normalized cross-correlation (TM_CCOEFF_NORMED)
- Multi-scale detection to account for different sized puzzle pieces
- SVG path parsing for visualizing the puzzle piece outline

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

- Edge detection for better puzzle piece recognition
- Support for saving reference images between sessions
- Custom SVG outlines for different puzzle piece shapes
- Improved performance optimizations for lower-end devices
- Puzzle piece rotation detection

## 📞 Contact

If you have any questions or suggestions, please open an issue in this repository.

---

Made with ❤️ for puzzle enthusiasts everywhere
