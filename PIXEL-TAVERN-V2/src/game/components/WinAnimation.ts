import { Application, Container, Sprite, Assets, Graphics, Text, Texture, Rectangle } from 'pixi.js'
import { gsap } from 'gsap'

export class WinAnimation {
  public container: Container
  private app: Application
  private characterSprite: Sprite | null = null
  private backgroundGlow: Graphics | null = null
  private winText: Text | null = null
  private animationFrameId: number | null = null
  private frames: Texture[] = []
  private isAnimating: boolean = false

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.container.visible = false
  }

  async init(): Promise<void> {
    // Create background glow effect
    this.createBackgroundGlow()
  }

  private createBackgroundGlow(): void {
    this.backgroundGlow = new Graphics()
    this.backgroundGlow.circle(0, 0, 150)
    this.backgroundGlow.fill({ color: 0xffd700, alpha: 0.3 })
    this.backgroundGlow.pivot.set(0, 0) // Center the graphics
    this.container.addChild(this.backgroundGlow)
  }

  async showWin(characterIndex: number, _winAmount: number): Promise<void> {
    
    // Prevent multiple animations from running
    if (this.isAnimating) {
      this.hide()
    }
    
    this.isAnimating = true
    
    // Clear previous animation
    this.clear()
    
    // Load and show character sprite
    await this.loadCharacterSprite(characterIndex)
    
    // Position in center of screen
    this.container.x = this.app.screen.width / 2
    this.container.y = this.app.screen.height / 2
    
    // Show and animate
    this.container.visible = true
    this.playAnimation()
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
    
    this.container.visible = false
    this.clear()
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
    
    // Remove win text (if it exists)
    if (this.winText) {
      if (this.winText.parent) {
        this.winText.parent.removeChild(this.winText)
      }
      this.winText.destroy()
      this.winText = null
    }
    
    // AGGRESSIVE CLEANUP: Remove ALL children except background glow
    const childrenToRemove = []
    for (let i = 0; i < this.container.children.length; i++) {
      const child = this.container.children[i]
      if (child !== this.backgroundGlow) {
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
