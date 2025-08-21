import { AnimatedSprite, Container, Texture } from 'pixi.js'

// Poison Cloud effect config - uses existing Particle FX assets
const RegenEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Poison Cloud.gif',
  // Base effect configuration
  SCALE: 0.5,
  ANIMATION_SPEED: 0.6,
  ALPHA: 0.9
}

export class RegenEffectBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false

  constructor() {
    this.container = new Container()
    this.container.zIndex = 3200 // Character effects layer - Regen
    this.container.sortableChildren = true
    
    // Start hidden - only show for barmaid wins
    this.container.visible = false
  }

  public getContainer(): Container {
    return this.container
  }

  // Show regen effects for barmaid wins positioned over winning barmaid symbols
  public showForBarmaidWin(
    winningPositions: Array<{ payline: number; positions: [number, number][] }>,
    slotResults: number[][],
    slotMachine: any // Reference to SlotMachine to get symbol positions
  ): void {
    if (!this.isInitialized || this.sprites.length === 0) {
      console.log('RegenEffectBackground: Not initialized, cannot show effects')
      return
    }

    // Clear any existing effects
    this.clearEffects()

    // Find all barmaid positions in winning combinations
    const barmaidPositions: Array<{ row: number; col: number; symbolIndex: number }> = []
    
    winningPositions.forEach(({ positions }) => {
      positions.forEach(([row, col]) => {
        const symbolIndex = slotResults[row][col]
        // Check if this symbol is a barmaid (character 4 - Barmaid)
        if (symbolIndex === 4) {
          // Avoid duplicates
          const exists = barmaidPositions.some(pos => pos.row === row && pos.col === col)
          if (!exists) {
            barmaidPositions.push({ row, col, symbolIndex })
          }
        }
      })
    })

    console.log(`RegenEffectBackground: Found ${barmaidPositions.length} barmaid positions in winning combinations`)

    // Create poison cloud effects positioned over each winning barmaid
    barmaidPositions.forEach((barmaidPos, index) => {
      this.createRegenEffectAtPosition(barmaidPos.row, barmaidPos.col, slotMachine, index)
    })

    this.container.visible = true
  }

  // Create a poison cloud effect positioned over a specific slot symbol
  private createRegenEffectAtPosition(row: number, col: number, slotMachine: any, index: number): void {
    if (this.sprites.length === 0) return

    // Get the original sprite frames (use first sprite as template)
    const templateSprite = this.sprites[0]
    const frames = templateSprite.textures || [templateSprite.texture]

    // Create new animated sprite
    const regenSprite = new AnimatedSprite(frames)
    regenSprite.anchor.set(0.5)
    regenSprite.scale.set(RegenEffectConfig.SCALE)
    regenSprite.alpha = RegenEffectConfig.ALPHA
    regenSprite.animationSpeed = RegenEffectConfig.ANIMATION_SPEED
    regenSprite.loop = true
    regenSprite.roundPixels = true
    regenSprite.zIndex = 3200 + index
    regenSprite.blendMode = 'add' // Eliminate black backgrounds
    
    // Position over the specific symbol using SlotMachine's positioning logic
    const symbol = slotMachine.slotGrid[row][col]
    const symbolColumn = slotMachine.slotColumns[col]
    
    if (symbol && symbolColumn) {
      // Use the same positioning logic as win highlights
      regenSprite.x = symbolColumn.x + symbol.x - 15
      regenSprite.y = symbolColumn.y + symbol.y - 32
      
      console.log(`RegenEffectBackground: Created effect at slot [${row}, ${col}] - world pos (${regenSprite.x}, ${regenSprite.y})`)
    } else {
      console.warn(`RegenEffectBackground: Could not find symbol/column for position [${row}, ${col}]`)
      // Fallback to center position
      regenSprite.x = 0
      regenSprite.y = 0
    }

    regenSprite.play()
    this.container.addChild(regenSprite)
    this.sprites.push(regenSprite)
  }

  // Clear all positioned regen effects
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

  // Hide poison cloud effects
  public hide(): void {
    this.container.visible = false
    this.clearEffects()
    console.log('RegenEffectBackground: Hiding poison cloud effects')
  }

  // Check if the winning character is a barmaid (character index 4 - Barmaid)
  public shouldShowForCharacter(characterIndex: number | null): boolean {
    return characterIndex === 4 // Only Barmaid character
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !RegenEffectConfig.ENABLED) return
    
    console.log('RegenEffectBackground: Starting initialization...')
    
    // Try GIF path first if enabled
    if (RegenEffectConfig.USE_GIF && RegenEffectConfig.GIF_URL) {
      console.log('RegenEffectBackground: Attempting to load Poison Cloud GIF:', RegenEffectConfig.GIF_URL)
      const gifTextures = await this.buildFromGif(RegenEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        console.log('RegenEffectBackground: Successfully loaded', gifTextures.length, 'frames from Poison Cloud GIF')
        this.createInstances(gifTextures)
        this.isInitialized = true
        return
      } else {
        console.warn('RegenEffectBackground: Failed to load Poison Cloud GIF or no frames found')
      }
    }

    console.log('RegenEffectBackground: Initialization completed')
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
    console.log('RegenEffectBackground: Creating template sprite for poison cloud effects')
    
    // Create one template sprite (hidden by default)
    const sprite = new AnimatedSprite(frames)
    sprite.anchor.set(0.5)
    sprite.scale.set(RegenEffectConfig.SCALE)
    sprite.alpha = RegenEffectConfig.ALPHA
    sprite.animationSpeed = RegenEffectConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 3200
    sprite.visible = false // Hidden template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'add' // This will help eliminate black backgrounds
    
    console.log('RegenEffectBackground: Template sprite created')
    
    this.container.addChild(sprite)
    this.sprites.push(sprite)
    
    console.log('RegenEffectBackground: Template sprite added to container')
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
