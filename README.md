# Interactive Pixel Art Room Portfolio

An interactive, responsive, and retro-style pixel-art room portfolio built using Vanilla HTML5, CSS3, and JavaScript. This project showcases dynamic ambient environment cycles and custom sound synthesis powered by the Web Audio API.

## Core Features

- **Dynamic Environment Cycles**: Transitions between Morning, Day, Sunset, and Night states.
- **Web Audio API Synth Engine**: Real-time sound synthesis featuring ambient pad generators, interactive sound effects (SFX), customizable waveforms, and master volume control.
- **Interactive Room Elements**: Clickable room objects (computer, desk, cat, bed, window) that trigger dedicated micro-animations, lighting state changes, and localized sound effects.
- **Lightweight Architecture**: Zero external dependencies, utilizing semantic markup and optimized vanilla styling.
- **Responsive Layout**: Fluid design structure configured to align and scale cleanly across various display dimensions.

## Technical Stack

- **Structure**: HTML5 (Semantic elements and layout overlays)
- **Styling**: CSS3 (Vanilla rules, keyframe animations, custom properties, and variable-based theme states)
- **Scripting**: JavaScript ES6+ (DOM event handling, state coordination, and Web Audio API node routing)

## Directory Structure

```text
├── assets/            # Graphics, sprite sheets, and audio files
├── index.html         # Document entry point
├── style.css          # Visual layout, theme declarations, and animations
├── script.js          # Core application logic and sound synthesis engine
└── README.md          # Project documentation
```

## Running the Project Locally

This application is built entirely on native web standards and does not require a compilation step:

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. *Note: Browsers require user interaction (e.g., clicking anywhere on the screen) to activate the Web Audio context and enable sound.*

