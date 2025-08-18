/**
 * Lightweight Performance Optimization for PIXI.js v8 Slot Machine
 * Focuses on memory management without affecting animation timing
 */

import { Application, Container, Sprite, Graphics } from 'pixi.js'

export class PerformanceOptimizer {
  private static app: Application
  private static spritePool: SpritePool
  private static graphicsPool: GraphicsPool
  private static isOptimized: boolean = false

  /**
   * Initialize performance optimizer with PIXI application
   */
  static init(app: Application): void {
    this.app = app
    this.setupAdvancedOptimizations()
    this.setupMemoryManagement()
    this.initObjectPools()
    this.isOptimized = true
  }

  /**
   * Setup advanced PIXI optimizations without affecting animation timing
   */
  private static setupAdvancedOptimizations(): void {
    if (!this.app) return

    // Enable advanced rendering optimizations (no ticker changes)
    const renderer = this.app.renderer
    
    // Optimize texture garbage collection
    renderer.textureGC.maxIdle = 60 * 60 // 1 hour
    renderer.textureGC.checkCountMax = 600 // Check every 10 seconds
    
    // Periodic texture cleanup for memory management
    setInterval(() => {
      renderer.textureGC.run()
    }, 30000) // Every 30 seconds
  }

  /**
   * Setup memory management
   */
  private static setupMemoryManagement(): void {
    // Clean up memory periodically without affecting performance
    setInterval(() => {
      this.cleanupMemory()
    }, 60000) // Every minute
  }

  /**
   * Clean up memory without affecting performance
   */
  private static cleanupMemory(): void {
    // Clean object pools
    if (this.spritePool) {
      this.spritePool.cleanup()
    }
    if (this.graphicsPool) {
      this.graphicsPool.cleanup()
    }

    // Optional garbage collection if available
    const globalAny = window as any
    if (globalAny.gc && typeof globalAny.gc === 'function') {
      globalAny.gc()
    }
  }

  /**
   * Initialize object pools
   */
  private static initObjectPools(): void {
    this.spritePool = new SpritePool(50) // Reasonable pool size
    this.graphicsPool = new GraphicsPool(20)
  }

  /**
   * Get optimized sprite from pool
   */
  static getSprite(): Sprite {
    return this.spritePool ? this.spritePool.get() : new Sprite()
  }

  /**
   * Return sprite to pool
   */
  static returnSprite(sprite: Sprite): void {
    if (this.spritePool) {
      this.spritePool.return(sprite)
    }
  }

  /**
   * Get optimized graphics from pool
   */
  static getGraphics(): Graphics {
    return this.graphicsPool ? this.graphicsPool.get() : new Graphics()
  }

  /**
   * Return graphics to pool
   */
  static returnGraphics(graphics: Graphics): void {
    if (this.graphicsPool) {
      this.graphicsPool.return(graphics)
    }
  }

  /**
   * Optimize container for better batching without affecting animations
   */
  static optimizeContainer(container: Container): void {
    // Enable sorting for better batching
    container.sortableChildren = true
    
    // Disable unnecessary interactions for performance
    container.interactiveChildren = false
  }

  /**
   * Optimize sprite for better performance without affecting animations
   */
  static optimizeSprite(sprite: Sprite): void {
    // Disable interaction unless needed
    sprite.interactive = false
    sprite.interactiveChildren = false
  }

  /**
   * Create optimized animation with reduced complexity
   */
  static createOptimizedAnimation(callback: () => void, fps: number = 60): () => void {
    let lastCall = 0
    const interval = 1000 / fps

    return () => {
      const now = performance.now()
      if (now - lastCall >= interval) {
        lastCall = now
        callback()
      }
    }
  }

  /**
   * Batch sprite operations for better performance
   */
  static batchSpriteOperations(sprites: Sprite[], operation: (sprite: Sprite) => void): void {
    // Process in chunks to avoid blocking the main thread
    const chunkSize = 10
    let index = 0

    const processChunk = () => {
      const end = Math.min(index + chunkSize, sprites.length)
      for (let i = index; i < end; i++) {
        operation(sprites[i])
      }
      index = end

      if (index < sprites.length) {
        requestAnimationFrame(processChunk)
      }
    }

    processChunk()
  }

  /**
   * Check if performance optimizations are active
   */
  static isOptimizationActive(): boolean {
    return this.isOptimized
  }

  /**
   * Get current FPS
   */
  static getCurrentFPS(): number {
    return this.app ? this.app.ticker.FPS : 0
  }
}

/**
 * Sprite object pool for memory optimization
 */
export class SpritePool {
  private pool: Sprite[] = []
  private maxSize: number

  constructor(initialSize: number) {
    this.maxSize = initialSize * 2 // Allow growth
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Sprite())
    }
  }

  get(): Sprite {
    if (this.pool.length > 0) {
      const sprite = this.pool.pop()!
      sprite.visible = true
      return sprite
    }
    return new Sprite()
  }

  return(sprite: Sprite): void {
    if (this.pool.length < this.maxSize) {
      sprite.visible = false
      sprite.texture = null as any // Clear texture reference
      sprite.parent?.removeChild(sprite)
      this.pool.push(sprite)
    } else {
      sprite.destroy()
    }
  }

  clear(): void {
    this.pool.forEach(sprite => sprite.destroy())
    this.pool.length = 0
  }

  cleanup(): void {
    // Remove excess sprites to prevent memory bloat
    while (this.pool.length > this.maxSize / 2) {
      const sprite = this.pool.pop()
      if (sprite) sprite.destroy()
    }
  }
}

/**
 * Graphics object pool for memory optimization
 */
export class GraphicsPool {
  private pool: Graphics[] = []
  private maxSize: number

  constructor(initialSize: number) {
    this.maxSize = initialSize * 2
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Graphics())
    }
  }

  get(): Graphics {
    if (this.pool.length > 0) {
      const graphics = this.pool.pop()!
      graphics.visible = true
      graphics.clear()
      return graphics
    }
    return new Graphics()
  }

  return(graphics: Graphics): void {
    if (this.pool.length < this.maxSize) {
      graphics.visible = false
      graphics.clear()
      graphics.parent?.removeChild(graphics)
      this.pool.push(graphics)
    } else {
      graphics.destroy()
    }
  }

  clear(): void {
    this.pool.forEach(graphics => graphics.destroy())
    this.pool.length = 0
  }

  cleanup(): void {
    // Remove excess graphics to prevent memory bloat
    while (this.pool.length > this.maxSize / 2) {
      const graphics = this.pool.pop()
      if (graphics) graphics.destroy()
    }
  }
}

/**
 * Animation performance utilities
 */
export class AnimationOptimizer {
  /**
   * Throttle animation updates based on performance
   */
  static throttleAnimation(callback: () => void, fps: number = 30): () => void {
    let lastCall = 0
    const interval = 1000 / fps

    return () => {
      const now = Date.now()
      if (now - lastCall >= interval) {
        lastCall = now
        callback()
      }
    }
  }

  /**
   * Create performance-aware particle system
   */
  static createParticleSystem(maxParticles: number): ParticleSystem {
    return new ParticleSystem(maxParticles)
  }
}

/**
 * Optimized particle system
 */
export class ParticleSystem {
  private particles: Sprite[] = []
  private deadParticles: Sprite[] = []
  private maxParticles: number

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles
  }

  emit(sprite: Sprite): void {
    if (this.particles.length >= this.maxParticles) {
      // Recycle oldest particle
      const recycled = this.particles.shift()!
      this.deadParticles.push(recycled)
    }

    this.particles.push(sprite)
  }

  update(): void {
    // Use reversed loop for safe removal during iteration
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      // Update particle logic here
      particle.alpha -= 0.02
      
      if (particle.alpha <= 0) {
        this.particles.splice(i, 1)
        this.deadParticles.push(particle)
      }
    }
  }

  getDeadParticle(): Sprite | null {
    return this.deadParticles.pop() || null
  }

  destroy(): void {
    this.particles.forEach(p => p.destroy())
    this.deadParticles.forEach(p => p.destroy())
    this.particles.length = 0
    this.deadParticles.length = 0
  }
}
