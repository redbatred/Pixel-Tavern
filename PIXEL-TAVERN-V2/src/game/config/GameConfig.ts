export const GameConfig = {
  // Game Settings
  INITIAL_CREDITS: 1000,
  DEFAULT_BET: 10,
  MAX_BET: 100,
  MIN_BET: 1,
  
  // Visual Settings
  BACKGROUND_COLOR: 0x2c1810,
  SLOT_COLUMNS: 5,
  SLOT_ROWS: 3,
  
  // Symbol Configuration
  SYMBOLS: [
    { id: 0, name: 'Knight', value: 1 },
    { id: 1, name: 'Wizard', value: 2 },
    { id: 2, name: 'Archer', value: 3 },
    { id: 3, name: 'Warrior', value: 4 },
    { id: 4, name: 'Barmaid', value: 5 },
    { id: 5, name: 'King', value: 6 }
  ],
  
  // Payline Configuration - All 20 paylines from original game
  PAYLINES: [
    // Payline 1: Top row
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    // Payline 2: Middle row
    [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
    // Payline 3: Bottom row
    [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
    // Payline 4: V shape
    [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]],
    // Payline 5: Inverted V shape
    [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4]],
    // Payline 6: W shape
    [[0, 0], [0, 1], [1, 2], [2, 3], [2, 4]],
    // Payline 7: M shape
    [[2, 0], [2, 1], [1, 2], [0, 3], [0, 4]],
    // Payline 8: Zigzag up
    [[1, 0], [0, 1], [1, 2], [2, 3], [1, 4]],
    // Payline 9: Zigzag down
    [[1, 0], [2, 1], [1, 2], [0, 3], [1, 4]],
    // Payline 10: Steps up
    [[2, 0], [1, 1], [1, 2], [1, 3], [0, 4]],
    // Payline 11: Steps down
    [[0, 0], [1, 1], [1, 2], [1, 3], [2, 4]],
    // Payline 12: Mountain
    [[1, 0], [0, 1], [0, 2], [0, 3], [1, 4]],
    // Payline 13: Valley
    [[1, 0], [2, 1], [2, 2], [2, 3], [1, 4]],
    // Payline 14: Lightning up
    [[2, 0], [2, 1], [1, 2], [1, 3], [0, 4]],
    // Payline 15: Lightning down
    [[0, 0], [0, 1], [1, 2], [1, 3], [2, 4]],
    // Payline 16: Diagonal up
    [[0, 0], [0, 1], [1, 2], [2, 3], [2, 4]],
    // Payline 17: Diagonal down
    [[2, 0], [2, 1], [1, 2], [0, 3], [0, 4]],
    // Payline 18: Snake up
    [[1, 0], [0, 1], [2, 2], [0, 3], [2, 4]],
    // Payline 19: Snake down
    [[1, 0], [2, 1], [0, 2], [2, 3], [0, 4]],
    // Payline 20: Crown
    [[0, 0], [0, 1], [0, 2], [1, 3], [2, 4]]
  ],
  
  // Win Configuration
  MIN_CONSECUTIVE_SYMBOLS: 3,
  WIN_MULTIPLIER_PER_SYMBOL: 10,
  
  // Win Tier Thresholds
  WIN_TIERS: {
    BIG: 10,    // 10x bet
    MEGA: 20,   // 20x bet
    EPIC: 50    // 50x bet
  },
  
  // Animation Speeds
  ANIMATION_SPEEDS: {
    slow: { duration: 2500, scrollSpeed: 12 },
    normal: { duration: 1500, scrollSpeed: 20 },
    fast: { duration: 800, scrollSpeed: 35 }
  },
  
  // Audio Configuration
  AUDIO: {
    MASTER_VOLUME: 0.8,
    MUSIC_VOLUME: 0.6,
    SFX_VOLUME: 0.8
  },
  
  // Responsive Design Configuration
  RESPONSIVE: {
    // Base design dimensions (what the game was designed for)
    BASE_WIDTH: 1920,
    BASE_HEIGHT: 1080,
    // Minimum scale to prevent game from becoming too small
    MIN_SCALE: 0.2,
    // Maximum scale to prevent game from becoming too large
    MAX_SCALE: 2.0,
    // Whether to maintain aspect ratio (recommended: true)
    MAINTAIN_ASPECT_RATIO: true,
    // Mobile-specific constraints
    MOBILE: {
      // Minimum margin from screen edges (in pixels)
      MARGIN_X: 20,
      MARGIN_Y: 40,
      // Maximum percentage of screen that slot machine can occupy
      MAX_WIDTH_PERCENT: 0.9,
      MAX_HEIGHT_PERCENT: 0.8,
      // Scale factor for mobile UI elements
      UI_SCALE_FACTOR: 0.8
    }
  },

  // Mobile Configuration
  MOBILE: {
    // Force landscape orientation on mobile devices
    FORCE_LANDSCAPE: true,
    // Minimum width for landscape mode
    MIN_LANDSCAPE_WIDTH: 568,
    // Mobile breakpoint
    MOBILE_BREAKPOINT: 768,
    // Touch-friendly scaling
    TOUCH_SCALE_FACTOR: 1.1
  },

  // Slot Machine Visual Configuration
  SLOT_MACHINE: {
    SYMBOL_SCALE: 0.19,
    SLOT_HEIGHT: 185,
    COLUMN_WIDTHS: [0.1, 0.1, 0.1, 0.1, 0.1],
    COLUMN_X_POSITIONS: [-187, -89, 9, 89, 187],
    FRAME_SCALE: 0.7,
    MASK_WIDTH: 600,
    MASK_HEIGHT: 560,
    PARTICLE_COUNT: 8,
    SEPARATOR_LIGHT_COUNT: 4
  }
}
