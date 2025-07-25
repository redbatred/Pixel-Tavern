import { useEffect, useRef, useState, useCallback } from "react";
import {
  Application,
  Assets,
  Sprite,
  Container,
  Rectangle,
  Texture,
  Graphics,
} from "pixi.js";
import SlotUI from "../ui/SlotUI";
import WinAnimation from "./WinAnimation";
import WinModal, { type WinTier } from "./WinModal";
import {
  useGameStore,
  getSpinDuration,
  getScrollSpeed,
} from "../store/gameStore";
import {
  useVisibilityStore,
  usePageVisibility,
} from "../store/visibilityStore";
import { useAudioStore } from "../store/audioStore";
import { getWinTier, shouldShowWinModal } from "../utils/winTiers";
import "./SpinEffects.css";

interface SlotSymbol {
  id: number;
  name: string;
  texture: Texture;
}

interface SpinEffectsContainer extends Container {
  particles: Sprite[];
  separatorLights?: Graphics[];
}

const GameCanvas: React.FC = () => {
  const { settings } = useGameStore();
  const { isPaused } = useVisibilityStore();
  const {
    pauseForVisibility,
    resumeFromVisibility,
    playLoopingSoundEffect,
    stopLoopingSoundEffect,
    playSoundEffect,
  } = useAudioStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const slotMachineRef = useRef<Container | null>(null);
  const symbolsRef = useRef<SlotSymbol[]>([]);
  const slotColumnsRef = useRef<Container[]>([]);
  const slotGridRef = useRef<Sprite[][]>([]);
  const columnSymbolsRef = useRef<Sprite[][]>([]);
  const spinEffectsRef = useRef<Container[]>([]);
  const winHighlightsRef = useRef<Graphics[]>([]);
  const highlightTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
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
  const [showWinModal, setShowWinModal] = useState(false);
  const [winModalTier, setWinModalTier] = useState<WinTier>("big");

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
      console.log("🎮 GameCanvas: Handling pause...");
      // Pause audio
      pauseForVisibility();

      // Pause auto-spin
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }
    } else {
      console.log("🎮 GameCanvas: Handling resume...");
      // Resume audio
      resumeFromVisibility();

      // Resume auto-spin if it was active (will be handled by existing auto-spin logic)
      // The auto-spin will naturally resume when the next spin completes
    }
  }, [isPaused, pauseForVisibility, resumeFromVisibility]);

  const createSymbolsFromSpriteSheet = useCallback(
    (charactersTexture: Texture): SlotSymbol[] => {
      // Characters arranged in 2x3 grid (6 characters total)
      const symbolWidth = charactersTexture.width / 3; // 3 columns
      const symbolHeight = charactersTexture.height / 2; // 2 rows
      const symbolNames = [
        "Knight",
        "Wizard",
        "Archer",
        "Warrior",
        "Barmaid",
        "King",
      ];

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
            frame: rect,
          });

          symbols.push({
            id: index,
            name: symbolNames[index],
            texture: texture,
          });
        }
      }

      return symbols;
    },
    []
  );

  const createSlotSymbol = useCallback(
    (symbolIndex: number, x: number, y: number): Sprite => {
      const symbol =
        symbolsRef.current[symbolIndex % symbolsRef.current.length];
      const sprite = new Sprite(symbol.texture);
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.scale.set(0.19); // Much smaller scale to fit in the narrow slot tiles
      return sprite;
    },
    []
  );

  const initializeSlotGrid = useCallback(
    (slotContainer: Container, columnBgTexture: Texture) => {
      // 3 rows × 5 columns = 15 total slots
      const slotHeight = 185; // Increased spacing between character rows
      const startY = 20; // Center vertically in frame

      // Individual control for each column [col0, col1, col2, col3, col4]
      const columnWidths = [0.1, 0.1, 0.1, 0.1, 0.1]; // Individual width scale for each column
      const columnXPositions = [-187, -89, 9, 89, 187]; // Individual X positions for each column

      slotColumnsRef.current = [];
      slotGridRef.current = Array(3)
        .fill(null)
        .map(() => Array(5).fill(null));
      columnSymbolsRef.current = Array(5)
        .fill(null)
        .map(() => []);
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
            const symbolY =
              -280 + row * slotHeight + slotHeight / 2 + copyYOffset;

            const randomSymbol = Math.floor(
              Math.random() * symbolsRef.current.length
            );
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
    },
    [createSlotSymbol]
  );

  // Define all 20 paylines based on the provided image
  const PAYLINES = [
    // Payline 1: Top row
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    // Payline 2: Middle row
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
    // Payline 3: Bottom row
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4],
    ],
    // Payline 4: V shape
    [
      [0, 0],
      [1, 1],
      [2, 2],
      [1, 3],
      [0, 4],
    ],
    // Payline 5: Inverted V shape
    [
      [2, 0],
      [1, 1],
      [0, 2],
      [1, 3],
      [2, 4],
    ],
    // Payline 6: W shape
    [
      [0, 0],
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
    // Payline 7: M shape
    [
      [2, 0],
      [2, 1],
      [1, 2],
      [0, 3],
      [0, 4],
    ],
    // Payline 8: Zigzag up
    [
      [1, 0],
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
    ],
    // Payline 9: Zigzag down
    [
      [1, 0],
      [2, 1],
      [1, 2],
      [0, 3],
      [1, 4],
    ],
    // Payline 10: Steps up
    [
      [2, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [0, 4],
    ],
    // Payline 11: Steps down
    [
      [0, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 4],
    ],
    // Payline 12: Mountain
    [
      [1, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
    ],
    // Payline 13: Valley
    [
      [1, 0],
      [2, 1],
      [2, 2],
      [2, 3],
      [1, 4],
    ],
    // Payline 14: Lightning up
    [
      [2, 0],
      [2, 1],
      [1, 2],
      [1, 3],
      [0, 4],
    ],
    // Payline 15: Lightning down
    [
      [0, 0],
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 4],
    ],
    // Payline 16: Diagonal up
    [
      [0, 0],
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
    // Payline 17: Diagonal down
    [
      [2, 0],
      [2, 1],
      [1, 2],
      [0, 3],
      [0, 4],
    ],
    // Payline 18: Snake up
    [
      [1, 0],
      [0, 1],
      [2, 2],
      [0, 3],
      [2, 4],
    ],
    // Payline 19: Snake down
    [
      [1, 0],
      [2, 1],
      [0, 2],
      [2, 3],
      [0, 4],
    ],
    // Payline 20: Crown
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
    ],
  ];

  const checkWins = useCallback((): {
    winAmount: number;
    winningCharacter: number | null;
    winningColumns: number[];
    winningPaylines: number[];
    winningPositions: { payline: number; positions: [number, number][] }[];
  } => {
    let totalWin = 0;
    let winningCharacter: number | null = null;
    const winningColumns: number[] = [];
    const winningPaylines: number[] = [];
    const winningPositions: {
      payline: number;
      positions: [number, number][];
    }[] = [];

    // Check each payline
    PAYLINES.forEach((payline, paylineIndex) => {
      let consecutiveCount = 1;
      const firstSymbol =
        slotGridRef.current[payline[0][0]][payline[0][1]].texture;

      // Check consecutive symbols from left to right
      for (let i = 1; i < payline.length; i++) {
        const [row, col] = payline[i];
        if (slotGridRef.current[row][col].texture === firstSymbol) {
          consecutiveCount++;
        } else {
          break;
        }
      }

      // Award win if 3 or more consecutive symbols
      if (consecutiveCount >= 3) {
        const winAmount = consecutiveCount * 10; // 10 credits per matching symbol
        totalWin += winAmount;
        winningPaylines.push(paylineIndex + 1); // Store 1-based payline number

        // Debug logging
        console.log(
          `🎰 Payline ${paylineIndex + 1}: ${consecutiveCount} consecutive symbols = ${winAmount} credits`
        );

        // Store winning positions for this payline
        const positions: [number, number][] = [];
        for (let i = 0; i < consecutiveCount; i++) {
          positions.push([payline[i][0], payline[i][1]]);
        }
        winningPositions.push({ payline: paylineIndex + 1, positions });

        // Add winning columns to the list (avoid duplicates)
        for (let i = 0; i < consecutiveCount; i++) {
          const [, col] = payline[i];
          if (!winningColumns.includes(col)) {
            winningColumns.push(col);
          }
        }

        // Find which character this texture belongs to
        if (winningCharacter === null) {
          const symbolIndex = symbolsRef.current.findIndex(
            (symbol) => symbol.texture === firstSymbol
          );
          if (symbolIndex !== -1) {
            winningCharacter = symbolIndex;
          }
        }
      }
    });

    return {
      winAmount: totalWin,
      winningCharacter,
      winningColumns,
      winningPaylines,
      winningPositions,
    };
  }, []);

  // Clear all win highlights
  const clearWinHighlights = useCallback(() => {
    console.log(
      `🧹 clearWinHighlights called - clearing ${highlightTimeoutsRef.current.length} timeouts and ${winHighlightsRef.current.length} highlights`
    );

    // Clear all highlight timeouts
    highlightTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    highlightTimeoutsRef.current = [];

    // Clear all highlight graphics
    winHighlightsRef.current.forEach((highlight) => {
      if (highlight && highlight.parent) {
        // Remove ticker animation if it exists
        const ticker = appRef.current?.ticker;
        const highlightWithAnimation = highlight as any;
        if (ticker && highlightWithAnimation.pulseAnimation) {
          ticker.remove(highlightWithAnimation.pulseAnimation);
        }
        highlight.parent.removeChild(highlight);
        highlight.destroy();
      }
    });
    winHighlightsRef.current = [];

    // Fallback: Remove any remaining highlight graphics from slot machine container
    if (slotMachineRef.current) {
      const childrenToRemove: any[] = [];
      slotMachineRef.current.children.forEach((child) => {
        // Check if this looks like a highlight (Graphics object with specific properties)
        if (
          child.constructor.name === "Graphics" &&
          (child as any).isHighlight
        ) {
          childrenToRemove.push(child);
        }
      });

      childrenToRemove.forEach((child) => {
        slotMachineRef.current?.removeChild(child);
        child.destroy();
      });

      if (childrenToRemove.length > 0) {
        console.log(
          `🧹 Fallback cleanup removed ${childrenToRemove.length} orphaned highlights`
        );
      }
    }
  }, []);

  // Create beautiful win highlights for winning positions
  const createWinHighlights = useCallback(
    (
      winningPositions: { payline: number; positions: [number, number][] }[]
    ) => {
      if (!appRef.current || !slotMachineRef.current) return;

      // Clear existing highlights
      clearWinHighlights();

      // Colors for different paylines (cycling through beautiful colors)
      const paylineColors = [
        0xffd700, // Gold
        0xff6b6b, // Red
        0x4ecdc4, // Teal
        0x45b7d1, // Blue
        0x96ceb4, // Green
        0xfeca57, // Yellow
        0xff9ff3, // Pink
        0x54a0ff, // Light Blue
        0x5f27cd, // Purple
        0x00d2d3, // Cyan
        0xff9f43, // Orange
        0x1dd1a1, // Mint
        0xfd79a8, // Rose
        0x6c5ce7, // Violet
        0xa29bfe, // Lavender
        0xfd79a8, // Hot Pink
        0x00b894, // Emerald
        0xe17055, // Coral
        0x74b9ff, // Sky Blue
        0xe84393, // Magenta
      ];

      winningPositions.forEach(({ payline, positions }) => {
        const color = paylineColors[(payline - 1) % paylineColors.length];

        positions.forEach(([row, col]) => {
          // Create highlight graphics
          const highlight = new Graphics();
          (highlight as any).isHighlight = true; // Mark for cleanup identification

          // Get symbol reference
          const symbol = slotGridRef.current[row][col];
          if (!symbol) return;

          // Calculate symbol dimensions based on texture and scale
          const symbolWidth = symbol.texture.width * symbol.scale.x;
          const symbolHeight = symbol.texture.height * symbol.scale.y;

          // Create animated highlight effect with padding
          const padding = 10;
          highlight.beginFill(color, 0.3);
          highlight.lineStyle(5, color, 0.9);
          highlight.drawRoundedRect(
            -symbolWidth / 2 - padding,
            -symbolHeight / 2 - padding,
            symbolWidth + padding * 2,
            symbolHeight + padding * 2,
            15
          );
          highlight.endFill();

          // Position highlight at symbol's world position relative to slot machine
          const symbolColumn = slotColumnsRef.current[col];
          if (symbolColumn) {
            highlight.x = symbolColumn.x + symbol.x;
            highlight.y = symbolColumn.y + symbol.y;
          } else {
            // Fallback positioning
            highlight.x = symbol.x;
            highlight.y = symbol.y;
          }

          // Add pulsing animation
          let pulseDirection = 1;
          let pulseAlpha = 0.3;
          const pulseSpeed = 0.02;

          const pulseAnimation = () => {
            pulseAlpha += pulseSpeed * pulseDirection;
            if (pulseAlpha >= 0.6) {
              pulseDirection = -1;
            } else if (pulseAlpha <= 0.2) {
              pulseDirection = 1;
            }
            highlight.alpha = pulseAlpha;
          };

          // Start pulsing animation
          const ticker = appRef.current?.ticker;
          if (ticker) {
            ticker.add(pulseAnimation);

            // Store animation reference for cleanup
            (highlight as any).pulseAnimation = pulseAnimation;

            // Clean up animation after 3 seconds (but can be cleared earlier)
            const timeoutId = setTimeout(() => {
              ticker.remove(pulseAnimation);
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
                highlight.destroy();
              }
              // Remove timeout from array
              const index = highlightTimeoutsRef.current.indexOf(timeoutId);
              if (index > -1) {
                highlightTimeoutsRef.current.splice(index, 1);
              }
            }, 3000);

            // Store timeout reference for immediate cleanup
            highlightTimeoutsRef.current.push(timeoutId);
          }

          // Add to slot machine container
          slotMachineRef.current?.addChild(highlight);

          // Store reference for cleanup
          winHighlightsRef.current.push(highlight);
        });
      });
    },
    [clearWinHighlights]
  );

  const spinReels = useCallback(
    async (isAutoSpin: boolean = false) => {
      // FIRST: Clear highlights immediately when spin is attempted
      console.log(`🧹 Clearing highlights at spin start (auto: ${isAutoSpin})`);
      clearWinHighlights();

      if (isSpinning || credits < betAmount) return;

      // Immediately hide all win animations and clear win states
      setShowWinAnimation(false);
      setShowWinModal(false);
      setLastWin(0);

      setIsSpinning(true);
      setCredits((prev) => prev - betAmount);

      // Activate spinning effects for all columns
      spinEffectsRef.current.forEach((effectsContainer, index) => {
        effectsContainer.visible = true;
        const effects = effectsContainer as SpinEffectsContainer;
        console.log(
          `Column ${index}: ${effects.separatorLights?.length || 0} separator lights created`
        );
      });

      // Add CSS spinning effects
      if (canvasRef.current) {
        canvasRef.current.classList.add("slot-canvas-spinning");
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
          playLoopingSoundEffect("SPIN_REEL", `column_${colIndex}`);

          const columnSpin = () => {
            // Check if game is paused
            const currentState = useVisibilityStore.getState();
            if (currentState.isPaused) {
              if (pauseStartTime === 0) {
                pauseStartTime = Date.now();
                console.log(
                  `🎬 Column ${colIndex} animation paused at progress: ${Math.min((Date.now() - startTime) / spinDuration, 1).toFixed(3)}`
                );
              }
              // Continue animation loop but don't update positions
              requestAnimationFrame(columnSpin);
              return;
            } else if (pauseStartTime > 0) {
              // Just resumed - adjust start time to account for pause duration
              const pauseDuration = Date.now() - pauseStartTime;
              startTime += pauseDuration;
              pauseStartTime = 0;
              console.log(
                `🎬 Column ${colIndex} animation resumed after ${pauseDuration}ms pause, new progress: ${Math.min((Date.now() - startTime) / spinDuration, 1).toFixed(3)}`
              );
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
                    const randomOffset =
                      (Math.sin(elapsed * 0.02 + i + flowOffset * 0.01) +
                        Math.cos(
                          elapsed * 0.03 + i * 0.7 + flowOffset * 0.01
                        )) *
                      6;
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
                    const branchIndex = Math.floor(
                      segments * 0.3 + b * segments * 0.2
                    );
                    if (branchIndex * 2 + 1 < points.length) {
                      const branchX = points[branchIndex * 2];
                      const branchY = points[branchIndex * 2 + 1];
                      const branchLength =
                        15 + Math.sin(elapsed * 0.04 + b) * 6;
                      const branchAngle =
                        (b % 2 === 0 ? 1 : -1) *
                        (Math.PI / 4 + Math.sin(elapsed * 0.03 + b) * 0.3);

                      const branchEndX =
                        branchX + Math.cos(branchAngle) * branchLength;
                      const branchEndY =
                        branchY + Math.sin(branchAngle) * branchLength;

                      light.lineStyle(1, 0xd4af37, lightIntensity * 0.6); // Gold branches
                      light.moveTo(branchX, branchY);
                      light.lineTo(branchEndX, branchEndY);
                    }
                  }

                  // Add flowing sparkling effects (moving downward)
                  for (let spark = 0; spark < 4; spark++) {
                    const sparkFlow =
                      (elapsed * 0.15 + spark * 150) % lightHeight;
                    const sparkY = startY + sparkFlow;

                    // Find closest lightning point for X position
                    const segmentIndex = Math.floor(sparkFlow / segmentHeight);
                    let sparkX = centerX;
                    if (segmentIndex * 2 < points.length) {
                      sparkX =
                        points[segmentIndex * 2] + (Math.random() - 0.5) * 4;
                    }

                    const sparkSize = 0.5 + Math.random() * 1;

                    light.beginFill(
                      0xffd700,
                      lightIntensity * (0.3 + Math.random() * 0.3)
                    ); // Gold sparks
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
            if (
              column &&
              Math.floor(scrollOffset / cycleDistance) !==
                Math.floor((scrollOffset - scrollSpeed) / cycleDistance)
            ) {
              // Update all copies with new random symbols
              column.children.forEach((copyContainer) => {
                copyContainer.children.forEach((child) => {
                  if (
                    child instanceof Sprite &&
                    child.texture &&
                    symbolsRef.current.some((s) => s.texture === child.texture)
                  ) {
                    const randomSymbol = Math.floor(
                      Math.random() * symbolsRef.current.length
                    );
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
              stopLoopingSoundEffect("SPIN_REEL", `column_${colIndex}`);

              // Play stop sound for this column
              playSoundEffect("REEL_STOP");

              // Hide spinning effects for this column
              if (effectsContainer) {
                effectsContainer.visible = false;

                // Clear separator lights
                const effects = effectsContainer as SpinEffectsContainer;
                if (effects.separatorLights) {
                  effects.separatorLights.forEach((light) => light.clear());
                }
              }

              // Set final random symbols
              const columnSymbols = columnSymbolsRef.current[colIndex];
              columnSymbols.forEach((sprite) => {
                const randomSymbol = Math.floor(
                  Math.random() * symbolsRef.current.length
                );
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
        canvasRef.current.classList.remove("slot-canvas-spinning");
      }

      // Ensure all spin sounds are stopped
      for (let i = 0; i < 5; i++) {
        stopLoopingSoundEffect("SPIN_REEL", `column_${i}`);
      }

      // Check for wins
      const winResult = checkWins();
      let newCredits = credits - betAmount; // Credits after bet deduction
      if (winResult.winAmount > 0) {
        newCredits += winResult.winAmount;
        setCredits((prev) => prev + winResult.winAmount);
        setLastWin(winResult.winAmount);

        // Log winning paylines for debugging
        console.log(
          `🎰 WIN! Paylines: ${winResult.winningPaylines.join(", ")} | Amount: ${winResult.winAmount} credits`
        );

        // Create beautiful win highlights
        console.log(
          `✨ Creating win highlights for ${winResult.winningPositions.length} paylines`
        );
        createWinHighlights(winResult.winningPositions);

        // Play win sound for each column that's part of the winning combination
        winResult.winningColumns.forEach((_, delay) => {
          setTimeout(() => {
            playSoundEffect("WIN_SOUND");
          }, delay * 150); // Stagger the win sounds by 150ms for each column
        });

        // Check if this is a big win that deserves a special modal
        if (shouldShowWinModal(winResult.winAmount, betAmount)) {
          const tier = getWinTier(winResult.winAmount, betAmount);
          if (tier) {
            setWinModalTier(tier);
            setShowWinModal(true);
            console.log(
              `🎉 ${tier.toUpperCase()} WIN! ${(winResult.winAmount / betAmount).toFixed(1)}x multiplier`
            );
          }
        }

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
          // Clear highlights immediately when auto-spin timeout fires
          console.log(
            `🧹 Auto-spin timeout fired - clearing highlights before next spin`
          );
          clearWinHighlights();
          spinReels(true);
        }, settings.autoSpinDelay); // Use settings delay between auto spins
      }
    },
    [isSpinning, credits, betAmount, checkWins, settings]
  );

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
      // Clear any lingering win highlights and modals when stopping auto-spin
      clearWinHighlights();
      setShowWinModal(false);
    } else {
      // Check for insufficient credits before starting auto-spin
      if (credits < betAmount) {
        // Don't start auto-spin, insufficient credits toast will show via UI
        console.log("🚫 Cannot start auto-spin: insufficient credits");
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

      // Custom PIXI elements removed - using React UI instead
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
        const [
          backgroundTexture,
          frameTexture,
          charactersTexture,
          columnBgTexture,
        ] = await Promise.all([
          Assets.load("/assets/images/background.png"),
          Assets.load("/assets/images/Frame.png"),
          Assets.load("/assets/images/characters.png"),
          Assets.load("/assets/images/slot-column-bg.png"),
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

        // Custom PIXI UI elements removed - using React UI components instead

        // Remove old click handler - now using UI buttons

        window.addEventListener("resize", handleResize);
      } catch (err) {
        console.error("Failed to load textures:", err);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);

      // Clean up auto-spin timeout
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }

      // Clean up win highlights
      clearWinHighlights();

      // Custom PIXI elements cleanup removed - using React UI instead

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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} />
      <div
        className={`spin-particles-overlay ${isSpinning ? "active" : ""}`}
      ></div>
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
      <WinModal
        isVisible={showWinModal}
        winAmount={lastWin}
        betAmount={betAmount}
        winTier={winModalTier}
        onClose={() => setShowWinModal(false)}
      />
    </div>
  );
};

export default GameCanvas;
