import { Application, Container, Sprite, Graphics } from 'pixi.js'
import { gsap } from 'gsap'
import { GameConfig } from '../config/GameConfig'
import type { GameTextures } from '../assets/AssetLoader'
import { PerformanceOptimizer } from '../utils/performanceOptimizer'

export interface SlotSymbol {
  sprite: Sprite
  symbolId: number
}

export class SlotMachine {
  public container: Container
  private app: Application
  private slotColumns: Container[] = []
  private slotGrid: Sprite[][] = []
  private columnSymbols: Sprite[][] = []
  private spinEffects: Container[] = []
  private lightningEffects: Container[] = []
  private winHighlights: Graphics[] = []
  private textures: GameTextures | null = null
  private background: Sprite | null = null
  private frame: Sprite | null = null
  private isSpinning: boolean = false
  private symbolPool: Sprite[] = [] // Object pool for sprites
  private effectsPool: Graphics[] = [] // Pool for graphics objects
  private frameCount: number = 0 // For performance monitoring
  private lastLightningTime: number = 0 // For frame-rate independent lightning animations
  private currentSpinTweens: any[] = [] // Store current spin GSAP tweens for pause/resume
  private isSpinPaused: boolean = false

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    
    // Optimize container for better batching
    PerformanceOptimizer.optimizeContainer(this.container)
    
    // Initialize object pools
    this.symbolPool = []
    this.effectsPool = []
  }

  async init(textures: GameTextures): Promise<void> {
    this.textures = textures
    
    // Create slot grid
    this.createSlotGrid()
    
    // Create frame (on top)
    this.createFrame()
  }

  // Background is now handled by CSS in main.ts
  // private createBackground(): void {
  //   if (!this.textures) return
  //   
  //   this.background = new Sprite(this.textures.background)
  //   this.background.anchor.set(0.5)
  //   
  //   // Scale to cover screen
  //   const scaleX = this.app.screen.width / this.background.width
  //   const scaleY = this.app.screen.height / this.background.height
  //   const scale = Math.max(scaleX, scaleY)
  //   this.background.scale.set(scale)
  //   
  //   this.container.addChild(this.background)
  // }

  private createFrame(): void {
    if (!this.textures) return
    
    this.frame = new Sprite(this.textures.frame)
    this.frame.anchor.set(0.5)
    this.frame.scale.set(GameConfig.SLOT_MACHINE.FRAME_SCALE)
    
    this.container.addChild(this.frame)
  }

  private createSlotGrid(): void {
    if (!this.textures) return
    
    const slotContainer = new Container()
    
    // Create mask for the transparent window area
    const maskGraphics = new Graphics()
    maskGraphics.rect(
      -GameConfig.SLOT_MACHINE.MASK_WIDTH / 2,
      -GameConfig.SLOT_MACHINE.MASK_HEIGHT / 2,
      GameConfig.SLOT_MACHINE.MASK_WIDTH,
      GameConfig.SLOT_MACHINE.MASK_HEIGHT
    )
    maskGraphics.fill(0xffffff)
    slotContainer.addChild(maskGraphics)
    slotContainer.mask = maskGraphics

    // Initialize arrays
    this.slotColumns = []
    this.slotGrid = Array(GameConfig.SLOT_ROWS).fill(null).map(() => Array(GameConfig.SLOT_COLUMNS).fill(null))
    this.columnSymbols = Array(GameConfig.SLOT_COLUMNS).fill(null).map(() => [])
    this.spinEffects = []

    // Create 5 columns
    for (let col = 0; col < GameConfig.SLOT_COLUMNS; col++) {
      const columnContainer = new Container()
      
      // Create 3 copies for seamless scrolling
      const numCopies = 3
      const copyHeight = GameConfig.SLOT_MACHINE.SLOT_HEIGHT * GameConfig.SLOT_ROWS
      
      for (let copy = 0; copy < numCopies; copy++) {
        const copyContainer = new Container()
        const copyYOffset = (copy - 1) * copyHeight * 0.95
        
        // Add column background
        const columnBg = new Sprite(this.textures.columnBg)
        columnBg.anchor.set(0.5, 0.5)
        columnBg.scale.x = GameConfig.SLOT_MACHINE.COLUMN_WIDTHS[col]
        columnBg.scale.y = 0.38
        columnBg.x = 0
        columnBg.y = copyYOffset
        copyContainer.addChild(columnBg)
        
        // Add symbols with precise vertical alignment
        for (let row = 0; row < GameConfig.SLOT_ROWS; row++) {
          const symbolX = 0
          // Calculate precise Y position for consistent vertical alignment
          const baseY = -280
          const rowSpacing = GameConfig.SLOT_MACHINE.SLOT_HEIGHT
          const centerOffset = GameConfig.SLOT_MACHINE.SLOT_HEIGHT / 2
          const symbolY = baseY + (row * rowSpacing) + centerOffset + copyYOffset
          
          const randomSymbol = Math.floor(Math.random() * this.textures.symbols.length)
          const sprite = this.createSlotSymbol(randomSymbol, symbolX, symbolY)
          
          copyContainer.addChild(sprite)
          
          // Store middle copy as main grid reference
          if (copy === 1) {
            if (!this.columnSymbols[col]) {
              this.columnSymbols[col] = []
            }
            this.columnSymbols[col].push(sprite)
            this.slotGrid[row][col] = sprite
          }
        }
        
        columnContainer.addChild(copyContainer)
      }
      
      // Position column
      columnContainer.x = GameConfig.SLOT_MACHINE.COLUMN_X_POSITIONS[col]
      columnContainer.y = 20 // startY
      
      // Create spinning effects container
      const spinEffectsContainer = new Container()
      spinEffectsContainer.x = GameConfig.SLOT_MACHINE.COLUMN_X_POSITIONS[col]
      spinEffectsContainer.y = 20
      spinEffectsContainer.visible = false
      
      // Create particles
      for (let p = 0; p < GameConfig.SLOT_MACHINE.PARTICLE_COUNT; p++) {
        const particle = new Sprite()
        particle.width = 2
        particle.height = 2
        particle.tint = 0xd4af37 // Golden color
        particle.alpha = 0.6
        particle.x = (Math.random() - 0.5) * 60
        particle.y = (Math.random() - 0.5) * 400
        spinEffectsContainer.addChild(particle)
      }
      
      slotContainer.addChild(columnContainer)
      slotContainer.addChild(spinEffectsContainer)
      this.slotColumns.push(columnContainer)
      this.spinEffects.push(spinEffectsContainer)
    }
    
    this.container.addChild(slotContainer)
  }

  private createSlotSymbol(symbolIndex: number, x: number, y: number): Sprite {
    if (!this.textures) throw new Error('Textures not loaded')
    
    const texture = this.textures.symbols[symbolIndex % this.textures.symbols.length]
    const sprite = PerformanceOptimizer.getSprite()
    sprite.texture = texture
    
    // Optimize sprite for better performance
    PerformanceOptimizer.optimizeSprite(sprite)
    
    // Do NOT apply character-specific Y offset here - all symbols use the standard grid position
    // Character-specific adjustments will be applied only for final results
    
    // Ensure consistent vertical alignment by setting anchor to center
    sprite.anchor.set(0.5, 0.5)
    sprite.x = x
    sprite.y = y // Use the exact Y position passed in (no character offset)
    
    // Apply consistent scaling
    sprite.scale.set(GameConfig.SLOT_MACHINE.SYMBOL_SCALE)
    sprite.visible = true
    
    return sprite
  }

  // Spin animation
  async spinReels(duration: number, scrollSpeed: number, onColumnStop?: (columnIndex: number) => void, isInstant: boolean = false): Promise<number[][]> {
    
    // FIRST: Generate final results before animation starts (like original game)
    const finalResults = this.generateFinalResults()
    
    // If instant mode, skip all animation and return results immediately
    if (isInstant) {
      // Just update the display with final results
      this.updateDisplayWithResults(finalResults)
      
      // Call column stop callbacks immediately if provided
      if (onColumnStop) {
        for (let i = 0; i < 5; i++) {
          onColumnStop(i)
        }
      }
      
      return finalResults
    }
    
    // Show spin effects (but reduce in low performance mode)
    this.spinEffects.forEach(effect => {
      effect.visible = true
    })

    const spinPromises = this.slotColumns.map((column, colIndex) => {
      return new Promise<void>((resolve) => {
        const spinDuration = duration + colIndex * 200 // Staggered stops (reduced from 300ms to 200ms)
        let scrollOffset = 0
        const originalY = column.y
        let lastTime = performance.now()
        
        const spinEffects = this.spinEffects
        const slotMachine = this // Store reference for the onUpdate function
        
        const tween = gsap.to({}, {
          duration: spinDuration / 1000,
          ease: 'power2.out',
          onUpdate: function() {
            // Check if spin is paused
            if (slotMachine.isSpinPaused) {
              return // Skip update when paused
            }
            
            // Make animation frame-rate independent using delta time
            const currentTime = performance.now()
            const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to 60fps (16.67ms per frame)
            lastTime = currentTime
            
            scrollOffset += scrollSpeed * deltaTime
            const cycleDistance = GameConfig.SLOT_MACHINE.SLOT_HEIGHT * 3
            const smoothOffset = scrollOffset % cycleDistance
            column.y = originalY + smoothOffset
            
            // Animate spin effects with frame-rate independence
            const effectsContainer = spinEffects[colIndex]
            if (effectsContainer && effectsContainer.visible) {
              effectsContainer.children.forEach((particle: any, index: number) => {
                if (particle instanceof Sprite && particle.visible) {
                  particle.y += scrollSpeed * 1.5 * deltaTime
                  if (particle.y > 200) {
                    particle.y = -200
                    particle.x = (Math.random() - 0.5) * 60
                  }
                  particle.alpha = 0.3 + Math.sin(Date.now() * 0.01 + index) * 0.3
                }
              })
            }
          },
          onComplete: () => {
            // Remove this tween from the active list
            const index = slotMachine.currentSpinTweens.indexOf(tween)
            if (index > -1) {
              slotMachine.currentSpinTweens.splice(index, 1)
            }
            
            // Snap to clean position
            column.y = originalY
            
            // Stop lightning effect for this column
            this.stopLightningForColumn(colIndex)
            
            // Call callback for column stop (convert to 1-indexed)
            onColumnStop?.(colIndex + 1)
            
            // Hide effects
            spinEffects[colIndex].visible = false
            
            // Set final symbols to pre-generated results
            this.setFinalSymbolsForColumn(colIndex, finalResults)
            
            resolve()
          }
        })
        
        // Store the tween for pause/resume functionality
        this.currentSpinTweens.push(tween)
      })
    })

    await Promise.all(spinPromises)
    
    // Return the pre-generated results (guaranteed to match what's displayed)
    return finalResults
  }

  private generateFinalResults(): number[][] {
    const results: number[][] = []
    
    // Equal probability for all characters (6 character types: 0-5)
    const totalCharacters = 6
    
    for (let row = 0; row < GameConfig.SLOT_ROWS; row++) {
      results[row] = []
      for (let col = 0; col < GameConfig.SLOT_COLUMNS; col++) {
        // Generate random character index with equal probability for all
        results[row][col] = Math.floor(Math.random() * totalCharacters)
      }
    }
    
    return results
  }

  // Helper function to get Y offset for each character
  private getCharacterYOffset(symbolIndex: number): number {
    const characterYOffsets = [
      -5,    // Character 0 (King) - baseline
      0,   // Character 1 (Knight/Warrior) - move up 3px
      -5,    // Character 2 (Viking/Barbarian) - move down 2px  
      10,   // Character 3 (Mage/Wizard) - move up 5px
      10,    // Character 4 (Archer) - move down 1px
      10    // Character 5 (Knight in armor) - move up 2px
    ]
    return characterYOffsets[symbolIndex] || 0
  }

  private setFinalSymbolsForColumn(columnIndex: number, finalResults: number[][]): void {
    if (!this.textures) return
    
    const columnSymbols = this.columnSymbols[columnIndex]
    columnSymbols.forEach((sprite, rowIndex) => {
      const symbolIndex = finalResults[rowIndex][columnIndex]
      
      // Get the character-specific Y offset
      const yOffset = this.getCharacterYOffset(symbolIndex)
      
      // Calculate the base grid Y position for this row
      const baseY = -280 + (rowIndex * GameConfig.SLOT_MACHINE.SLOT_HEIGHT) + (GameConfig.SLOT_MACHINE.SLOT_HEIGHT / 2)
      
      // Apply texture change
      sprite.texture = this.textures!.symbols[symbolIndex]
      
      // Ensure consistent properties after texture change
      sprite.anchor.set(0.5, 0.5)
      sprite.scale.set(GameConfig.SLOT_MACHINE.SYMBOL_SCALE)
      
      // Apply the character-specific Y position (base position + character offset)
      sprite.y = baseY + yOffset
    })
  }

  private updateDisplayWithResults(finalResults: number[][]): void {
    // Update all columns immediately with final results
    for (let col = 0; col < GameConfig.SLOT_COLUMNS; col++) {
      this.setFinalSymbolsForColumn(col, finalResults)
    }
    
    // Hide all spin effects
    this.spinEffects.forEach(effect => {
      effect.visible = false
    })
    
    // Stop all lightning effects
    for (let col = 0; col < GameConfig.SLOT_COLUMNS; col++) {
      this.stopLightningForColumn(col)
    }
  }

  // Win highlighting with advanced GSAP animations
  showWinHighlights(winningPositions: Array<{ payline: number; positions: [number, number][] }>): void {
    this.clearWinHighlights()
    
    // Vibrant neon colors for different paylines
    const paylineColors = [
      0x00ffff, 0xff0080, 0x00ff00, 0xff8000, 0x8000ff,
      0xffff00, 0xff0040, 0x0080ff, 0x40ff00, 0xff4000,
      0x80ff00, 0x0040ff, 0xff0000, 0x00ff80, 0x8040ff,
      0xff8040, 0x4080ff, 0x80ff40, 0xff4080, 0x40ff80
    ]

    winningPositions.forEach(({ payline, positions }) => {
      const color = paylineColors[(payline - 1) % paylineColors.length]
      
      positions.forEach(([row, col], index) => {
        const highlight = PerformanceOptimizer.getGraphics()
        const symbol = this.slotGrid[row][col]
        
        if (!symbol) {
          PerformanceOptimizer.returnGraphics(highlight)
          return
        }
        
        const symbolWidth = symbol.texture.width * symbol.scale.x
        const symbolHeight = symbol.texture.height * symbol.scale.y
        
        // Easy-to-modify highlight box dimensions
        const boxWidth = symbolWidth + 18   // Change this number to make wider/narrower
        const boxHeight = symbolHeight + 55 // Change this number to make taller/shorter
        const boxX = -boxWidth / 2          // Center X position
        const boxY = -boxHeight / 1.95      // Center Y position
        
        // Create inner edge glow effect
        // Clear any previous drawing
        highlight.clear()
        
        // Create the inner glow that follows the cell edges
        // First, create a subtle inner shadow/glow
        highlight.beginFill(0x000000, 0)  // Transparent fill
        
        // Inner glow effect - main colored line
        highlight.lineStyle(3, color, 1.0)
        
        // Draw the main highlight box (easy to modify now!)
        highlight.drawRoundedRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          12
        )
        
        // Add a second inner line for more pronounced glow (white core)
        highlight.lineStyle(1, 0xffffff, 0.9)
        
        // Inner white glow (slightly smaller)
        highlight.drawRoundedRect(
          boxX + 1,
          boxY + 1,
          boxWidth - 2,
          boxHeight - 2,
          11
        )
        
        highlight.endFill()
        
        // Position relative to symbol
        const symbolColumn = this.slotColumns[col]
        if (symbolColumn) {
          highlight.x = symbolColumn.x + symbol.x
          highlight.y = symbolColumn.y + symbol.y
        }
        
        // Smooth inner glow animation
        const tl = gsap.timeline({ repeat: -1 })
        
        // Initial state - fixed scale, no size changes
        gsap.set(highlight, { scale: 1, alpha: 0 })
        
        // Staggered entrance animation - fade in smoothly
        tl.to(highlight, {
          alpha: 1.0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.08
        })
        // Gentle pulsing glow effect for the inner light
        .to(highlight, {
          pixi: { 
            brightness: 1.6,
            saturate: 1.4
          },
          duration: 0.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        })
        
        this.container.addChild(highlight)
        this.winHighlights.push(highlight)
      })
    })
    
    // Auto-clear with fade out animation
    gsap.delayedCall(3, () => {
      // Advanced fade out with stagger - no scale changes
      gsap.to(this.winHighlights, {
        alpha: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.in",
        onComplete: () => {
          this.clearWinHighlights()
        }
      })
    })
  }

  clearWinHighlights(): void {
    this.winHighlights.forEach(highlight => {
      gsap.killTweensOf(highlight)
      if (highlight.parent) {
        highlight.parent.removeChild(highlight)
      }
      PerformanceOptimizer.returnGraphics(highlight)
    })
    this.winHighlights = []
  }

  // Handle state changes
  handleStateChange(stateValue: string, _context: any): void {
    switch (stateValue) {
      case 'spinning':
        // Clear any existing highlights
        this.clearWinHighlights()
        this.updatePerformanceMetrics()
        break
      case 'showingWin':
        // Show slot win highlights along with PIXI character animation
        if (_context.winningPositions && _context.winningPositions.length > 0) {
          this.showWinHighlights(_context.winningPositions)
        }
        break
    }
  }

  // Handle window resize
  handleResize(width: number, height: number): void {
    if (this.background) {
      const scaleX = width / this.background.texture.width
      const scaleY = height / this.background.texture.height
      const scale = Math.max(scaleX, scaleY)
      this.background.scale.set(scale)
    }
  }

  // Create lightning effects for column separators
  private createLightningEffects(): void {
    // Clear existing lightning effects
    this.clearLightningEffects()

    // Create lightning effects between columns (4 separators for 5 columns)
    for (let i = 0; i < 4; i++) {
      const lightningContainer = new Container()
      
      // Position between columns
      const columnPositions = GameConfig.SLOT_MACHINE.COLUMN_X_POSITIONS
      lightningContainer.x = columnPositions[i] + ((columnPositions[i + 1] - columnPositions[i]) / 2)
      lightningContainer.y = 18
      lightningContainer.visible = true

      // Create main lightning bolt
      const lightning = new Graphics()
      lightningContainer.addChild(lightning)

      // Create particle effects
      const particles: Sprite[] = []
      for (let p = 0; p < 6; p++) {
        const particle = new Sprite()
        particle.width = 2
        particle.height = 2
        particle.tint = 0xd4af37 // Golden color
        particle.alpha = 0.6
        particle.x = (Math.random() - 0.5) * 20
        particle.y = (Math.random() - 0.5) * 250 // Reduced from 400 to 250 to match shorter lightning
        particles.push(particle)
        lightningContainer.addChild(particle)
      }

      // Store references and metadata
      ;(lightningContainer as any).lightning = lightning
      ;(lightningContainer as any).particles = particles
      ;(lightningContainer as any).separatorIndex = i
      ;(lightningContainer as any).isActive = true

      this.container.addChild(lightningContainer)
      this.lightningEffects.push(lightningContainer)
    }
  }

  // Stop lightning effect for a specific separator (when column stops)
  stopLightningForColumn(columnIndex: number): void {
    // Lightning separator index corresponds to the column that just stopped
    // Separator 0 is between columns 0-1, separator 1 is between columns 1-2, etc.
    // We want to stop the lightning when the right column stops
    const separatorIndex = columnIndex - 1
    
    if (separatorIndex >= 0 && separatorIndex < this.lightningEffects.length) {
      const lightningContainer = this.lightningEffects[separatorIndex]
      if (lightningContainer && (lightningContainer as any).isActive) {
        // Mark as inactive and fade out
        ;(lightningContainer as any).isActive = false
        
        gsap.to(lightningContainer, {
          alpha: 0,
          duration: 0.3,
          ease: 'power2.out',
          onComplete: () => {
            lightningContainer.visible = false
          }
        })
      }
    }
  }

  // Animate lightning effects during spinning
  private animateLightningEffects(): void {
    if (!this.isSpinning) return

    this.lightningEffects.forEach((container, index) => {
      // Only animate if this lightning effect is still active
      if (!(container as any).isActive) return

      const lightning = (container as any).lightning as Graphics
      const particles = (container as any).particles as Sprite[]

      if (lightning) {
        // Clear previous drawing
        lightning.clear()

        // Create realistic lightning bolt effect
        const time = Date.now()
        const lightIntensity = 0.8 + Math.sin(time * 0.03 + index) * 0.1
        const lightHeight = 525 // Reduced from 600 to 350 for shorter lightning
        const segments = 15

        // Create jagged lightning path
        const points: number[] = []
        const centerX = 0
        const startY = -lightHeight / 2
        const endY = lightHeight / 2
        const segmentHeight = lightHeight / segments

        // Start point
        points.push(centerX, startY)

        // Create zigzag lightning pattern with downward flow
        for (let i = 1; i < segments; i++) {
          const y = startY + i * segmentHeight
          const flowOffset = (time * 0.1) % (segmentHeight * 2)
          const randomOffset = (Math.sin(time * 0.02 + i + flowOffset * 0.01) + 
                               Math.cos(time * 0.03 + i * 0.7 + flowOffset * 0.01)) * 6
          const x = centerX + randomOffset
          points.push(x, y)
        }

        // End point
        points.push(centerX, endY)

        // Draw outer glow with warm amber
        lightning.lineStyle(4, 0xffb347, lightIntensity * 0.2)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }

        // Draw main lightning bolt with tavern gold
        lightning.lineStyle(2, 0xd4af37, lightIntensity * 0.3)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }

        // Draw inner core with bright gold
        lightning.lineStyle(1, 0xffd700, lightIntensity * 0.3)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }

        // Add small branching bolts
        for (let b = 0; b < 3; b++) {
          const branchIndex = Math.floor(segments * 0.3 + b * segments * 0.2)
          if (branchIndex * 2 + 1 < points.length) {
            const branchX = points[branchIndex * 2]
            const branchY = points[branchIndex * 2 + 1]
            const branchLength = 15 + Math.sin(time * 0.04 + b) * 6
            const branchAngle = (b % 2 === 0 ? 1 : -1) * 
                               (Math.PI / 4 + Math.sin(time * 0.03 + b) * 0.3)

            const branchEndX = branchX + Math.cos(branchAngle) * branchLength
            const branchEndY = branchY + Math.sin(branchAngle) * branchLength

            lightning.lineStyle(1, 0xd4af37, lightIntensity * 0.6)
            lightning.moveTo(branchX, branchY)
            lightning.lineTo(branchEndX, branchEndY)
          }
        }

        // Add flowing sparkling effects
        for (let spark = 0; spark < 4; spark++) {
          const sparkFlow = (time * 0.15 + spark * 150) % lightHeight
          const sparkY = startY + sparkFlow

          const segmentIndex = Math.floor(sparkFlow / segmentHeight)
          let sparkX = centerX
          if (segmentIndex * 2 < points.length) {
            sparkX = points[segmentIndex * 2] + (Math.random() - 0.5) * 4
          }

          const sparkSize = 0.5 + Math.random() * 1
          lightning.beginFill(0xffd700, lightIntensity * (0.3 + Math.random() * 0.3))
          lightning.drawCircle(sparkX, sparkY, sparkSize)
          lightning.endFill()
        }
      }

      // Animate particles with frame-rate independence
      if (particles) {
        const time = Date.now()
        const deltaTime = this.lastLightningTime ? (time - this.lastLightningTime) / 16.67 : 1 // Normalize to 60fps
        this.lastLightningTime = time
        
        particles.forEach((particle, pIndex) => {
          particle.y += 2 * deltaTime // Frame-rate independent movement
          if (particle.y > 125) { // Reduced from 200 to 125 to match shorter lightning
            particle.y = -125  // Reduced from -200 to -125
            particle.x = (Math.random() - 0.5) * 20
          }
          particle.alpha = 0.3 + Math.sin(time * 0.01 + pIndex) * 0.3
        })
      }
    })

    // Continue animation if still spinning
    if (this.isSpinning) {
      requestAnimationFrame(() => this.animateLightningEffects())
    }
  }

  // Clear lightning effects
  private clearLightningEffects(): void {
    this.lightningEffects.forEach(container => {
      // Kill any running animations
      gsap.killTweensOf(container)
      
      if (container.parent) {
        container.parent.removeChild(container)
      }
      container.destroy({ children: true })
    })
    this.lightningEffects = []
  }

  // Start spinning effects
  startSpinEffects(): void {
    this.isSpinning = true
    
    // Add CSS spinning class to canvas
    const canvas = this.app.canvas
    if (canvas) {
      canvas.classList.add('slot-canvas-spinning')
    }

    // Activate particle overlay
    const particleOverlay = document.querySelector('.spin-particles-overlay') as HTMLElement
    if (particleOverlay) {
      particleOverlay.classList.add('active')
    }

    // Create and animate lightning effects
    this.createLightningEffects()
    this.animateLightningEffects()
  }

  // Stop spinning effects
  stopSpinEffects(): void {
    this.isSpinning = false

    // Remove CSS spinning class from canvas
    const canvas = this.app.canvas
    if (canvas) {
      canvas.classList.remove('slot-canvas-spinning')
    }

    // Deactivate particle overlay
    const particleOverlay = document.querySelector('.spin-particles-overlay') as HTMLElement
    if (particleOverlay) {
      particleOverlay.classList.remove('active')
    }

    // Clear lightning effects
    this.clearLightningEffects()
  }

  destroy(): void {
    this.clearWinHighlights()
    this.clearLightningEffects()
    this.stopSpinEffects()
    gsap.killTweensOf(this.slotColumns)
    
    // Return symbols to pool before destroying
    this.slotGrid.forEach(row => {
      row.forEach(sprite => {
        if (sprite) {
          PerformanceOptimizer.returnSprite(sprite)
        }
      })
    })
    
    // Clean up object pools
    this.symbolPool.forEach(sprite => sprite.destroy())
    this.effectsPool.forEach(graphic => graphic.destroy())
    this.symbolPool.length = 0
    this.effectsPool.length = 0
    
    this.container.destroy({ children: true })
  }

  /**
   * Pause all current spinning animations
   */
  pauseSpinning(): void {
    this.isSpinPaused = true
    this.currentSpinTweens.forEach(tween => {
      if (tween && tween.pause) {
        tween.pause()
      }
    })
    console.log(`⏸️ Paused ${this.currentSpinTweens.length} spin tweens`)
  }

  /**
   * Resume all paused spinning animations
   */
  resumeSpinning(): void {
    this.isSpinPaused = false
    this.currentSpinTweens.forEach(tween => {
      if (tween && tween.resume) {
        tween.resume()
      }
    })
    console.log(`▶️ Resumed ${this.currentSpinTweens.length} spin tweens`)
  }

  /**
   * Check if currently spinning
   */
  isCurrentlySpinning(): boolean {
    return this.currentSpinTweens.length > 0 && this.isSpinning
  }

  // Performance monitoring
  private updatePerformanceMetrics(): void {
    this.frameCount++
    
    // Clean up pools every 1000 frames to prevent memory leaks
    if (this.frameCount % 1000 === 0) {
      // Let the PerformanceOptimizer handle cleanup
      // This is now handled centrally
    }
  }
}
