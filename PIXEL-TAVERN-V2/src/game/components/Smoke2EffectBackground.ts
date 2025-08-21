import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Smoke2 effect config - uses existing Particle FX assets
const Smoke2EffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Smoke2.gif',
  // Base effect configuration
  SCALE: 1.3,
  ANIMATION_SPEED: 0.4,
  ALPHA: 0.9
}

export class Smoke2EffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 3600 // Character effects layer - Smoke2
    this.container.sortableChildren = true
    
    // Start hidden - only show for barbarian wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show smoke2 effects for barbarian wins positioned over winning barbarian symbols
  public showForBarbarianWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      return
    }

    // Clear any existing effects
    this.clearEffects()

    // Find all barbarian positions in winning combinations
    const barbarianPositions: Array<{ row: number; col: number; symbolIndex: number }> = []
    
    winningPositions.forEach(({ positions }) => {
      positions.forEach(([row, col]) => {
        const symbolIndex = slotResults[row][col]
        // Check if this symbol is a barbarian (only character 3 - Warrior)
        if (symbolIndex === 3) {
          // Avoid duplicates
          const exists = barbarianPositions.some(pos => pos.row === row && pos.col === col)
          if (!exists) {
            barbarianPositions.push({ row, col, symbolIndex })
          }
        }
      })
    })


    // Create smoke2 effects positioned over each winning barbarian
    barbarianPositions.forEach((barbarianPos, index) => {
      this.createSmoke2EffectAtPosition(barbarianPos.row, barbarianPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a smoke2 effect positioned over a specific slot symbol
  private createSmoke2EffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const smoke2Sprite = new AnimatedSprite(frames)
    smoke2Sprite.anchor.set(0.5)
    smoke2Sprite.scale.set(Smoke2EffectConfig.SCALE)
    smoke2Sprite.alpha = Smoke2EffectConfig.ALPHA
    smoke2Sprite.animationSpeed = Smoke2EffectConfig.ANIMATION_SPEED
    smoke2Sprite.loop = true
    smoke2Sprite.roundPixels = true
    smoke2Sprite.zIndex = 3600 + index
    smoke2Sprite.blendMode = 'add' // Eliminate black backgrounds
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the same positioning logic as win highlights
      smoke2Sprite.x = symbolColumn.x + symbol.x - 10
      smoke2Sprite.y = symbolColumn.y + symbol.y - 60
      
    } else {
      // Fallback to center position
      smoke2Sprite.x = 0
      smoke2Sprite.y = 0
    }

    smoke2Sprite.play()
    this.container.addChild(smoke2Sprite)
    this.sprites.push(smoke2Sprite)
  }

  // Clear all positioned smoke2 effects
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

  // Hide smoke2 effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
  }

  // Check if the winning character is a barbarian (only character index 3 - Warrior)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 3 // Only Warrior character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !Smoke2EffectConfig.ENABLED) return
    
    
    // Try GIF path first if enabled
    if (Smoke2EffectConfig.USE_GIF && Smoke2EffectConfig.GIF_URL) {
      const gifTextures = await this.buildFromGif(Smoke2EffectConfig.GIF_URL)
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
    sprite.scale.set(Smoke2EffectConfig.SCALE)
    sprite.alpha = Smoke2EffectConfig.ALPHA
    sprite.animationSpeed = Smoke2EffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 3600
    sprite.visible = false // Hidden template
    
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