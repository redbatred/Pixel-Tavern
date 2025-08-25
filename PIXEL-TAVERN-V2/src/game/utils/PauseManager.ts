/**
 * Enhanced but safe pause manager for all game systems
 * Handles PIXI AnimatedSprites and provides callback system for components
 * Stores and restores timeout states for perfect pause/resume behavior
 */
export class PauseManager {
  private isPaused = false
  private pixiApp: any = null
  private pauseCallbacks: Array<() => void> = []
  private resumeCallbacks: Array<() => void> = []
  private pausedAnimatedSprites: Set<any> = new Set()
  
  // Store timeout states when paused
  private pausedTimeouts: Map<string, {
    callback: () => void,
    remainingTime: number,
    startTime: number
  }> = new Map()
  
  // Store slot machine reference for direct pause/resume
  private slotMachine: any = null

  constructor() {
    // Safe approach - no global function interception
  }

  /**
   * Initialize the pause manager with PIXI.js application
   */
  initialize(pixiApp: any): void {
    this.pixiApp = pixiApp
  }

  /**
   * Register the slot machine for direct pause/resume control
   */
  registerSlotMachine(slotMachine: any): void {
    this.slotMachine = slotMachine
  }

  /**
   * Register a callback to be called when the game is paused
   */
  onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback)
  }

  /**
   * Register a callback to be called when the game is resumed
   */
  onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback)
  }

  /**
   * Store a timeout that should be paused/resumed
   */
  storeTimeout(id: string, callback: () => void, originalDelay: number, startTime: number): void {
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, originalDelay - elapsed)
    
    this.pausedTimeouts.set(id, {
      callback,
      remainingTime,
      startTime
    })
    
    console.log(`⏱️ Stored timeout '${id}' with ${remainingTime}ms remaining`)
  }

  /**
   * Get stored timeout information
   */
  getStoredTimeout(id: string): { callback: () => void, remainingTime: number } | null {
    const stored = this.pausedTimeouts.get(id)
    if (stored) {
      // Remove it once retrieved
      this.pausedTimeouts.delete(id)
      return {
        callback: stored.callback,
        remainingTime: stored.remainingTime
      }
    }
    return null
  }

  /**
   * Check if a timeout is stored
   */
  hasStoredTimeout(id: string): boolean {
    return this.pausedTimeouts.has(id)
  }

  /**
   * Recursively find and pause all AnimatedSprites in a container
   */
  private pauseAnimatedSprites(container: any): void {
    if (!container || !container.children) return

    container.children.forEach((child: any) => {
      // Check if it's an AnimatedSprite and is currently playing
      if (child.constructor.name === 'AnimatedSprite' || 
          (child.play && child.stop && child.playing !== undefined)) {
        if (child.playing) {
          child.stop()
          this.pausedAnimatedSprites.add(child)
          console.log('🎬 Paused AnimatedSprite')
        }
      }
      
      // Recursively check children
      if (child.children && child.children.length > 0) {
        this.pauseAnimatedSprites(child)
      }
    })
  }

  /**
   * Resume all paused AnimatedSprites
   */
  private resumeAnimatedSprites(): void {
    let resumedCount = 0
    this.pausedAnimatedSprites.forEach((sprite: any) => {
      try {
        if (sprite && sprite.play && !sprite.playing) {
          sprite.play()
          resumedCount++
        }
      } catch (error) {
        console.warn('Could not resume AnimatedSprite:', error)
      }
    })
    this.pausedAnimatedSprites.clear()
    if (resumedCount > 0) {
      console.log(`🎬 Resumed ${resumedCount} AnimatedSprites`)
    }
  }

  /**
   * Pause all game systems
   */
  pause(): void {
    if (this.isPaused) return

    console.log('🎮 PauseManager: Pausing all game systems')
    this.isPaused = true

    // Pause PIXI.js ticker - stops main render loop
    if (this.pixiApp && this.pixiApp.ticker) {
      this.pixiApp.ticker.stop()
      console.log('⏸️ PIXI ticker stopped')
    }

    // Pause all AnimatedSprites in the scene
    if (this.pixiApp && this.pixiApp.stage) {
      this.pauseAnimatedSprites(this.pixiApp.stage)
    }

    // Pause slot machine spinning directly (more reliable than global GSAP pause)
    if (this.slotMachine && this.slotMachine.isCurrentlySpinning()) {
      this.slotMachine.pauseSpinning()
    }

    // Pause CSS animations by adding a class to body
    document.body.classList.add('game-paused')

    // Execute custom pause callbacks
    this.pauseCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in pause callback:', error)
      }
    })
  }

  /**
   * Resume all game systems
   */
  resume(): void {
    if (!this.isPaused) return

    console.log('🎮 PauseManager: Resuming all game systems')
    this.isPaused = false

    // Resume PIXI.js ticker
    if (this.pixiApp && this.pixiApp.ticker) {
      this.pixiApp.ticker.start()
      console.log('▶️ PIXI ticker started')
    }

    // Resume all paused AnimatedSprites
    this.resumeAnimatedSprites()

    // Resume slot machine spinning directly
    if (this.slotMachine) {
      this.slotMachine.resumeSpinning()
    }

    // Resume CSS animations
    document.body.classList.remove('game-paused')

    // Execute custom resume callbacks
    this.resumeCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in resume callback:', error)
      }
    })
  }

  /**
   * Get current pause state
   */
  getIsPaused(): boolean {
    return this.isPaused
  }

  /**
   * Cleanup function
   */
  destroy(): void {
    console.log('🎮 PauseManager: Cleaning up')
    
    // Clear paused sprites
    this.pausedAnimatedSprites.clear()
    
    this.pauseCallbacks = []
    this.resumeCallbacks = []

    // Remove CSS class
    document.body.classList.remove('game-paused')
  }
}

// Global singleton instance
export const pauseManager = new PauseManager()
