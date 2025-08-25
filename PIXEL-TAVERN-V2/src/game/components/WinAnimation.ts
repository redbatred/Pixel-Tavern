import { Application, Container, Sprite, Assets, Graphics, Text, Texture, Rectangle, AnimatedSprite } from 'pixi.js'
import { gsap } from 'gsap'
import { pauseManager } from '../utils/PauseManager'

// Leaf effect configuration - easily adjustable
const LeafEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Leaves.gif',
  // Multiple leaf instances with configurable positions and scales - slower speeds
  INSTANCES: [
    { x: -80, y: -60, scale: 0.8, animationSpeed: 0.15, alpha: 0.7, rotation: 15 },
    { x: 70, y: -40, scale: 0.6, animationSpeed: 0.2, alpha: 0.8, rotation: -20 },
    { x: -40, y: 50, scale: 0.5, animationSpeed: 0.18, alpha: 0.6, rotation: 30 },
    { x: 90, y: 30, scale: 0.7, animationSpeed: 0.12, alpha: 0.9, rotation: -10 },
    { x: 0, y: -90, scale: 0.4, animationSpeed: 0.22, alpha: 0.5, rotation: 45 }
  ]
}

// Background glow effect configuration
const BackgroundGlowConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Holy Light Aura.gif', // Can be changed to: 'Sakuras.gif', 'Sparks.gif', 'Water Vortex Splash.gif'
  SCALE: 1.2,
  ANIMATION_SPEED: 0.4, // Slower background glow
  ALPHA: 0.6,
  BLEND_MODE: 'add' // Creates beautiful glow effect
}

export class WinAnimation {
  public container: Container
  private app: Application
  private characterSprite: Sprite | null = null
  private backgroundGlow: AnimatedSprite | null = null
  private winText: Text | null = null
  private animationFrameId: number | null = null
  private frames: Texture[] = []
  private isAnimating: boolean = false
  private leafSprites: AnimatedSprite[] = []
  private leafContainer: Container
  private backgroundGlowSprites: AnimatedSprite[] = []
  private backgroundGlowTextures: Texture[] = []

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.container.visible = false
    
    // Create leaf container behind everything else
    this.leafContainer = new Container()
    this.leafContainer.zIndex = 50 // Behind character sprite but above background glow
    this.container.addChild(this.leafContainer)
    this.container.sortableChildren = true
  }

  async init(): Promise<void> {
    
    // Create background glow effect
    await this.createBackgroundGlow()
    
    // Initialize leaf effects if enabled
    if (LeafEffectConfig.ENABLED) {
      await this.initLeafEffects()
    }
    
  }

  private async createBackgroundGlow(): Promise<void> {
    
    if (!BackgroundGlowConfig.ENABLED || !BackgroundGlowConfig.USE_GIF) {
      return
    }

    try {
      const glowTextures = await this.buildBackgroundGlowTexturesFromGif(BackgroundGlowConfig.GIF_URL)
      
      if (glowTextures && glowTextures.length > 0) {
        this.createBackgroundGlowTemplate(glowTextures)
      } else {
      }
    } catch (error) {
    }
  }

  // Create a template background glow sprite like other effects do
  private createBackgroundGlowTemplate(glowTextures: Texture[]): void {
    
    // Store the original textures for creating instances
    this.backgroundGlowTextures = glowTextures
    
    const sprite = new AnimatedSprite(glowTextures)
    sprite.anchor.set(0.5)
    sprite.scale.set(BackgroundGlowConfig.SCALE)
    sprite.alpha = BackgroundGlowConfig.ALPHA
    sprite.animationSpeed = BackgroundGlowConfig.ANIMATION_SPEED
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 10
    sprite.visible = false // Hidden template
    sprite.blendMode = BackgroundGlowConfig.BLEND_MODE as any
    
    
    this.container.addChild(sprite)
    this.backgroundGlowSprites.push(sprite)
    
  }

  private showBackgroundGlow(): void {
    
    // If we have GIF textures, use them; otherwise use fallback
    if (this.backgroundGlowTextures.length === 0) {
      
      // Create a simple fallback glow directly
      const fallbackGlow = new Graphics()
      fallbackGlow.circle(0, 0, 200) // Bigger circle
      fallbackGlow.fill({ color: 0xffd700, alpha: 1.0 }) // Full opacity
      fallbackGlow.x = 0
      fallbackGlow.y = 0
      fallbackGlow.zIndex = 1 // Behind leaves
      fallbackGlow.visible = true
      
      // Add to container at the beginning
      this.container.addChildAt(fallbackGlow, 0)
      
      // Store reference for rotation animation
      this.backgroundGlow = fallbackGlow as any
      
      return
    }

    
    // Create instance from stored textures (same pattern as leaves)
    const glowSprite = new AnimatedSprite(this.backgroundGlowTextures)
    glowSprite.anchor.set(0.5)
    glowSprite.x = 0
    glowSprite.y = 0
    glowSprite.scale.set(BackgroundGlowConfig.SCALE * 2) // Make it bigger to ensure visibility
    glowSprite.alpha = 1.0 // Full opacity for testing
    glowSprite.animationSpeed = BackgroundGlowConfig.ANIMATION_SPEED
    glowSprite.loop = true
    glowSprite.roundPixels = true
    glowSprite.zIndex = 1 // Behind leaves but visible
    glowSprite.blendMode = 'screen' // Use screen blend mode to brighten and handle transparency better
    glowSprite.visible = true
    
    glowSprite.play()
    
    // Add to container FIRST to ensure it's behind everything
    this.container.addChildAt(glowSprite, 0)
    this.backgroundGlowSprites.push(glowSprite)
    
    // Store reference for rotation animation
    this.backgroundGlow = glowSprite
    
  }

  private clearBackgroundGlow(): void {
    // Remove all sprites except the first one (keep as template)
    const template = this.backgroundGlowSprites[0]
    this.backgroundGlowSprites.slice(1).forEach(sprite => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite)
      }
      sprite.destroy()
    })
    
    // Keep only the template sprite (hidden)
    this.backgroundGlowSprites = template ? [template] : []
    if (template) {
      template.visible = false
    }
    
    // Clear the reference
    this.backgroundGlow = null
  }

  private async initLeafEffects(): Promise<void> {
    if (!LeafEffectConfig.USE_GIF || !LeafEffectConfig.GIF_URL) return
    
    try {
      const leafTextures = await this.buildLeafTexturesFromGif(LeafEffectConfig.GIF_URL)
      
      if (leafTextures && leafTextures.length > 0) {
        this.createLeafTemplate(leafTextures)
      } else {
      }
    } catch (error) {
    }
  }

  // Build textures from background glow GIF file - uses proper frame composition
  private async buildBackgroundGlowTexturesFromGif(url: string): Promise<Texture[] | null> {
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
      
      // Ensure transparent background
      bctx.globalCompositeOperation = 'source-over'
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
        // Draw patch with transparency handling
        const imgData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height)
        
        // Process the image data to ensure proper transparency
        const data = imgData.data
        for (let i = 0; i < data.length; i += 4) {
          // If the pixel is black (0,0,0) and not explicitly set as opaque, make it transparent
          if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
            data[i + 3] = 0 // Set alpha to 0 (transparent)
          }
        }
        
        const tmp = document.createElement('canvas')
        tmp.width = f.dims.width
        tmp.height = f.dims.height
        const tctx = tmp.getContext('2d')!
        
        // Ensure transparency for patch canvas
        tctx.clearRect(0, 0, f.dims.width, f.dims.height)
        tctx.putImageData(imgData, 0, 0)
        bctx.drawImage(tmp, f.dims.left, f.dims.top)
        
        // Snapshot composed frame
        const snap = document.createElement('canvas')
        snap.width = logicalW
        snap.height = logicalH
        const sctx = snap.getContext('2d')!
        
        // Ensure transparent background for snapshot
        sctx.clearRect(0, 0, logicalW, logicalH)
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

  // Build textures from leaf GIF file - uses proper frame composition
  private async buildLeafTexturesFromGif(url: string): Promise<Texture[] | null> {
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

  // Create a template leaf sprite like other effects do
  private createLeafTemplate(leafTextures: Texture[]): void {
    
    const sprite = new AnimatedSprite(leafTextures)
    sprite.anchor.set(0.5)
    sprite.scale.set(0.8) // Default scale
    sprite.alpha = 0.7 // Default alpha
    sprite.animationSpeed = 0.15 // Slower default animation speed
    sprite.loop = true
    sprite.roundPixels = true
    sprite.zIndex = 0
    sprite.visible = false // Hidden template
    
    // Add blend mode to help with transparency
    sprite.blendMode = 'normal'
    
    
    this.leafContainer.addChild(sprite)
    this.leafSprites.push(sprite)
    
  }

  async showWin(characterIndex: number, _winAmount: number): Promise<void> {
    
    // Prevent multiple animations from running
    if (this.isAnimating) {
      this.hide()
    }
    
    this.isAnimating = true
    
    // Clear previous animation
    this.clear()
    
    // Show background glow first
    this.showBackgroundGlow()

    // Show leaf effects first (behind character)
    this.showLeafEffects()    // Load and show character sprite
    await this.loadCharacterSprite(characterIndex)
    
    // Position in center of screen
    this.container.x = this.app.screen.width / 2
    this.container.y = this.app.screen.height / 2
    
    // Show and animate
    this.container.visible = true
    this.playAnimation()
  }

  private showLeafEffects(): void {
    
    if (this.leafSprites.length === 0) {
      return
    }

    // Clear any existing leaf instances (keep template)
    this.clearLeafEffects()
    
    // Get the template sprite
    const template = this.leafSprites[0]
    if (!template) {
      return
    }
    
    
    // Create instances based on configuration, like other effects do
    LeafEffectConfig.INSTANCES.forEach((config, index) => {
      const leafSprite = new AnimatedSprite(template.textures)
      leafSprite.anchor.set(0.5)
      leafSprite.x = config.x
      leafSprite.y = config.y
      leafSprite.scale.set(config.scale)
      leafSprite.alpha = config.alpha
      leafSprite.rotation = (config.rotation || 0) * (Math.PI / 180)
      leafSprite.animationSpeed = config.animationSpeed
      leafSprite.loop = true
      leafSprite.roundPixels = true
      leafSprite.zIndex = index
      leafSprite.blendMode = 'normal'
      leafSprite.visible = true
      
      leafSprite.play()
      this.leafContainer.addChild(leafSprite)
      this.leafSprites.push(leafSprite)
      
    })
    
  }

  private clearLeafEffects(): void {
    // Remove all sprites except the first one (keep as template)
    const template = this.leafSprites[0]
    this.leafSprites.slice(1).forEach(sprite => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite)
      }
      sprite.destroy()
    })
    
    // Keep only the template sprite (hidden)
    this.leafSprites = template ? [template] : []
    if (template) {
      template.visible = false
    }
  }

  private async loadCharacterSprite(characterIndex: number): Promise<void> {
    try {
      // IMPORTANT: Make sure no character sprite exists before creating a new one
      if (this.characterSprite) {
        this.container.removeChild(this.characterSprite)
        this.characterSprite.destroy()
        this.characterSprite = null
      }
      
      let spritePath: string
      let isKnight = false
      let isMage = false
      
      if (characterIndex === 0) {
        // Knight (index 0) - use ATTACK 2 sprite sheet
        spritePath = './assets/images/knight-sprite/ATTACK 2.png'
        isKnight = true
      } else if (characterIndex === 1) {
        // Wizard/Mage (index 1) - use death-sheet sprite
        spritePath = './assets/images/mage-sprite/death-sheet.png'
        isMage = true
      } else {
        // Default to knight for other characters
        spritePath = './assets/images/knight-sprite/ATTACK 2.png'
        isKnight = true
      }
      
      const spriteTexture = await Assets.load(spritePath)
      
      // Determine frame specs
      let frameWidth: number, frameHeight: number
      
      if (isKnight) {
        frameWidth = 84
        frameHeight = 84
      } else if (isMage) {
        frameWidth = 128
        frameHeight = 120
      } else {
        frameWidth = 84
        frameHeight = 84
      }
      
      // Create the FIRST FRAME ONLY (not the entire sprite sheet)
      const firstFrameRect = new Rectangle(0, 0, frameWidth, frameHeight)
      const firstFrameTexture = new Texture({
        source: spriteTexture.source,
        frame: firstFrameRect
      })
      
      this.characterSprite = new Sprite(firstFrameTexture)
      this.characterSprite.anchor.set(0.5)
      this.characterSprite.zIndex = 100 // Above leaves and glow
      
      // Scale appropriately
      const targetSize = isMage ? 250 : 300
      const scale = targetSize / Math.max(frameWidth, frameHeight)
      this.characterSprite.scale.set(scale)
      
      this.container.addChild(this.characterSprite)
      
      // Start frame-by-frame animation
      this.startFrameAnimation(spriteTexture, isKnight, isMage)
      
    } catch (error) {
      // Create a fallback colored circle
      const fallback = new Graphics()
      fallback.circle(0, 0, 40)
      fallback.fill(0x00ff00)
      this.container.addChild(fallback)
    }
  }



  private playAnimation(): void {
    // Show immediately without scale animation to prevent flashes
    this.container.scale.set(1)
    
    gsap.timeline()
      .to(this.backgroundGlow, {
        rotation: Math.PI * 2,
        duration: 2,
        ease: 'none',
        repeat: -1
      }, 0)
      .to(this.container.scale, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        delay: 2
      })
      .call(() => {
        if (this.isAnimating) {
          this.hide()
        }
      })
  }

  hide(): void {
    
    this.isAnimating = false
    
    // Stop all GSAP animations on this container
    gsap.killTweensOf(this.container)
    gsap.killTweensOf(this.container.scale)
    if (this.backgroundGlow) {
      gsap.killTweensOf(this.backgroundGlow)
    }
    
    // Hide leaf effects
    this.hideLeafEffects()
    
    // Hide background glow
    this.clearBackgroundGlow()
    
    this.container.visible = false
    this.clear()
  }

  private hideLeafEffects(): void {
    this.clearLeafEffects()
  }

  private startFrameAnimation(spriteTexture: Texture, isKnight: boolean, isMage: boolean): void {
    // Create animation frames
    let frameWidth: number, frameHeight: number, totalFrames: number, frameSpacing: number
    
    if (isKnight) {
      // ATTACK 2 sprite: 480x84 pixels with 5 frames of 84x84 each
      frameWidth = 84
      frameHeight = 84
      totalFrames = 5
      frameSpacing = spriteTexture.width / totalFrames // 96px spacing
    } else if (isMage) {
      // Mage death-sheet: 2048x120 pixels with 16 frames of 128x120 each
      frameWidth = 128
      frameHeight = 120
      totalFrames = 16
      frameSpacing = 128 // Exact frame spacing (2048 / 16 = 128)
    } else {
      // Default to knight specs
      frameWidth = 84
      frameHeight = 84
      totalFrames = 5
      frameSpacing = spriteTexture.width / totalFrames
    }
    
    // Create frame textures
    this.frames = []
    for (let i = 0; i < totalFrames; i++) {
      const rect = new Rectangle(
        i * frameSpacing,  // X position based on frame spacing
        0,                 // Y position: 0 (single row)
        frameWidth,        // Width based on character
        frameHeight        // Height based on character
      )
      const frameTexture = new Texture({
        source: spriteTexture.source,
        frame: rect
      })
      this.frames.push(frameTexture)
    }
    
    // Start frame-rate independent animation loop
    let currentFrame = 0
    let lastFrameTime = performance.now()
    let loops = 0
    
    const frameInterval = isMage ? 100 : 67 // MS per frame: 100ms = 10fps, 67ms = 15fps
    const maxLoops = isMage ? 1 : 2 // Play once for mage, twice for knight
    
    const animate = (currentTime: number) => {
      // Check if game is paused
      if (pauseManager.getIsPaused()) {
        // Continue checking when game resumes
        this.animationFrameId = requestAnimationFrame(animate)
        return
      }
      
      // Stop animation if no longer animating
      if (!this.isAnimating) {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId)
          this.animationFrameId = null
        }
        return
      }
      
      // Frame-rate independent timing
      const deltaTime = currentTime - lastFrameTime
      
      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime
        currentFrame = (currentFrame + 1) % this.frames.length
        
        if (this.characterSprite && this.frames[currentFrame]) {
          this.characterSprite.texture = this.frames[currentFrame]
        }
        
        // Check if we completed a full animation cycle
        if (currentFrame === 0) {
          loops++
          if (loops >= maxLoops) {
            // Animation complete - hide the sprite immediately
            if (this.animationFrameId) {
              cancelAnimationFrame(this.animationFrameId)
              this.animationFrameId = null
            }
            // Hide the animation immediately after completion
            setTimeout(() => {
              if (this.isAnimating) {
                this.hide()
              }
            }, 200) // Brief pause before hiding
            return
          }
        }
      }
      
      this.animationFrameId = requestAnimationFrame(animate)
    }
    
    this.animationFrameId = requestAnimationFrame(animate)
  }

  private clear(): void {
    // Stop frame animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Clear frames
    this.frames = []
    
    // Remove character sprite
    if (this.characterSprite) {
      if (this.characterSprite.parent) {
        this.characterSprite.parent.removeChild(this.characterSprite)
      }
      this.characterSprite.destroy()
      this.characterSprite = null
    }
    
    // Clear leaf effects (keep template)
    this.clearLeafEffects()
    
    // Clear background glow effects but don't call clearBackgroundGlow as it removes templates
    if (this.backgroundGlow && this.backgroundGlow.parent) {
      this.backgroundGlow.parent.removeChild(this.backgroundGlow)
      if (this.backgroundGlow.destroy) {
        this.backgroundGlow.destroy()
      }
      this.backgroundGlow = null
    }
    
    // Remove win text (if it exists)
    if (this.winText) {
      if (this.winText.parent) {
        this.winText.parent.removeChild(this.winText)
      }
      this.winText.destroy()
      this.winText = null
    }
    
    // Clear leaf container children
    this.leafContainer.removeChildren()
    
    // Clean up any remaining children except persistent containers and templates
    const childrenToRemove = []
    for (let i = 0; i < this.container.children.length; i++) {
      const child = this.container.children[i]
      // Keep leaf container and any template sprites (first sprite in arrays)
      const isLeafTemplate = this.leafSprites.length > 0 && child === this.leafSprites[0]
      const isGlowTemplate = this.backgroundGlowSprites.length > 0 && child === this.backgroundGlowSprites[0]
      
      if (child !== this.leafContainer && !isLeafTemplate && !isGlowTemplate) {
        childrenToRemove.push(child)
      }
    }
    
    childrenToRemove.forEach(child => {
      if (child.parent) {
        child.parent.removeChild(child)
      }
      child.destroy()
    })
  }
}
