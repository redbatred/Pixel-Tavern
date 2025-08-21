import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Rocket Fire effect config - uses existing Particle FX assets
const RocketFireEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Rocket Fire 2.gif',
  // Base effect configuration
  SCALE: 1.1 ,
  ANIMATION_SPEED: 0.4 ,
  ALPHA: 0.9,
  ROTATION: 20.5  // Rotation in radians (0 = no rotation, Math.PI = 180 degrees)
}

export class RocketFireEffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 3300 // Character effects layer - Rocket Fire
    this.container.sortableChildren = true
    
    // Start hidden - only show for archer wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show rocket fire effects for archer wins positioned over winning archer symbols
  public showForArcherWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      return
    }

    // Clear any existing effects
    this.clearEffects()

    // Find all archer positions in winning combinations
    const archerPositions: Array<{ row: number; col: number; symbolIndex: number }> = []
    
    winningPositions.forEach(({ positions }) => {
      positions.forEach(([row, col]) => {
        const symbolIndex = slotResults[row][col]
        // Check if this symbol is an archer (character 2 - Archer)
        if (symbolIndex === 2) {
          // Avoid duplicates
          const exists = archerPositions.some(pos => pos.row === row && pos.col === col)
          if (!exists) {
            archerPositions.push({ row, col, symbolIndex })
          }
        }
      })
    })


    // Create rocket fire effects positioned over each winning archer
    archerPositions.forEach((archerPos, index) => {
      this.createRocketFireEffectAtPosition(archerPos.row, archerPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a rocket fire effect positioned over a specific slot symbol
  private createRocketFireEffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const rocketFireSprite = new AnimatedSprite(frames)
    rocketFireSprite.anchor.set(0.5)
    rocketFireSprite.scale.set(RocketFireEffectConfig.SCALE)
    rocketFireSprite.alpha = RocketFireEffectConfig.ALPHA
    rocketFireSprite.animationSpeed = RocketFireEffectConfig.ANIMATION_SPEED
    rocketFireSprite.loop = true
    rocketFireSprite.roundPixels = true
    rocketFireSprite.zIndex = 3300 + index
    rocketFireSprite.blendMode = 'add' // Eliminate black backgrounds
    rocketFireSprite.rotation = RocketFireEffectConfig.ROTATION // Apply rotation
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the same positioning logic as win highlights
      rocketFireSprite.x = symbolColumn.x + symbol.x + 40
      rocketFireSprite.y = symbolColumn.y + symbol.y + 30
      
    } else {
      // Fallback to center position
      rocketFireSprite.x = 0
      rocketFireSprite.y = 0
    }

    rocketFireSprite.play()
    this.container.addChild(rocketFireSprite)
    this.sprites.push(rocketFireSprite)
  }

  // Clear all positioned rocket fire effects
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

  // Hide rocket fire effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
  }

  // Check if the winning character is an archer (character index 2 - Archer)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 2 // Only Archer character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !RocketFireEffectConfig.ENABLED) return
    
    
    // Try GIF path first if enabled
    if (RocketFireEffectConfig.USE_GIF && RocketFireEffectConfig.GIF_URL) {
      const gifTextures = await this.buildFromGif(RocketFireEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        this.createInstances(gifTextures)
        this.isInitialized = true
        return
      } else {
      }
    }

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
    
    // Create one template sprite (hidden by default)
    const sprite = new AnimatedSprite(frames)
    sprite.anchor.set(0.5)
    sprite.scale.set(RocketFireEffectConfig.SCALE)
    sprite.alpha = RocketFireEffectConfig.ALPHA
    sprite.animationSpeed = RocketFireEffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 3300
    sprite.visible = false // Hidden template
    sprite.rotation = RocketFireEffectConfig.ROTATION // Apply rotation to template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'add' // This will help eliminate black backgrounds
    
    
    this.container.addChild(sprite)
    this.sprites.push(sprite)
    
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
