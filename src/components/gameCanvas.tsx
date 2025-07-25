import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Assets, Sprite, Container, Rectangle, Texture, Graphics, Text, TextStyle } from 'pixi.js';
import SlotUI from '../ui/SlotUI';
import WinAnimation from './WinAnimation';
import { useGameStore, getSpinDuration, getScrollSpeed } from '../store/gameStore';
import { useVisibilityStore, usePageVisibility } from '../store/visibilityStore';
import { useAudioStore } from '../store/audioStore';
import './SpinEffects.css';

interface SlotSymbol {
  id: number;
  name: string;
  texture: Texture;
}

interface SpinEffectsContainer extends Container {
  particles: Sprite[];
  separatorLights?: Graphics[];
}

// Custom PIXI Text Input Class
class PixiTextInput extends Container {
  private background!: Graphics;
  private textDisplay!: Text;
  private textCursor!: Graphics;
  private isActive: boolean = false;
  private currentText: string = '';
  private maxLength: number = 10;
  private cursorPosition: number = 0;
  private cursorBlinkTimer: number = 0;
  private placeholder: string;
  private onSubmit?: (value: number) => void;
  private onCancel?: () => void;

  constructor(width: number = 200, height: number = 40, placeholder: string = 'Enter text...') {
    super();
    this.placeholder = placeholder;
    this.setupInput(width, height);
    this.setupEventListeners();
    this.visible = false; // Hidden by default
  }

  private setupInput(width: number, height: number) {
    // Create background
    this.background = new Graphics();
    this.background.rect(0, 0, width, height);
    this.background.fill(0x2c1810); // Dark wood color
    this.background.stroke({ color: 0xd4af37, width: 2 }); // Golden border
    this.addChild(this.background);

    // Create text display
    this.textDisplay = new Text({
      text: this.placeholder,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fill: 0xd4af37, // Golden text
        align: 'left'
      })
    });
    this.textDisplay.x = 8;
    this.textDisplay.y = height / 2 - 8;
    this.addChild(this.textDisplay);

    // Create cursor
    this.textCursor = new Graphics();
    this.textCursor.rect(0, 0, 2, 20);
    this.textCursor.fill(0xd4af37);
    this.textCursor.x = 8;
    this.textCursor.y = height / 2 - 10;
    this.textCursor.visible = false;
    this.addChild(this.textCursor);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private setupEventListeners() {
    this.on('pointerdown', this.onPointerDown.bind(this));
    
    // Add keyboard listener to window when active
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  private onPointerDown() {
    this.activate();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (!this.isActive) return;

    event.preventDefault();

    if (event.key === 'Backspace') {
      if (this.currentText.length > 0) {
        this.currentText = this.currentText.slice(0, -1);
        this.updateDisplay();
      }
    } else if (event.key === 'Enter') {
      this.submitBet();
    } else if (event.key === 'Escape') {
      this.cancelInput();
    } else if (event.key.length === 1 && this.currentText.length < this.maxLength) {
      // Only allow numbers and decimal point for bet input
      if (/[0-9.]/.test(event.key)) {
        // Prevent multiple decimal points
        if (event.key === '.' && this.currentText.includes('.')) {
          return;
        }
        this.currentText += event.key;
        this.updateDisplay();
      }
    }
  }

  private updateDisplay() {
    if (this.currentText.length === 0) {
      this.textDisplay.text = this.placeholder;
      this.textDisplay.style.fill = 0x888888; // Gray placeholder
    } else {
      this.textDisplay.text = this.currentText;
      this.textDisplay.style.fill = 0xd4af37; // Golden text
    }
    
    // Update cursor position
    const textWidth = this.textDisplay.width;
    this.textCursor.x = 8 + textWidth + 2;
  }

  public activate() {
    this.isActive = true;
    this.textCursor.visible = true;
    this.background.stroke({ color: 0xff6b35, width: 2 }); // Fire orange when active
    
    // Add keyboard listener (for desktop)
    window.addEventListener('keydown', this.onKeyDown);
    
    // Start cursor blinking
    this.startCursorBlink();
    
    // Clear placeholder if showing
    if (this.currentText.length === 0) {
      this.updateDisplay();
    }
  }

  public handleVirtualKeyInput(key: string) {
    if (!this.isActive) return;

    if (key === '⌫') {
      if (this.currentText.length > 0) {
        this.currentText = this.currentText.slice(0, -1);
        this.updateDisplay();
      }
    } else if (key === 'Enter') {
      this.submitBet();
    } else if (key.length === 1 && this.currentText.length < this.maxLength) {
      // Only allow numbers and decimal point for bet input
      if (/[0-9.]/.test(key)) {
        // Prevent multiple decimal points
        if (key === '.' && this.currentText.includes('.')) {
          return;
        }
        this.currentText += key;
        this.updateDisplay();
      }
    }
  }

  private deactivate() {
    this.isActive = false;
    this.textCursor.visible = false;
    this.background.stroke({ color: 0xd4af37, width: 2 }); // Back to golden
    
    // Remove keyboard listener
    window.removeEventListener('keydown', this.onKeyDown);
    
    // Stop cursor blinking
    this.stopCursorBlink();
    
    // Show placeholder if empty
    if (this.currentText.length === 0) {
      this.updateDisplay();
    }
  }

  private startCursorBlink() {
    this.cursorBlinkTimer = window.setInterval(() => {
      if (this.isActive) {
        this.textCursor.visible = !this.textCursor.visible;
      }
    }, 500);
  }

  private stopCursorBlink() {
    if (this.cursorBlinkTimer) {
      clearInterval(this.cursorBlinkTimer);
      this.cursorBlinkTimer = 0;
    }
  }

  public getValue(): string {
    return this.currentText;
  }

  public setValue(value: string) {
    this.currentText = value;
    this.updateDisplay();
  }

  public setCallbacks(onSubmit: (value: number) => void, onCancel: () => void) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  public show() {
    this.visible = true;
  }

  public hide() {
    this.visible = false;
    this.deactivate();
    if (this.virtualKeyboard) {
      this.virtualKeyboard.hide();
    }
  }

  private submitBet() {
    const value = parseFloat(this.currentText);
    if (!isNaN(value) && value >= 0.01 && value <= 9999.99) {
      this.onSubmit?.(value);
      this.currentText = '';
      this.updateDisplay();
      this.hide();
    }
  }

  private cancelInput() {
    this.currentText = '';
    this.updateDisplay();
    this.onCancel?.();
    this.hide();
  }

  public setVirtualKeyboard(keyboard: PixiVirtualKeyboard) {
    this.virtualKeyboard = keyboard;
  }

  private virtualKeyboard?: PixiVirtualKeyboard;

  public destroy() {
    this.stopCursorBlink();
    window.removeEventListener('keydown', this.onKeyDown);
    super.destroy();
  }
}

// Custom PIXI Button Class
class PixiButton extends Container {
  private background!: Graphics;
  private textDisplay!: Text;
  private onClick?: () => void;

  constructor(width: number = 120, height: number = 40, text: string = 'Button') {
    super();
    this.setupButton(width, height, text);
    this.setupEventListeners();
  }

  private setupButton(width: number, height: number, text: string) {
    // Create background
    this.background = new Graphics();
    this.background.rect(0, 0, width, height);
    this.background.fill(0x2c1810); // Dark wood color
    this.background.stroke({ color: 0xd4af37, width: 2 }); // Golden border
    this.addChild(this.background);

    // Create text display
    this.textDisplay = new Text({
      text: text,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        fill: 0xd4af37, // Golden text
        align: 'center'
      })
    });
    this.textDisplay.anchor.set(0.5);
    this.textDisplay.x = width / 2;
    this.textDisplay.y = height / 2;
    this.addChild(this.textDisplay);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private setupEventListeners() {
    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
  }

  private onPointerDown() {
    this.onClick?.();
  }

  private onPointerOver() {
    this.background.stroke({ color: 0xff6b35, width: 2 }); // Fire orange on hover
  }

  private onPointerOut() {
    this.background.stroke({ color: 0xd4af37, width: 2 }); // Back to golden
  }

  public setOnClick(callback: () => void) {
    this.onClick = callback;
  }
}

// Custom PIXI Virtual Keyboard Class
class PixiVirtualKeyboard extends Container {
  private keys: (Container & { setOnClick: (callback: () => void) => void })[] = [];
  private onKeyInput?: (key: string) => void;
  private background!: Graphics;

  constructor() {
    super();
    this.setupKeyboard();
    this.visible = false; // Hidden by default
  }

  private setupKeyboard() {
    // Create background with rounded corners effect
    this.background = new Graphics();
    this.background.rect(0, 0, 220, 280);
    this.background.fill(0x1a0f08); // Darker wood
    this.background.stroke({ color: 0xd4af37, width: 3 }); // Thick golden border
    this.addChild(this.background);

    // Add inner shadow effect
    const innerShadow = new Graphics();
    innerShadow.rect(5, 5, 210, 270);
    innerShadow.fill(0x2c1810); // Main wood color
    innerShadow.stroke({ color: 0x8b6914, width: 1 }); // Darker gold
    this.addChild(innerShadow);

    // Create compact number pad layout
    const keyLayout = [
      ['1', '2', '3'],
      ['4', '5', '6'], 
      ['7', '8', '9'],
      ['.', '0', '⌫']
    ];

    const keySize = 50;
    const keySpacing = 60;
    const startX = 25;
    const startY = 25;

    keyLayout.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        const keyButton = this.createKeyButton(key, keySize);
        keyButton.x = startX + colIndex * keySpacing;
        keyButton.y = startY + rowIndex * keySpacing;
        keyButton.setOnClick(() => this.handleKeyPress(key));
        this.addChild(keyButton);
        this.keys.push(keyButton);
      });
    });

    // Add Enter key (wider)
    const enterKey = this.createKeyButton('✓', keySize * 1.5, keySize * 0.8);
    enterKey.x = startX + keySpacing;
    enterKey.y = startY + 4 * keySpacing;
    enterKey.setOnClick(() => this.handleKeyPress('Enter'));
    this.addChild(enterKey);
    this.keys.push(enterKey);
  }

  private createKeyButton(text: string, width: number = 50, height: number = 50): Container & { setOnClick: (callback: () => void) => void } {
    const button = new Container();
    
    // Create button background with gradient effect
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x3d2817); // Medium wood
    bg.stroke({ color: 0xd4af37, width: 2 });
    button.addChild(bg);

    // Add inner highlight for 3D effect
    const highlight = new Graphics();
    highlight.rect(2, 2, width - 4, height - 4);
    highlight.fill(0x4a3020); // Lighter wood
    highlight.stroke({ color: 0xe6c547, width: 1 }); // Bright gold
    button.addChild(highlight);

    // Create text with special styling for symbols
    const displayText = text;
    let fontSize = 18;
    let textColor = 0xd4af37;

    if (text === '⌫') {
      fontSize = 20;
      textColor = 0xff6b35; // Fire orange for delete
    } else if (text === '✓') {
      fontSize = 22;
      textColor = 0x4CAF50; // Green for confirm
    } else if (text === '.') {
      fontSize = 24;
    }

    const textDisplay = new Text({
      text: displayText,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        fontWeight: 'bold'
      })
    });
    textDisplay.anchor.set(0.5);
    textDisplay.x = width / 2;
    textDisplay.y = height / 2;
    button.addChild(textDisplay);

    // Make interactive
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // Add hover effects
    button.on('pointerover', () => {
      bg.fill(0x4a3020); // Lighter on hover
      highlight.stroke({ color: 0xff6b35, width: 2 }); // Orange highlight
    });

    button.on('pointerout', () => {
      bg.fill(0x3d2817); // Back to normal
      highlight.stroke({ color: 0xe6c547, width: 1 }); // Back to gold
    });

    button.on('pointerdown', () => {
      bg.fill(0x2c1810); // Darker when pressed
    });

    button.on('pointerup', () => {
      bg.fill(0x4a3020); // Back to hover state
    });

    // Create a custom button-like object
    const customButton = button as Container & { setOnClick: (callback: () => void) => void };
    customButton.setOnClick = (callback: () => void) => {
      button.on('pointerdown', callback);
    };

    return customButton;
  }

  private handleKeyPress(key: string) {
    this.onKeyInput?.(key);
    
    // Add visual feedback
    const pressedKey = this.keys.find(k => k.children.length > 0);
    if (pressedKey) {
      // Quick scale animation for feedback
      pressedKey.scale.set(0.95);
      setTimeout(() => {
        pressedKey.scale.set(1.0);
      }, 100);
    }
  }

  public setKeyInputCallback(callback: (key: string) => void) {
    this.onKeyInput = callback;
  }

  public show() {
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }
}

const GameCanvas: React.FC = () => {
  const { settings } = useGameStore();
  const { isPaused } = useVisibilityStore();
  const { pauseForVisibility, resumeFromVisibility, playLoopingSoundEffect, stopLoopingSoundEffect, playSoundEffect } = useAudioStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const slotMachineRef = useRef<Container | null>(null);
  const symbolsRef = useRef<SlotSymbol[]>([]);
  const slotColumnsRef = useRef<Container[]>([]);
  const slotGridRef = useRef<Sprite[][]>([]);
  const columnSymbolsRef = useRef<Sprite[][]>([]);
  const spinEffectsRef = useRef<Container[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [credits, setCredits] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const autoSpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSpinningRef = useRef(false);
  const lastPauseStateRef = useRef<boolean | null>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winCharacterIndex, setWinCharacterIndex] = useState(0);
  const pixiInputRef = useRef<PixiTextInput | null>(null);
  const customButtonRef = useRef<Container | null>(null);
  const virtualKeyboardRef = useRef<PixiVirtualKeyboard | null>(null);
  
  // Set up page visibility detection
  usePageVisibility();
  
  // Handle pause/resume when visibility changes
  useEffect(() => {
    // Prevent duplicate calls
    if (lastPauseStateRef.current === isPaused) {
      return;
    }
    lastPauseStateRef.current = isPaused;
    
    if (isPaused) {
      console.log('🎮 GameCanvas: Handling pause...');
      // Pause audio
      pauseForVisibility();
      
      // Pause auto-spin
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }
    } else {
      console.log('🎮 GameCanvas: Handling resume...');
      // Resume audio
      resumeFromVisibility();
      
      // Resume auto-spin if it was active (will be handled by existing auto-spin logic)
      // The auto-spin will naturally resume when the next spin completes
    }
  }, [isPaused, pauseForVisibility, resumeFromVisibility]);

  const createSymbolsFromSpriteSheet = useCallback((charactersTexture: Texture): SlotSymbol[] => {
    // Characters arranged in 2x3 grid (6 characters total)
    const symbolWidth = charactersTexture.width / 3; // 3 columns
    const symbolHeight = charactersTexture.height / 2; // 2 rows
    const symbolNames = ['Knight', 'Wizard', 'Archer', 'Warrior', 'Barmaid', 'King'];
    
    const symbols: SlotSymbol[] = [];
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        const rect = new Rectangle(
          col * symbolWidth,
          row * symbolHeight,
          symbolWidth,
          symbolHeight
        );
        
        const texture = new Texture({
          source: charactersTexture.source,
          frame: rect
        });
        
        symbols.push({
          id: index,
          name: symbolNames[index],
          texture: texture
        });
      }
    }
    
    return symbols;
  }, []);

  const createSlotSymbol = useCallback((symbolIndex: number, x: number, y: number): Sprite => {
    const symbol = symbolsRef.current[symbolIndex % symbolsRef.current.length];
    const sprite = new Sprite(symbol.texture);
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    sprite.scale.set(0.19); // Much smaller scale to fit in the narrow slot tiles
    return sprite;
  }, []);

  const initializeSlotGrid = useCallback((slotContainer: Container, columnBgTexture: Texture) => {
    // 3 rows × 5 columns = 15 total slots
    const slotHeight = 185; // Increased spacing between character rows
    const startY = 20; // Center vertically in frame

    // Individual control for each column [col0, col1, col2, col3, col4]
    const columnWidths = [0.1, 0.1, 0.1, 0.1, 0.1]; // Individual width scale for each column
    const columnXPositions = [-187, -89, 9, 89, 187]; // Individual X positions for each column

    slotColumnsRef.current = [];
    slotGridRef.current = Array(3).fill(null).map(() => Array(5).fill(null));
    columnSymbolsRef.current = Array(5).fill(null).map(() => []);
    spinEffectsRef.current = [];

        // Create 5 columns with multiple copies for seamless infinite scrolling
    for (let col = 0; col < 5; col++) {
      const columnContainer = new Container();
      
      // Create 3 copies of each column positioned as a continuous chain
      const numCopies = 3;
      const copyHeight = slotHeight * 3; // Height of one complete column (3 slots)
      
      for (let copy = 0; copy < numCopies; copy++) {
        const copyContainer = new Container();
        
        // Position copies to form a continuous chain (copy 0 at top, copy 1 in middle, copy 2 at bottom)
        const copyYOffset = (copy - 1) * copyHeight * 0.95; // Slightly closer to eliminate small gap
        
        // Add column background for this copy
        const columnBg = new Sprite(columnBgTexture);
        columnBg.anchor.set(0.5, 0.5);
        columnBg.scale.x = columnWidths[col];
        columnBg.scale.y = 0.38;
        columnBg.x = 0;
        columnBg.y = copyYOffset;
        copyContainer.addChild(columnBg);

        // Add 3 character sprites for this copy
        for (let row = 0; row < 3; row++) {
          const symbolX = 0;
          const symbolY = -280 + row * slotHeight + slotHeight / 2 + copyYOffset;
          
          const randomSymbol = Math.floor(Math.random() * symbolsRef.current.length);
          const sprite = createSlotSymbol(randomSymbol, symbolX, symbolY);
          
          copyContainer.addChild(sprite);
          
          // Store the middle copy (copy === 1) as the main grid reference
          if (copy === 1) {
            if (!columnSymbolsRef.current[col]) {
              columnSymbolsRef.current[col] = [];
            }
            columnSymbolsRef.current[col].push(sprite);
            slotGridRef.current[row][col] = sprite;
          }
        }
        
        columnContainer.addChild(copyContainer);
      }

      // Position column with individual X position
      columnContainer.x = columnXPositions[col];
      columnContainer.y = startY;

      // Create spinning effects container for this column
      const spinEffectsContainer = new Container();
      spinEffectsContainer.x = columnXPositions[col];
      spinEffectsContainer.y = startY;
      spinEffectsContainer.visible = false; // Hidden by default
      
      // Create subtle particle effects for spinning
      const particles: Sprite[] = [];
      for (let p = 0; p < 8; p++) {
        const particle = new Sprite();
        particle.width = 2;
        particle.height = 2;
        particle.tint = 0xd4af37; // Golden color
        particle.alpha = 0.6;
        particle.x = (Math.random() - 0.5) * 60;
        particle.y = (Math.random() - 0.5) * 400;
        particles.push(particle);
        spinEffectsContainer.addChild(particle);
      }
      
      // Create separator lighting effects for all columns
      const separatorLights: Graphics[] = [];
      
      // Create left separator light (between columns)
      if (col > 0) {
        const leftLight = new Graphics();
        leftLight.x = -50; // Position between columns
        leftLight.y = 0;
        leftLight.visible = true;
        separatorLights.push(leftLight);
        spinEffectsContainer.addChild(leftLight);
      }
      
      // Create right separator light (between columns)  
      if (col < 4) {
        const rightLight = new Graphics();
        rightLight.x = 50; // Position between columns
        rightLight.y = 0;
        rightLight.visible = true;
        separatorLights.push(rightLight);
        spinEffectsContainer.addChild(rightLight);
      }
      
      // Store references for animation
      const effectsContainer = spinEffectsContainer as SpinEffectsContainer;
      effectsContainer.particles = particles;
      effectsContainer.separatorLights = separatorLights;

      slotContainer.addChild(columnContainer);
      slotContainer.addChild(spinEffectsContainer);
      slotColumnsRef.current.push(columnContainer);
      spinEffectsRef.current.push(spinEffectsContainer);
    }
  }, [createSlotSymbol]);

  const checkWins = useCallback((): { winAmount: number; winningCharacter: number | null; winningColumns: number[] } => {
    let totalWin = 0;
    let winningCharacter: number | null = null;
    const winningColumns: number[] = [];
    
    // Check horizontal lines (3 rows)
    for (let row = 0; row < 3; row++) {
      let count = 1;
      const currentSymbol = slotGridRef.current[row][0].texture;
      
      for (let col = 1; col < 5; col++) {
        if (slotGridRef.current[row][col].texture === currentSymbol) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 3) {
        totalWin += count * 10; // 10 credits per matching symbol
        
        // Add winning columns to the list (avoid duplicates)
        for (let col = 0; col < count; col++) {
          if (!winningColumns.includes(col)) {
            winningColumns.push(col);
          }
        }
        
        // Find which character this texture belongs to
        if (winningCharacter === null) {
          const symbolIndex = symbolsRef.current.findIndex(symbol => symbol.texture === currentSymbol);
          if (symbolIndex !== -1) {
            winningCharacter = symbolIndex;
          }
        }
      }
    }
    
    return { winAmount: totalWin, winningCharacter, winningColumns };
  }, []);

  const spinReels = useCallback(async (isAutoSpin: boolean = false) => {
    if (isSpinning || credits < betAmount) return;
    
    // Immediately hide all win animations and clear win states
    setShowWinAnimation(false);
    setLastWin(0);
    
    setIsSpinning(true);
    setCredits(prev => prev - betAmount);
    
    // Activate spinning effects for all columns
    spinEffectsRef.current.forEach((effectsContainer, index) => {
      effectsContainer.visible = true;
      const effects = effectsContainer as SpinEffectsContainer;
      console.log(`Column ${index}: ${effects.separatorLights?.length || 0} separator lights created`);
    });
    
    // Add CSS spinning effects
    if (canvasRef.current) {
      canvasRef.current.classList.add('slot-canvas-spinning');
    }

    // Spin each column independently - move entire column as unit
    const spinPromises = slotColumnsRef.current.map((column, colIndex) => {
      return new Promise<void>((resolve) => {
        const baseDuration = getSpinDuration(settings.animationSpeed);
        const spinDuration = baseDuration + colIndex * 300; // Staggered stop times
        let startTime = Date.now();
        const scrollSpeed = getScrollSpeed(settings.animationSpeed); // Speed of column movement
        let scrollOffset = 0;
        const originalY = column.y;
        const slotHeight = 185;
        const effectsContainer = spinEffectsRef.current[colIndex];
        // const cycleDistance = slotHeight * 3; // Not needed for individual symbol movement
        
        let pauseStartTime = 0;
        
        // Start spin sound for this column
        playLoopingSoundEffect('SPIN_REEL', `column_${colIndex}`);
        
        const columnSpin = () => {
          // Check if game is paused
          const currentState = useVisibilityStore.getState();
          if (currentState.isPaused) {
            if (pauseStartTime === 0) {
              pauseStartTime = Date.now();
              console.log(`🎬 Column ${colIndex} animation paused at progress: ${Math.min((Date.now() - startTime) / spinDuration, 1).toFixed(3)}`);
            }
            // Continue animation loop but don't update positions
            requestAnimationFrame(columnSpin);
            return;
          } else if (pauseStartTime > 0) {
            // Just resumed - adjust start time to account for pause duration
            const pauseDuration = Date.now() - pauseStartTime;
            startTime += pauseDuration;
            pauseStartTime = 0;
            console.log(`🎬 Column ${colIndex} animation resumed after ${pauseDuration}ms pause, new progress: ${Math.min((Date.now() - startTime) / spinDuration, 1).toFixed(3)}`);
          }
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / spinDuration, 1);
          
          // Move entire column with seamless infinite scrolling
          scrollOffset += scrollSpeed;
          
          // Use modulo to create seamless looping within the mask
          const cycleDistance = slotHeight * 3; // One complete column cycle
          const smoothOffset = scrollOffset % cycleDistance;
          
          // Safety check: ensure column exists before setting properties
          if (column) {
            column.y = originalY + smoothOffset;
          }
          
          // Animate spinning effects
          if (effectsContainer && effectsContainer.visible) {
            const effects = effectsContainer as SpinEffectsContainer;
            const particles = effects.particles;
            const separatorLights = effects.separatorLights;
            
            // Animate particles
            particles.forEach((particle, index) => {
              // Move particles vertically to simulate motion
              particle.y += scrollSpeed * 1.5;
              
              // Reset particle position when it goes too far
              if (particle.y > 200) {
                particle.y = -200;
                particle.x = (Math.random() - 0.5) * 60;
              }
              
              // Add subtle opacity animation
              particle.alpha = 0.3 + Math.sin(elapsed * 0.01 + index) * 0.3;
            });
            
            // Animate separator lighting effects
            if (separatorLights && separatorLights.length > 0) {
              separatorLights.forEach((light) => {
                // Clear previous drawing
                light.clear();
                
                // Create realistic lightning bolt effect
                const lightIntensity = 0.4 + Math.sin(elapsed * 0.03) * 0.1;
                const lightHeight = 600;
                const segments = 15; // Number of lightning segments
                
                // Create jagged lightning path
                const points: number[] = [];
                const centerX = 0;
                const startY = -lightHeight / 2;
                const endY = lightHeight / 2;
                const segmentHeight = lightHeight / segments;
                
                // Start point
                points.push(centerX, startY);
                
                // Create zigzag lightning pattern with downward flow
                for (let i = 1; i < segments; i++) {
                  const y = startY + i * segmentHeight;
                  // Add downward flowing animation to the zigzag
                  const flowOffset = (elapsed * 0.1) % (segmentHeight * 2);
                  const randomOffset = (Math.sin(elapsed * 0.02 + i + flowOffset * 0.01) + Math.cos(elapsed * 0.03 + i * 0.7 + flowOffset * 0.01)) * 6;
                  const x = centerX + randomOffset;
                  points.push(x, y);
                }
                
                // End point
                points.push(centerX, endY);
                
                // Draw outer glow with warm amber
                light.lineStyle(4, 0xffb347, lightIntensity * 0.2); // Warm amber glow
                light.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                  light.lineTo(points[i], points[i + 1]);
                }
                
                // Draw main lightning bolt with tavern gold
                light.lineStyle(2, 0xd4af37, lightIntensity * 0.3); // Tavern gold
                light.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                  light.lineTo(points[i], points[i + 1]);
                }
                
                // Draw inner core with bright gold
                light.lineStyle(1, 0xffd700, lightIntensity * 0.3); // Bright gold core
                light.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                  light.lineTo(points[i], points[i + 1]);
                }
                
                // Add small branching bolts (thinner)
                for (let b = 0; b < 3; b++) {
                  const branchIndex = Math.floor(segments * 0.3 + b * segments * 0.2);
                  if (branchIndex * 2 + 1 < points.length) {
                    const branchX = points[branchIndex * 2];
                    const branchY = points[branchIndex * 2 + 1];
                    const branchLength = 15 + Math.sin(elapsed * 0.04 + b) * 6;
                    const branchAngle = (b % 2 === 0 ? 1 : -1) * (Math.PI / 4 + Math.sin(elapsed * 0.03 + b) * 0.3);
                    
                    const branchEndX = branchX + Math.cos(branchAngle) * branchLength;
                    const branchEndY = branchY + Math.sin(branchAngle) * branchLength;
                    
                    light.lineStyle(1, 0xd4af37, lightIntensity * 0.6); // Gold branches
                    light.moveTo(branchX, branchY);
                    light.lineTo(branchEndX, branchEndY);
                  }
                }
                
                // Add flowing sparkling effects (moving downward)
                for (let spark = 0; spark < 4; spark++) {
                  const sparkFlow = (elapsed * 0.15 + spark * 150) % lightHeight;
                  const sparkY = startY + sparkFlow;
                  
                  // Find closest lightning point for X position
                  const segmentIndex = Math.floor(sparkFlow / segmentHeight);
                  let sparkX = centerX;
                  if (segmentIndex * 2 < points.length) {
                    sparkX = points[segmentIndex * 2] + (Math.random() - 0.5) * 4;
                  }
                  
                  const sparkSize = 0.5 + Math.random() * 1;
                  
                  light.beginFill(0xffd700, lightIntensity * (0.3 + Math.random() * 0.3)); // Gold sparks
                  light.drawCircle(sparkX, sparkY, sparkSize);
                  light.endFill();
                }
              });
            }
            
            // Add subtle alpha pulsing to column during spinning
            if (column) {
              const pulseIntensity = 0.85 + Math.sin(elapsed * 0.008) * 0.15;
              column.alpha = pulseIntensity;
            }
          }
          
          // Change symbols when cycle completes for variety
          if (column && Math.floor(scrollOffset / cycleDistance) !== Math.floor((scrollOffset - scrollSpeed) / cycleDistance)) {
            // Update all copies with new random symbols
            column.children.forEach(copyContainer => {
              copyContainer.children.forEach(child => {
                if (child instanceof Sprite && child.texture && symbolsRef.current.some(s => s.texture === child.texture)) {
                  const randomSymbol = Math.floor(Math.random() * symbolsRef.current.length);
                  child.texture = symbolsRef.current[randomSymbol].texture;
                }
              });
            });
          }
          
          if (progress < 1) {
            requestAnimationFrame(columnSpin);
          } else {
            // Stop animation and snap to clean position
            console.log(`🎬 Column ${colIndex} animation completed`);
            if (column) {
              column.y = originalY;
              column.alpha = 1; // Reset alpha
            }
            
            // Stop spin sound for this column
            stopLoopingSoundEffect('SPIN_REEL', `column_${colIndex}`);
            
            // Play stop sound for this column
            playSoundEffect('REEL_STOP');
            
            // Hide spinning effects for this column
            if (effectsContainer) {
              effectsContainer.visible = false;
              
              // Clear separator lights
              const effects = effectsContainer as SpinEffectsContainer;
              if (effects.separatorLights) {
                effects.separatorLights.forEach(light => light.clear());
              }
            }
            
            // Set final random symbols
            const columnSymbols = columnSymbolsRef.current[colIndex];
            columnSymbols.forEach(sprite => {
              const randomSymbol = Math.floor(Math.random() * symbolsRef.current.length);
              sprite.texture = symbolsRef.current[randomSymbol].texture;
            });
            
            resolve();
          }
        };
        
        requestAnimationFrame(columnSpin);
      });
    });

    // Wait for all columns to finish spinning
    await Promise.all(spinPromises);
    
    // Remove CSS spinning effects
    if (canvasRef.current) {
      canvasRef.current.classList.remove('slot-canvas-spinning');
    }
    
    // Ensure all spin sounds are stopped
    for (let i = 0; i < 5; i++) {
      stopLoopingSoundEffect('SPIN_REEL', `column_${i}`);
    }
    
    // Check for wins
    const winResult = checkWins();
    let newCredits = credits - betAmount; // Credits after bet deduction
    if (winResult.winAmount > 0) {
      newCredits += winResult.winAmount;
      setCredits(prev => prev + winResult.winAmount);
      setLastWin(winResult.winAmount);
      
      // Play win sound for each column that's part of the winning combination
      winResult.winningColumns.forEach((columnIndex, delay) => {
        setTimeout(() => {
          playSoundEffect('WIN_SOUND');
        }, delay * 150); // Stagger the win sounds by 150ms for each column
      });
      
      // Show appropriate character animation based on winning character
      if (winResult.winningCharacter !== null) {
        setWinCharacterIndex(winResult.winningCharacter);
      } else {
        setWinCharacterIndex(0); // Default to knight if no specific character
      }
      setShowWinAnimation(true);
    }
    
    setIsSpinning(false);
    
    // Continue auto-spinning if enabled and player has sufficient credits
    if (isAutoSpin && isAutoSpinningRef.current && newCredits >= betAmount) {
      autoSpinTimeoutRef.current = setTimeout(() => {
        spinReels(true);
      }, settings.autoSpinDelay); // Use settings delay between auto spins
    }
  }, [isSpinning, credits, betAmount, checkWins, settings]);

  // UI Event Handlers
  const handleBetChange = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const handleMaxBet = useCallback(() => {
    setBetAmount(100);
  }, []);

  const handleSettings = useCallback(() => {
    // Settings modal is handled by SlotUI component
  }, []);

  const handlePaytable = useCallback(() => {
    // Info modal is handled by SlotUI component
  }, []);

  const handleAutoSpin = useCallback(() => {
    if (isAutoSpinning) {
      // Stop auto-spinning
      setIsAutoSpinning(false);
      isAutoSpinningRef.current = false;
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }
    } else {
      // Check for insufficient credits before starting auto-spin
      if (credits < betAmount) {
        // Don't start auto-spin, insufficient credits toast will show via UI
        console.log('🚫 Cannot start auto-spin: insufficient credits');
        return;
      }
      
      // Start auto-spinning
      setIsAutoSpinning(true);
      isAutoSpinningRef.current = true;
      if (!isSpinning) {
        spinReels(true);
      }
    }
  }, [isAutoSpinning, isSpinning, credits, betAmount, spinReels]);

  const handleWinAnimationComplete = useCallback(() => {
    setShowWinAnimation(false);
    }, []);

  // Custom bet handlers
  const handleCustomBetSubmit = useCallback((value: number) => {
    setBetAmount(value);
  }, []);

  const handleCustomBetCancel = useCallback(() => {
    // Hide virtual keyboard when cancelled
    if (virtualKeyboardRef.current) {
      virtualKeyboardRef.current.hide();
    }
  }, []);

  const handleShowCustomInput = useCallback(() => {
    if (pixiInputRef.current && virtualKeyboardRef.current) {
      pixiInputRef.current.show();
      virtualKeyboardRef.current.show();
      // Auto-focus the input
      setTimeout(() => {
        if (pixiInputRef.current) {
          pixiInputRef.current.activate();
        }
      }, 100);
    }
  }, []);

  const handleVirtualKeyInput = useCallback((key: string) => {
    if (pixiInputRef.current) {
      pixiInputRef.current.handleVirtualKeyInput(key);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleResize = () => {
      const app = appRef.current;
      if (!app) return;
      app.renderer.resize(window.innerWidth, window.innerHeight);
      
      if (slotMachineRef.current) {
        slotMachineRef.current.x = app.screen.width / 2;
        slotMachineRef.current.y = app.screen.height / 2;
      }
      
      // Reposition custom elements
      if (customButtonRef.current) {
        customButtonRef.current.x = app.screen.width - 150;
        customButtonRef.current.y = app.screen.height / 2 - 60;
      }
      if (pixiInputRef.current) {
        pixiInputRef.current.x = app.screen.width - 230;
        pixiInputRef.current.y = app.screen.height / 2 - 10;
      }
      if (virtualKeyboardRef.current) {
        virtualKeyboardRef.current.x = app.screen.width - 250;
        virtualKeyboardRef.current.y = app.screen.height / 2 + 50;
      }
    };

    (async () => {
      if (!canvasRef.current) return;

      const app = new Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x2c1810,
        view: canvasRef.current,
      });

      appRef.current = app;

      try {
        const [backgroundTexture, frameTexture, charactersTexture, columnBgTexture] = await Promise.all([
          Assets.load('/assets/images/background.png'),
          Assets.load('/assets/images/Frame.png'),
          Assets.load('/assets/images/characters.png'),
          Assets.load('/assets/images/slot-column-bg.png')
        ]);
        
        if (cancelled) return;

        // Create background
        const bg = new Sprite(backgroundTexture);
        const scaleX = app.screen.width / bg.width;
        const scaleY = app.screen.height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.scale.set(scale);
        bg.anchor.set(0.5);
        bg.x = app.screen.width / 2;
        bg.y = app.screen.height / 2;
        app.stage.addChild(bg);

        // Create symbols from sprite sheet
        symbolsRef.current = createSymbolsFromSpriteSheet(charactersTexture);

        // Create slot machine container
        const slotMachine = new Container();
        slotMachineRef.current = slotMachine;
        
        // Create slot grid container with mask FIRST (lower z-index)
        const slotContainer = new Container();
        
        // Create mask for the transparent window area
        const maskGraphics = new Graphics();
        maskGraphics.rect(-300, -280, 600, 560); // Adjust size to match transparent window
        maskGraphics.fill(0xffffff);
        slotContainer.addChild(maskGraphics);
        slotContainer.mask = maskGraphics;
        
        slotMachine.addChild(slotContainer);

        // Initialize 3×5 slot grid with column backgrounds
        initializeSlotGrid(slotContainer, columnBgTexture);

        // Create slot machine frame AFTER (higher z-index, renders on top)
        const frameSprite = new Sprite(frameTexture);
        frameSprite.anchor.set(0.5);
        frameSprite.scale.set(0.7);
        slotMachine.addChild(frameSprite);

        // Position slot machine in center
        slotMachine.x = app.screen.width / 2;
        slotMachine.y = app.screen.height / 2;
        
        app.stage.addChild(slotMachine);

        // Add Custom button on the right side
        const customButton = new PixiButton(120, 40, 'Custom');
        customButton.x = app.screen.width - 150; // Position on right side
        customButton.y = app.screen.height / 2 - 60; // Middle Y position
        customButton.setOnClick(handleShowCustomInput);
        app.stage.addChild(customButton);
        customButtonRef.current = customButton;

        // Add PIXI text input (hidden by default)
        const pixiInput = new PixiTextInput(200, 40, 'Enter bet...');
        pixiInput.x = app.screen.width - 230; // Position on right side
        pixiInput.y = app.screen.height / 2 - 10; // Middle Y position, below button
        pixiInput.setCallbacks(handleCustomBetSubmit, handleCustomBetCancel);
        app.stage.addChild(pixiInput);
        pixiInputRef.current = pixiInput;

        // Add Virtual Keyboard (hidden by default)
        const virtualKeyboard = new PixiVirtualKeyboard();
        virtualKeyboard.x = app.screen.width - 250; // Position on right side
        virtualKeyboard.y = app.screen.height / 2 + 50; // Below the input
        virtualKeyboard.setKeyInputCallback(handleVirtualKeyInput);
        app.stage.addChild(virtualKeyboard);
        virtualKeyboardRef.current = virtualKeyboard;

        // Connect input and keyboard
        pixiInput.setVirtualKeyboard(virtualKeyboard);

        // Remove old click handler - now using UI buttons

        window.addEventListener('resize', handleResize);
      } catch (err) {
        console.error('Failed to load textures:', err);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);

      // Clean up auto-spin timeout
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }

      // Clean up PIXI elements
      if (pixiInputRef.current) {
        pixiInputRef.current.destroy();
        pixiInputRef.current = null;
      }
      if (customButtonRef.current) {
        customButtonRef.current.destroy();
        customButtonRef.current = null;
      }
      if (virtualKeyboardRef.current) {
        virtualKeyboardRef.current.destroy();
        virtualKeyboardRef.current = null;
      }

      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
        });
        appRef.current = null;
      }
    };
  }, [createSymbolsFromSpriteSheet, initializeSlotGrid]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
      <div className={`spin-particles-overlay ${isSpinning ? 'active' : ''}`}></div>
      <SlotUI
        credits={credits}
        isSpinning={isSpinning}
        isAutoSpinning={isAutoSpinning}
        lastWin={lastWin}
        onSpin={() => spinReels(false)}
        onSettings={handleSettings}
        onPaytable={handlePaytable}
        onAutoSpin={handleAutoSpin}
        onMaxBet={handleMaxBet}
        betAmount={betAmount}
        onBetChange={handleBetChange}
      />
      <WinAnimation
        isVisible={showWinAnimation}
        characterIndex={winCharacterIndex}
        onAnimationComplete={handleWinAnimationComplete}
      />
    </div>
  );
};

            export default GameCanvas;
   