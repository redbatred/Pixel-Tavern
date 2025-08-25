# 🎰 Pixel Tavern V2 - Medieval Fantasy Slot Game

![Pixel Tavern Game Screenshot](./public/assets/images/image.png)

A beautifully crafted medieval fantasy slot machine game built with modern web technologies. Experience the magic of a tavern setting with pixel-perfect graphics, immersive audio, and smooth animations.

## ✨ Features

### 🎮 Core Gameplay
- **5x3 Slot Machine** with medieval fantasy characters
- **Multiple Character Types**: Knight, Mage, Archer, and more
- **Dynamic Paylines** with visual win indicators
- **Smooth Animations** powered by PIXI.js and GSAP
- **Responsive Design** works on desktop and mobile

### 🔊 Audio Experience
- **Immersive Background Music** with volume controls
- **Sound Effects** for spins, wins, and interactions
- **Lock Sound Animation** with synchronized padlock animations
- **Column-specific Spin Sounds** for realistic feedback

### ⚡ Advanced Features
- **Turbo Mode** with animated padlock switch
- **Auto-Spin Functionality** with customizable settings
- **Comprehensive Pause System** - game completely pauses when window loses focus
- **Animation Speed Controls** (Very Slow, Slow, Normal, Fast, Very Fast)
- **Win Animations** with character-specific effects
- **Lightning Effects** during spinning
- **Background Particle Effects**

### 🎯 Technical Excellence
- **State Machine Architecture** using XState for robust game flow
- **Performance Optimized** with object pooling and efficient rendering
- **TypeScript** for type safety and better development experience
- **Modular Component System** for maintainable code
- **Advanced Pause/Resume System** preserves exact game state

## 🛠️ Technology Stack

- **Frontend Framework**: Vite + TypeScript
- **Game Engine**: PIXI.js v8
- **Animations**: GSAP (GreenSock)
- **State Management**: XState
- **Audio**: @pixi/sound
- **Styling**: SCSS/CSS
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PIXEL-TAVERN-V2

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm type-check

# Preview production build
pnpm preview
```

## 🎨 Game Features

### 🔒 Turbo Mode
- Animated padlock that prevents interaction during animation
- Smooth lock/unlock transitions with sound effects
- Visual feedback for turbo mode activation

### ⏸️ Advanced Pause System
- **Complete Game Pause**: Everything stops when you leave the tab
- **PIXI Ticker Control**: Pauses main rendering loop
- **GSAP Animation Pause**: Individual tween control for spinning
- **Audio Pause**: Spinning sounds pause and resume from exact position
- **State Preservation**: Game resumes exactly where it left off
- **Component Animation Pause**: All UI animations respect pause state

### 🎵 Audio Features
- Background music with fade in/out
- Column-specific spinning sounds
- Win celebration audio
- UI interaction sounds
- Volume controls (Master, Music, SFX)
- Mute functionality

### 🎯 Game Mechanics
- Multiple bet amounts (5, 10, 25, 50, 100)
- Max bet functionality
- Auto-spin with customizable count
- Win multiplier calculations
- History tracking
- Credit management

## 📁 Project Structure

```
PIXEL-TAVERN-V2/
├── src/
│   ├── game/
│   │   ├── PixelTavernGame.ts       # Main game controller
│   │   ├── assets/                  # Asset loading and management
│   │   ├── audio/                   # Audio management system
│   │   ├── components/              # Game components (SlotMachine, etc.)
│   │   ├── config/                  # Game configuration
│   │   ├── state/                   # State management (XState)
│   │   ├── ui/                      # User interface components
│   │   └── utils/                   # Utility functions
│   ├── components/                  # React/UI components
│   ├── store/                       # Global state management
│   └── main.ts                      # Application entry point
├── public/
│   └── assets/                      # Game assets (images, sounds)
├── dist/                            # Production build output
└── package.json                     # Dependencies and scripts
```

## 🎮 How to Play

1. **Set Your Bet**: Choose from 5, 10, 25, 50, or 100 credits
2. **Spin the Reels**: Click the SPIN button or use auto-spin
3. **Win Combinations**: Match 3 or more symbols on paylines
4. **Collect Winnings**: Credits are automatically added to your balance
5. **Use Turbo Mode**: Toggle for faster gameplay
6. **Adjust Settings**: Control audio, animation speed, and more

## 🔧 Configuration

### Audio Settings
- Master Volume: 0-100%
- Music Volume: 0-100% 
- SFX Volume: 0-100%
- Mute Toggle

### Animation Settings
- Very Slow: 2000ms spin duration
- Slow: 1000ms spin duration
- Normal: 550ms spin duration (default)
- Fast: 400ms spin duration
- Very Fast: 250ms spin duration

### Auto-Spin Settings
- Customizable spin count
- Infinite auto-spin option
- Stop conditions

## 🎯 Recent Updates

### Enhanced Pause System (Latest)
- Complete game state preservation when window loses focus
- Direct GSAP tween control for spinning animations
- Audio pause/resume from exact position
- Component-level animation pause support
- State machine integration for seamless pause/resume

### Audio Improvements
- Lock sound with padlock animation synchronization
- Turbo switch interaction blocking during animation
- Column-specific spinning sound management

### Performance Optimizations
- Object pooling for sprites and graphics
- Efficient container batching
- Frame-rate independent animations
- Memory management improvements

## 🐛 Known Issues

- Some asset loading warnings in build (non-critical)
- Mobile touch responsiveness can be improved
- Occasional audio sync issues on slower devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License.

## 🙏 Acknowledgments

- PIXI.js team for the excellent 2D rendering engine
- GreenSock for powerful animation capabilities
- XState for robust state management
- The pixel art community for inspiration

---

**Enjoy your medieval slot adventure! 🏰🎰✨**
