import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Blood Splat effect config - uses existing Particle FX assets
const BloodSplatEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Blood Splat.gif',
  // Base effect configuration
  SCALE: 0.8, // Slightly smaller than splatter (0.9)
  ANIMATION_SPEED: 0.5, // Slightly faster than splatter (0.4)
  ALPHA: 1.0 // Slightly less than splatter (1.2)
}

export class BloodSplatEffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 10002 // Higher than splatter (10001) but same sprite logic
    this.container.sortableChildren = true
    
    // Start hidden - only show for knight wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show blood splat effects for knight wins positioned over winning knight symbols
  public showForKnightWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      console.log('BloodSplatEffectBackground: Not initialized, cannot show effects')
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

    console.log(`BloodSplatEffectBackground: Found ${knightPositions.length} knight positions in winning combinations`)

    // Create blood splat effects positioned over each winning knight
    knightPositions.forEach((knightPos, index) => {
      this.createBloodSplatEffectAtPosition(knightPos.row, knightPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a blood splat effect positioned over a specific slot symbol
  private createBloodSplatEffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const bloodSplatSprite = new AnimatedSprite(frames)
    bloodSplatSprite.anchor.set(0.5)
    bloodSplatSprite.scale.set(BloodSplatEffectConfig.SCALE)
    bloodSplatSprite.alpha = BloodSplatEffectConfig.ALPHA
    bloodSplatSprite.animationSpeed = BloodSplatEffectConfig.ANIMATION_SPEED
    bloodSplatSprite.loop = true
    bloodSplatSprite.roundPixels = true
    bloodSplatSprite.zIndex = 10000 + index // Same as splatter
    bloodSplatSprite.blendMode = 'add' // Eliminate black backgrounds
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the EXACT same positioning logic as splatter effect, with tiny offset for layering
      bloodSplatSprite.x = symbolColumn.x + symbol.x + 8 // +3 offset from splatter (+5)
      bloodSplatSprite.y = symbolColumn.y + symbol.y - 17 // +3 offset from splatter (-20)
      
      console.log(`BloodSplatEffectBackground: Created effect at slot [${row}, ${col}] - world pos (${bloodSplatSprite.x}, ${bloodSplatSprite.y})`)
    } else {
      console.warn(`BloodSplatEffectBackground: Could not find symbol/column for position [${row}, ${col}]`)
      // Fallback to center position
      bloodSplatSprite.x = 0
      bloodSplatSprite.y = 0
    }

    bloodSplatSprite.play()
    this.container.addChild(bloodSplatSprite)
    this.sprites.push(bloodSplatSprite)
  }

  // Clear all positioned blood splat effects
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

  // Hide blood splat effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
  }

  // Check if the winning character is a knight (character index 0 - Knight)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 0 // Only Knight character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !BloodSplatEffectConfig.ENABLED) {
      console.log('BloodSplatEffectBackground: Init skipped - already initialized or disabled')
      return
    }
    
    console.log('BloodSplatEffectBackground: Starting initialization...')
    
    // Try GIF path first if enabled
    if (BloodSplatEffectConfig.USE_GIF && BloodSplatEffectConfig.GIF_URL) {
      console.log('BloodSplatEffectBackground: Attempting to load Blood Splat GIF:', BloodSplatEffectConfig.GIF_URL)
      const gifTextures = await this.buildFromGif(BloodSplatEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        console.log('BloodSplatEffectBackground: Successfully loaded', gifTextures.length, 'frames from Blood Splat GIF')
        this.createInstances(gifTextures)
        this.isInitialized = true
        console.log('BloodSplatEffectBackground: Initialization completed successfully')
        return
      } else {
        console.warn('BloodSplatEffectBackground: Failed to load Blood Splat GIF or no frames found')
      }
    }

    console.log('BloodSplatEffectBackground: Initialization completed (no textures loaded)')
    this.isInitialized = true
  }

  // Build textures from a GIF file if available - uses proper frame composition like FireBackground
  private async buildFromGif(url: string): Promise<Texture[] | null> {
    try {
      console.log('BloodSplatEffectBackground: Starting GIF loading from', url)
      // Dynamic import so app works without the package if not used
      const mod: any = await import('gifuct-js')
      const parseGIF = mod.parseGIF as (buf: ArrayBuffer) => any
      const decompressFrames = mod.decompressFrames as (gif: any, build: boolean) => any[]
      
      console.log('BloodSplatEffectBackground: Fetching GIF file...')
      const resp = await fetch(encodeURI(url))
      if (!resp.ok) {
        console.error('BloodSplatEffectBackground: Failed to fetch GIF - HTTP', resp.status)
        return null
      }
      
      console.log('BloodSplatEffectBackground: Parsing GIF data...')
      const buf = await resp.arrayBuffer()
      const gif = parseGIF(buf)
      const frames = decompressFrames(gif, true)
      
      if (!frames || !frames.length) {
        console.error('BloodSplatEffectBackground: No frames found in GIF')
        return null
      }
      
      console.log('BloodSplatEffectBackground: Processing', frames.length, 'frames...')
      
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
      
      console.log('BloodSplatEffectBackground: Successfully created', textures.length, 'textures from GIF')
      return textures
    } catch (e) {
      console.error('BloodSplatEffectBackground: Error loading GIF:', e)
      return null
    }
  }

  private createInstances(frames: Texture[]): void {
    console.log('BloodSplatEffectBackground: Creating template sprite for blood splat effects')
    
    // Create one template sprite (hidden by default)
    const sprite = new AnimatedSprite(frames)
    sprite.anchor.set(0.5)
    sprite.scale.set(BloodSplatEffectConfig.SCALE)
    sprite.alpha = BloodSplatEffectConfig.ALPHA
    sprite.animationSpeed = BloodSplatEffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 10001
    sprite.visible = false // Hidden template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'add' // This will help eliminate black backgrounds
    
    console.log('BloodSplatEffectBackground: Template sprite created')
    
    this.container.addChild(sprite)
    this.sprites.push(sprite)
    
    console.log('BloodSplatEffectBackground: Template sprite added to container')
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
