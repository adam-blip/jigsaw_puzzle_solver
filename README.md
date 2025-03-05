# Jigsaw Puzzle Solver Web App

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://htmlpreview.github.io/?https://github.com/adam-blip/jigsaw_puzzle_solver/blob/main/index.html)

A browser-based solution that helps assemble jigsaw puzzles using computer vision techniques and pattern matching.

## Key Features
- 📸 **Camera Integration** - Uses device camera to capture puzzle pieces
- 🔄 **Rotation Detection** - Identifies piece orientation (0°, 90°, 180°, 270°)
- 🎯 **Position Tracking** - Locates piece position in reference image
- 📊 **Confidence Scoring** - Calculates match probability in percentage
- 🖥️ **Visual Overlay** - Displays potential matches with color-coded confidence

## Live Demo
Test the solver directly in your browser:  
[Jigsaw Puzzle Solver Demo](https://htmlpreview.github.io/?https://github.com/adam-blip/jigsaw_puzzle_solver/blob/main/index.html)

## Usage
1. **Capture Reference Image**
   - Position complete puzzle in camera view
   - Click "Capture Reference Puzzle"
   
2. **Detect Puzzle Piece**
   - Show individual piece to camera
   - Click "Detect Piece Position"
   
3. **Review Results**
   - See position coordinates
   - View confidence percentage
   - Check detected rotation angle

## Features
- Pure JavaScript implementation
- Real-time image processing
- Mobile-responsive interface
- Visual feedback system
- Performance optimizations

## Prompt used for AI Coding Assistants

Logo and Favicon:
a single rainbow-colored jigsaw piece on a white background with a magnifying glass in front, comic style

Web App:
I need a web application that can detect puzzle pieces using a device's camera. Favicon is already there. The application interface is split into two halves: an upper half for reference image management and a lower half for live puzzle piece detection.

Upper Half (Reference Image):

Initially, it should display a live camera preview with a transparent grey text overlay saying "Tap to capture reference".
When the user taps in the upper half:
Capture a square-cropped image from the center of the upper camera preview. This becomes the "reference image".
Display the captured reference image in the upper half, replacing the live preview.
Change the text overlay to "Tap to retake reference", still in transparent grey.
Tapping the upper half again should recapture the reference image, repeating the above process.
Lower Half (Detection):

After a reference image is captured, the live camera preview should move to the lower half.
The lower half should also display a transparent jigsaw puzzle piece outline overlaid on the live camera preview, indicating the detection zone.
Continuously analyze the live camera feed in the lower half to detect puzzle pieces that resemble a portion of the reference image.
When a puzzle piece is detected with a confidence level above a threshold (e.g., 80%):
Visually mark the location of the detected puzzle piece on the reference image in the upper half with a flashing green rectangle.
Display the confidence percentage within the green rectangle on the reference image.
Crop out the detected puzzle piece area from the lower camera preview.
Visual Details:

Use a transparent grey color for all text overlays.
Use a jigsaw puzzle piece outline image for the detection zone in the lower half.
Use a flashing green rectangle and a confidence percentage label to mark detected pieces on the reference image.
Technical Aspects (Desired Enhancements - if applicable to the other chatbot's capabilities):

Incorporate methods to automatically detect and crop a square or rectangular area for the reference image instead of a fixed center crop.
Consider adding skew correction to better align and compare the reference and detected pieces.
If possible, explore using WebAssembly to improve performance, especially for image processing and comparison.
Optimize for speed and responsiveness in continuous puzzle piece detection.
Can you help me create the HTML, CSS, and JavaScript code for this web application?
