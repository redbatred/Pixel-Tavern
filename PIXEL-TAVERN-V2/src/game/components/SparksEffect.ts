import { Container, AnimatedSprite, Texture } from 'pixi.js'

// Sparks effect config - follows the same pattern as BloodSplatEffectBackground
const SparksEffectConfig = {
  ENABLED: true,
  USE_GIF: true,
  GIF_URL: '/assets/images/Particle FX 1.3 Free/GIFs/Sparks.gif',
  SCALE: 1,
  ANIMATION_SPEED: 0.4,
  ALPHA: 1.2,
  BASE_POSITION: { x: -40, y: -20 }, // Base position that all sparks rotate around - edit this to move the center
  SPARK_DISTANCE: 10, // Distance from base position for each spark
  INDIVIDUAL_ROTATIONS: [220, 250, 210, 230, 240, 215, 240] // Individual rotation for each spark in degrees - edit these
}

export class SparksEffect extends Container {
  private sparksSprites: AnimatedSprite[] = []
  private isPlaying = false
  private isInitialized = false

  constructor() {
    super()
    // Set lower zIndex so sparks render beneath the padlock
    this.zIndex = 5000  // Lower than padlock zIndex
    this.sortableChildren = true
    this.visible = false // Start invisible until effect is triggered
    this.alpha = 1.0 // Full alpha for debugging
    // Don't load automatically in constructor
  }

  /**
   * Initialize the sparks effect (async)
   */
  public async init(): Promise<void> {
    if (this.isInitialized || !SparksEffectConfig.ENABLED) {
      return
    }
    
    // Try GIF path first if enabled
    if (SparksEffectConfig.USE_GIF && SparksEffectConfig.GIF_URL) {
      const gifTextures = await this.buildFromGif(SparksEffectConfig.GIF_URL)
      if (gifTextures && gifTextures.length) {
        this.createInstances(gifTextures)
        this.isInitialized = true
        console.log('Sparks effect initialized with', this.sparksSprites.length, 'sprites')
        return
      }
    }

    this.isInitialized = true
  }

  // Build textures from a GIF file if available - same logic as BloodSplatEffectBackground
  private async buildFromGif(url: string): Promise<Texture[] | null> {
    try {
      console.log('Loading sparks texture from:', url)
      // Dynamic import so app works without the package if not used
      const mod: any = await import('gifuct-js')
      const parseGIF = mod.parseGIF as (buf: ArrayBuffer) => any
      const decompressFrames = mod.decompressFrames as (gif: any, build: boolean) => any[]
      
      const resp = await fetch(encodeURI(url))
      if (!resp.ok) {
        console.error('Failed to fetch sparks gif:', resp.statusText)
        return null
      }
      
      const buf = await resp.arrayBuffer()
      const gif = parseGIF(buf)
      const frames = decompressFrames(gif, true)
      
      if (!frames || !frames.length) {
        console.error('No frames found in sparks gif')
        return null
      }
      
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
      
      console.log('Sparks gif loaded successfully with', textures.length, 'frames')
      return textures
    } catch (e) {
      console.error('Failed to load sparks gif:', e)
      return null
    }
  }

  private createInstances(frames: Texture[]): void {
    // Create sparks based on individual rotations around base position
    SparksEffectConfig.INDIVIDUAL_ROTATIONS.forEach((rotationDegrees, index) => {
      const spark = new AnimatedSprite(frames)
      
      // Calculate position based on base position and individual rotation
      const rotationRadians = (rotationDegrees * Math.PI) / 180
      const sparkX = SparksEffectConfig.BASE_POSITION.x + Math.cos(rotationRadians) * SparksEffectConfig.SPARK_DISTANCE
      const sparkY = SparksEffectConfig.BASE_POSITION.y + Math.sin(rotationRadians) * SparksEffectConfig.SPARK_DISTANCE
      
      // Set initial properties
      spark.anchor.set(0.5)
      spark.x = sparkX
      spark.y = sparkY
      spark.alpha = 0 // Start hidden
      spark.scale.set(SparksEffectConfig.SCALE * (0.7 + Math.random() * 0.6)) // Random scale variation
      
      // Set the spark's own rotation to the same angle (so sparks point outward from center)
      spark.rotation = rotationRadians + (Math.random() * 0.5 - 0.25) // Base rotation + small random variation
      
      spark.animationSpeed = SparksEffectConfig.ANIMATION_SPEED * (0.8 + Math.random() * 0.4) // Random speed variation
      spark.loop = true
      spark.roundPixels = true
      spark.visible = false // Start invisible until effect is triggered
      spark.zIndex = 1000 + index // Ensure proper layering
      
      // Add blend mode to eliminate black backgrounds (same as BloodSplatEffectBackground)
      spark.blendMode = 'add'
      
      // Add minimal random offset for variation
      spark.x += (Math.random() - 0.5) * 5
      spark.y += (Math.random() - 0.5) * 5
      
      this.sparksSprites.push(spark)
      this.addChild(spark)
      
      // Start playing immediately for debugging
      spark.play()
      
      console.log(`Created spark ${index} at position:`, spark.x, spark.y, 'rotation:', rotationDegrees, 'degrees')
    })
  }

  /**
   * Start the sparks effect animation
   */
  public startEffect(): void {
    console.log('startEffect called, isInitialized:', this.isInitialized, 'isPlaying:', this.isPlaying, 'sprites count:', this.sparksSprites.length)
    console.log('Sparks effect position:', this.x, this.y)
    console.log('Sparks effect scale:', this.scale.x, this.scale.y)
    console.log('Sparks effect visible:', this.visible)
    console.log('Container children count:', this.children.length)
    
    if (!this.isInitialized) {
      console.log('Sparks not initialized yet, skipping startEffect')
      return
    }
    
    if (this.isPlaying || this.sparksSprites.length === 0) {
      console.log('Skipping startEffect - already playing or no sprites')
      return
    }
    
    this.isPlaying = true
    this.visible = true // Make sure container is visible
    console.log('Starting sparks effect with', this.sparksSprites.length, 'sprites')
    
    // Show and start all sparks with slight delays for a cascading effect
    this.sparksSprites.forEach((spark, index) => {
      const delay = index * 100 // 100ms delay between each spark
      
      setTimeout(() => {
        if (this.isPlaying) {
          spark.visible = true
          spark.alpha = SparksEffectConfig.ALPHA
          spark.play()
          console.log(`Started spark ${index} at global position:`, {
            x: this.x + spark.x,
            y: this.y + spark.y,
            visible: spark.visible,
            alpha: spark.alpha,
            scale: spark.scale.x,
            playing: spark.playing
          })
        }
      }, delay)
    })
  }

  /**
   * Stop the sparks effect animation
   */
  public stopEffect(): void {
    if (!this.isPlaying) return
    
    this.isPlaying = false
    console.log('Stopping sparks effect')
    
    // Hide and stop all sparks
    this.sparksSprites.forEach(spark => {
      spark.visible = false
      spark.alpha = 0
      spark.stop()
    })
    
    // Hide the container as well
    this.visible = false
  }

  /**
   * Check if the effect is currently playing
   */
  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Set the position of the entire sparks effect
   */
  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  /**
   * Set the scale of the entire sparks effect
   */
  public setScale(scale: number): void {
    this.scale.set(scale)
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopEffect()
    this.sparksSprites.forEach(spark => {
      spark.destroy()
    })
    this.sparksSprites = []
    super.destroy()
  }
}
