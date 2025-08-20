import { Application, Container, Sprite, Texture } from 'pixi.js'

export class ResponsiveBackground {
  private app: Application
  private container: Container
  private background!: Sprite
  private texture!: Texture
  private resizeHandler: () => void
  private isResizing: boolean = false
  private onResizeCallback?: () => void
  private currentScale: number = 1
  private currentScaleX: number = 1
  private currentScaleY: number = 1

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.container.zIndex = -1000 // Ensure background is always behind everything
    
    // Bind resize handler
    this.resizeHandler = this.handleResize.bind(this)
  }

  public setOnResizeCallback(callback: () => void): void {
    this.onResizeCallback = callback
  }

  public async init(backgroundTexture: Texture): Promise<void> {
    this.texture = backgroundTexture
    this.background = new Sprite(this.texture)
    
    // Set initial properties
    this.background.anchor.set(0.5)
    this.background.x = 0
    this.background.y = 0
    
    this.container.addChild(this.background)
    
    // Listen for window resize events only (not PIXI renderer to avoid loops)
    window.addEventListener('resize', this.resizeHandler)
    
    // Force initial resize to ensure proper coverage
    this.handleResize()
    
    // Also trigger a delayed resize to catch any initial sizing issues
    setTimeout(() => {
      this.handleResize()
      // Trigger window resize event to ensure everything is properly sized
      window.dispatchEvent(new Event('resize'))
    }, 200)
  }

  private handleResize(): void {
    if (!this.background || !this.texture || this.isResizing) return

    // Prevent recursive calls
    this.isResizing = true

    try {
      // Get current window dimensions for true full-screen coverage
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Update PIXI renderer to match window size (only if different)
      if (this.app.renderer.width !== screenWidth || this.app.renderer.height !== screenHeight) {
        this.app.renderer.resize(screenWidth, screenHeight)
      }
      
      // Get texture dimensions
      const textureWidth = this.texture.width
      const textureHeight = this.texture.height
      
  // Calculate non-uniform scale so the background always fills the screen with no borders
  const scaleX = screenWidth / textureWidth
  const scaleY = screenHeight / textureHeight

  // Apply stretch (like background-size: 100% 100%)
  this.background.scale.set(scaleX, scaleY)
  this.currentScaleX = scaleX
  this.currentScaleY = scaleY
  // Keep currentScale for backward compatibility (use average)
  this.currentScale = (scaleX + scaleY) / 2
      
      // Update container position to center of screen
      this.container.x = screenWidth / 2
      this.container.y = screenHeight / 2
      
      // Ensure the background sprite is centered
      this.background.x = 0
      this.background.y = 0
      
      // Call the resize callback if set
      if (this.onResizeCallback) {
        this.onResizeCallback()
      }
    } finally {
      // Reset the flag after a short delay to allow for any pending resize events
      setTimeout(() => {
        this.isResizing = false
      }, 50)
    }
  }

  public getContainer(): Container {
    return this.container
  }

  public getScale(): number {
    return this.currentScale
  }

  // New helpers for non-uniform scaling consumers
  public getScaleX(): number {
    return this.currentScaleX
  }

  public getScaleY(): number {
    return this.currentScaleY
  }

  public getTextureSize(): { width: number; height: number } | null {
    if (!this.texture) return null
    return { width: this.texture.width, height: this.texture.height }
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resizeHandler)
    this.container.destroy({ children: true })
  }
}
