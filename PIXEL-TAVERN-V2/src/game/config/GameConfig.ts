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

  // Background Fire Animations Configuration
  FIRE_BACKGROUND: {
    ENABLED: true,
  SCALE_WITH_VIEWPORT: true,
  FOLLOW_BACKGROUND: true,
  COORD_SPACE: 'design', // 'design' (1920x1080) or 'background'
  CROP_WIDTH: 58, // tighten crop to the core flame
  BASE_BAND_HEIGHT: 14, // focus closer to the base core
  BASE_ALPHA_THRESHOLD: 110, // stricter opacity threshold
  BASE_BAND_DENSITY_FRACTION: 0.65, // prefer denser center over side embers
  LOCK_TO_FIRST_FRAME: true, // apply per-frame x shift relative to first frame
  // Optional GIF mode (tries GIF first, falls back to PNG sheet if unavailable)
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Fire+Sparks.gif',
    // Default two instances; positions are relative to the screen center (in pixels)
    // Positive x is right, positive y is down. Adjust scale to change size.
  INSTANCES: [
  // Original two instances (design-space coordinates 1920x1080)
  { x: -637, y: 331, scale: 0.5, animationSpeed: 0.5, alpha: 0.95, widthScale: 0.5, heightScale: 0.5 },
  { x: 409, y: -342, scale: 1.3, animationSpeed: 0.5, alpha: 0.5, widthScale: 1.3, heightScale: 1.3 },
  // Seven additional instances
  { x: -500, y: -305, scale: 1.3, animationSpeed: 0.55, alpha: 0.3, widthScale: 1.3, heightScale: 1.3 },
  { x: -749, y: -36,  scale: 0.4, animationSpeed: 0.5,  alpha: 0.8 },
  { x: 735,  y: -184,  scale: 1.1, animationSpeed: 0.45, alpha: 0.5 },
  { x: -708,    y: -206, scale: 0.4, animationSpeed: 0.5,  alpha: 0.8 },
  { x: 822, y: -36, scale: 0.4, animationSpeed: 0.55, alpha: 0.65 },
  { x: -397,  y: -307, scale: 0.4, animationSpeed: 0.55, alpha: 0.65 },
  { x: 853,    y: 416,  scale: 0.5, animationSpeed: 0.5,  alpha: 0.9 },
  // Two additional instances (design-space coordinates). Adjust as desired.
  { x: -295, y: -465, scale: 0.9, animationSpeed: 0.5,  alpha: 0.5 },
  { x: 180,  y: -250, scale: 2.9, animationSpeed: 0.52, alpha: 0.5 },
  // One more additional instance (design-space). Adjust if needed.
  { x: 325, y: 260, scale: 0.5, animationSpeed: 0.5, alpha: 0.75 },
  // Extra instance appended per request
  { x: -579, y: 110, scale: 0.48, animationSpeed: 0.5, alpha: 0.8 },
  // One more flame instance appended
  { x: 432, y: -26, scale: 0.52, animationSpeed: 0.51, alpha: 0.82 }
  ] as Array<{ x: number; y: number; scale: number; animationSpeed?: number; alpha?: number; rotation?: number; widthScale?: number; heightScale?: number }>
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
