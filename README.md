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
