import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Splatter effect config - uses existing Particle FX assets
const SplatterEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Splatter.gif',
  // Base effect configuration
  SCALE: 0.9,
  ANIMATION_SPEED: 0.4,
  ALPHA: 1.2
}

export class SplatterEffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 3500 // Character effects layer - Splatter
    this.container.sortableChildren = true
    
    // Start hidden - only show for knight wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show splatter effects for knight wins positioned over winning knight symbols
  public showForKnightWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      console.log('SplatterEffectBackground: Not initialized, cannot show effects')
      return
    }

    // Clear any existing effects
    this.clearEffects()

    // Find all knight positions in winning combinations
    const knightPositions: Array<{ row: number; col: number; symbolIndex: number }> = []
    
    winningPositions.forEach(({ positions }) => {
      positions.forEach(([row, col]) => {
        const symbolIndex = slotResults[row][col]
        // Check if this symbol is a knight (character 0 - Knight)
        if (symbolIndex === 0) {
          // Avoid duplicates
          const exists = knightPositions.some(pos => pos.row === row && pos.col === col)
          if (!exists) {
            knightPositions.push({ row, col, symbolIndex })
          }
        }
      })
    })

    console.log(`SplatterEffectBackground: Found ${knightPositions.length} knight positions in winning combinations`)

    // Create splatter effects positioned over each winning knight
    knightPositions.forEach((knightPos, index) => {
      this.createSplatterEffectAtPosition(knightPos.row, knightPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a splatter effect positioned over a specific slot symbol
  private createSplatterEffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const splatterSprite = new AnimatedSprite(frames)
    splatterSprite.anchor.set(0.5)
    splatterSprite.scale.set(SplatterEffectConfig.SCALE)
    splatterSprite.alpha = SplatterEffectConfig.ALPHA
    splatterSprite.animationSpeed = SplatterEffectConfig.ANIMATION_SPEED
    splatterSprite.loop = true
    splatterSprite.roundPixels = true
    splatterSprite.zIndex = 3500 + index
    splatterSprite.blendMode = 'add' // Eliminate black backgrounds
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the same positioning logic as win highlights
      splatterSprite.x = symbolColumn.x + symbol.x + 5
      splatterSprite.y = symbolColumn.y + symbol.y - 20
      
      console.log(`SplatterEffectBackground: Created effect at slot [${row}, ${col}] - world pos (${splatterSprite.x}, ${splatterSprite.y})`)
    } else {
      console.warn(`SplatterEffectBackground: Could not find symbol/column for position [${row}, ${col}]`)
      // Fallback to center position
      splatterSprite.x = 0
      splatterSprite.y = 0
    }

    splatterSprite.play()
    this.container.addChild(splatterSprite)
    this.sprites.push(splatterSprite)
  }

  // Clear all positioned splatter effects
  private clearEffects(): void {
    // Remove all sprites except the first one (keep as template)
    const template = this.sprites[0]
    this.sprites.slice(1).forEach(sprite => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite)
      }
      sprite.destroy()
    })
    
    // Keep only the template sprite (hidden)
    this.sprites = template ? [template] : []
    if (template) {
      template.visible = false
    }
  }

  // Hide splatter effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
    console.log('SplatterEffectBackground: Hiding splatter effects')
  }

  // Check if the winning character is a knight (character index 0 - Knight)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 0 // Only Knight character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !SplatterEffectConfig.ENABLED) return
    
    console.log('SplatterEffectBackground: Starting initialization...')
    
    // Try GIF path first if enabled
    if (SplatterEffectConfig.USE_GIF && SplatterEffectConfig.GIF_URL) {
      console.log('SplatterEffectBackground: Attempting to load Splatter GIF:', SplatterEffectConfig.GIF_URL)
      const gifTextures = await this.buildFromGif(SplatterEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        console.log('SplatterEffectBackground: Successfully loaded', gifTextures.length, 'frames from Splatter GIF')
        this.createInstances(gifTextures)
        this.isInitialized = true
        return
      } else {
        console.warn('SplatterEffectBackground: Failed to load Splatter GIF or no frames found')
      }
    }

    console.log('SplatterEffectBackground: Initialization completed')
    this.isInitialized = true
  }

  // Build textures from a GIF file if available - uses proper frame composition like FireBackground
  private async buildFromGif(url: string): Promise<Texture[] | null> {
    try {
      // Dynamic import so app works without the package if not used
      const mod: any = await import('gifuct-js')
      const parseGIF = mod.parseGIF as (buf: ArrayBuffer) => any
      const decompressFrames = mod.decompressFrames as (gif: any, build: boolean) => any[]
      
      const resp = await fetch(encodeURI(url))
      if (!resp.ok) return null
      
      const buf = await resp.arrayBuffer()
      const gif = parseGIF(buf)
      const frames = decompressFrames(gif, true)
      
      if (!frames || !frames.length) return null
      
      // Logical canvas size
      const logicalW = (gif.lsd && gif.lsd.width) || frames[0].dims.width
      const logicalH = (gif.lsd && gif.lsd.height) || frames[0].dims.height
      const composedCanvases: HTMLCanvasElement[] = []
      const base = document.createElement('canvas')
      base.width = logicalW
      base.height = logicalH
      const bctx = base.getContext('2d')!
      bctx.clearRect(0, 0, logicalW, logicalH)
      let prevImageData = bctx.getImageData(0, 0, logicalW, logicalH)
      
      for (const f of frames) {
        // Apply disposal
        const disposal = f.disposalType || 0
        if (disposal === 2) {
          // Restore to background color (clear rect of previous frame area)
          bctx.putImageData(prevImageData, 0, 0)
          bctx.clearRect(0, 0, logicalW, logicalH)
        }
        // Draw patch
        const imgData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height)
        const tmp = document.createElement('canvas')
        tmp.width = f.dims.width
        tmp.height = f.dims.height
        const tctx = tmp.getContext('2d')!
        tctx.putImageData(imgData, 0, 0)
        bctx.drawImage(tmp, f.dims.left, f.dims.top)
        
        // Snapshot composed frame
        const snap = document.createElement('canvas')
        snap.width = logicalW
        snap.height = logicalH
        const sctx = snap.getContext('2d')!
        sctx.drawImage(base, 0, 0)
        composedCanvases.push(snap)
        
        // Save current for potential disposal restore
        prevImageData = bctx.getImageData(0, 0, logicalW, logicalH)
      }

      // Convert composed canvases to textures
      const textures: Texture[] = []
      for (const canvas of composedCanvases) {
        textures.push(Texture.from(canvas))
      }
      
      return textures
    } catch (e) {
      return null
    }
  }

  private createInstances(frames: Texture[]): void {
    console.log('SplatterEffectBackground: Creating template sprite for splatter effects')
    
    // Create one template sprite (hidden by default)
    const sprite = new AnimatedSprite(frames)
    sprite.anchor.set(0.5)
    sprite.scale.set(SplatterEffectConfig.SCALE)
    sprite.alpha = SplatterEffectConfig.ALPHA
    sprite.animationSpeed = SplatterEffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 3500
    sprite.visible = false // Hidden template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'add' // This will help eliminate black backgrounds
    
    console.log('SplatterEffectBackground: Template sprite created')
    
    this.container.addChild(sprite)
    this.sprites.push(sprite)
    
    console.log('SplatterEffectBackground: Template sprite added to container')
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
