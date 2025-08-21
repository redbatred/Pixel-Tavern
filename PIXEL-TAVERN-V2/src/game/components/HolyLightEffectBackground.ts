import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Holy Light Aura effect config - uses existing Particle FX assets
const HolyLightEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Holy Light Aura.gif',
  // Base effect configuration
  SCALE: 1,
  ANIMATION_SPEED: 0.6,
  ALPHA: 0.9
}

export class HolyLightEffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 3400 // Character effects layer - Holy Light
    this.container.sortableChildren = true
    
    // Start hidden - only show for king wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show holy light effects for king wins positioned over winning king symbols
  public showForKingWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      console.log('HolyLightEffectBackground: Not initialized, cannot show effects')
      return
    }

    // Clear any existing effects
    this.clearEffects()

    // Find all king positions in winning combinations
    const kingPositions: Array<{ row: number; col: number; symbolIndex: number }> = []
    
    winningPositions.forEach(({ positions }) => {
      positions.forEach(([row, col]) => {
        const symbolIndex = slotResults[row][col]
        // Check if this symbol is a king (character 5 - King)
        if (symbolIndex === 5) {
          // Avoid duplicates
          const exists = kingPositions.some(pos => pos.row === row && pos.col === col)
          if (!exists) {
            kingPositions.push({ row, col, symbolIndex })
          }
        }
      })
    })

    console.log(`HolyLightEffectBackground: Found ${kingPositions.length} king positions in winning combinations`)

    // Create holy light effects positioned over each winning king
    kingPositions.forEach((kingPos, index) => {
      this.createHolyLightEffectAtPosition(kingPos.row, kingPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a holy light effect positioned over a specific slot symbol
  private createHolyLightEffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const holyLightSprite = new AnimatedSprite(frames)
    holyLightSprite.anchor.set(0.5)
    holyLightSprite.scale.set(HolyLightEffectConfig.SCALE)
    holyLightSprite.alpha = HolyLightEffectConfig.ALPHA
    holyLightSprite.animationSpeed = HolyLightEffectConfig.ANIMATION_SPEED
    holyLightSprite.loop = true
    holyLightSprite.roundPixels = true
    holyLightSprite.zIndex = 3400 + index
    holyLightSprite.blendMode = 'add' // Eliminate black backgrounds
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the same positioning logic as win highlights
      holyLightSprite.x = symbolColumn.x + symbol.x + 5 
      holyLightSprite.y = symbolColumn.y + symbol.y -  50 
      
      console.log(`HolyLightEffectBackground: Created effect at slot [${row}, ${col}] - world pos (${holyLightSprite.x}, ${holyLightSprite.y})`)
    } else {
      console.warn(`HolyLightEffectBackground: Could not find symbol/column for position [${row}, ${col}]`)
      // Fallback to center position
      holyLightSprite.x = 0
      holyLightSprite.y = 0
    }

    holyLightSprite.play()
    this.container.addChild(holyLightSprite)
    this.sprites.push(holyLightSprite)
  }

  // Clear all positioned holy light effects
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

  // Hide holy light effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
    console.log('HolyLightEffectBackground: Hiding holy light effects')
  }

  // Check if the winning character is a king (character index 5 - King)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 5 // Only King character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !HolyLightEffectConfig.ENABLED) return
    
    console.log('HolyLightEffectBackground: Starting initialization...')
    
    // Try GIF path first if enabled
    if (HolyLightEffectConfig.USE_GIF && HolyLightEffectConfig.GIF_URL) {
      console.log('HolyLightEffectBackground: Attempting to load Holy Light Aura GIF:', HolyLightEffectConfig.GIF_URL)
      const gifTextures = await this.buildFromGif(HolyLightEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        console.log('HolyLightEffectBackground: Successfully loaded', gifTextures.length, 'frames from Holy Light Aura GIF')
        this.createInstances(gifTextures)
        this.isInitialized = true
        return
      } else {
        console.warn('HolyLightEffectBackground: Failed to load Holy Light Aura GIF or no frames found')
      }
    }

    console.log('HolyLightEffectBackground: Initialization completed')
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
    console.log('HolyLightEffectBackground: Creating template sprite for holy light effects')
    
    // Create one template sprite (hidden by default)
    const sprite = new AnimatedSprite(frames)
    sprite.anchor.set(0.5)
    sprite.scale.set(HolyLightEffectConfig.SCALE)
    sprite.alpha = HolyLightEffectConfig.ALPHA
    sprite.animationSpeed = HolyLightEffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 3400
    sprite.visible = false // Hidden template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'add' // This will help eliminate black backgrounds
    
    console.log('HolyLightEffectBackground: Template sprite created')
    
    this.container.addChild(sprite)
    this.sprites.push(sprite)
    
    console.log('HolyLightEffectBackground: Template sprite added to container')
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
