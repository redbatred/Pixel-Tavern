import { Container, Sprite, Texture, Assets } from 'pixi.js'

export class TurboPadlock extends Container {
  private padlockSprite: Sprite
  private frames: Texture[] = []
  private isAnimating = false
  private isUnlocked = false
  private animationSpeed = 60 // milliseconds per frame

  constructor() {
    super()
    
    // Create the padlock sprite
    this.padlockSprite = new Sprite()
    this.addChild(this.padlockSprite)
    
    // Make it non-interactive since it's controlled by the contraption switch
    this.interactive = false
    this.cursor = 'default'
  }

  async loadTextures(): Promise<void> {
    try {
      // Load all 31 frames of the GOLD padlock animation (0000 to 0030)
      const framePromises: Promise<Texture>[] = []
      
      for (let i = 0; i <= 30; i++) {
        const frameNumber = i.toString().padStart(4, '0')
        const framePath = `/assets/images/Extending Padlock/GOLD/Sprites/Extending Padlock - GOLD - ${frameNumber}.png`
        framePromises.push(Assets.load(framePath))
      }
      
      this.frames = await Promise.all(framePromises)
      
      // Set initial frame (unlocked state - frame 0)
      this.padlockSprite.texture = this.frames[0]
      
      // Set anchor to center
      this.padlockSprite.anchor.set(0.5, 0.5)
      
    } catch (error) {
      console.error('Failed to load padlock textures:', error)
      throw error
    }
  }

  private async animate(): Promise<void> {
    if (this.isAnimating || this.frames.length === 0) return
    
    this.isAnimating = true
    
    if (this.isUnlocked) {
      // When turbo is enabled (unlocked=true), padlock should lock (frame 0 to 13)
      await this.playFrameSequence(0, 13)
    } else {
      // When turbo is disabled (unlocked=false), padlock should unlock (frame 13 to 0)
      await this.playFrameSequence(13, 0)
    }
    
    this.isAnimating = false
  }

  private async playFrameSequence(startFrame: number, endFrame: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const direction = startFrame < endFrame ? 1 : -1
      let currentFrame = startFrame
      
      const animateFrame = () => {
        if (this.frames[currentFrame]) {
          this.padlockSprite.texture = this.frames[currentFrame]
        }
        
        if (currentFrame === endFrame) {
          resolve()
          return
        }
        
        currentFrame += direction
        setTimeout(animateFrame, this.animationSpeed)
      }
      
      animateFrame()
    })
  }

  public setUnlocked(unlocked: boolean, immediate = false): void {
    this.isUnlocked = unlocked
    
    if (immediate) {
      // Set frame immediately without animation
      // When unlocked=true (turbo enabled), show locked padlock (frame 13)
      // When unlocked=false (turbo disabled), show unlocked padlock (frame 0)
      const frameIndex = unlocked ? 13 : 0
      if (this.frames[frameIndex]) {
        this.padlockSprite.texture = this.frames[frameIndex]
      }
    } else if (!this.isAnimating) {
      // Animate to the new state
      this.animate()
    }
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked
  }

  public setPosition(x: number, y: number): void {
    // Set position directly without additional offsets for proper responsiveness
    this.x = x
    this.y = y
  }

  public setScale(scaleX: number, scaleY: number = scaleX): void {
    // Set scale directly without additional scaling for proper responsiveness
    this.scale.set(scaleX, scaleY)
  }
}
