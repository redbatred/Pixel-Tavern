import { Application } from 'pixi.js'
import { createActor } from 'xstate'
import { gameStateMachine } from './state/gameStateMachine'
import { SlotMachine } from './components/SlotMachine'
import { ResponsiveBackground } from './components/ResponsiveBackground'
import { FireBackground } from './components/FireBackground'
import { WinAnimation } from './components/WinAnimation'
import { AudioManager } from './audio/AudioManager'
import { UserInterface } from './ui/UserInterface'
import { OrientationOverlay } from './ui/OrientationOverlay'
import { AssetLoader } from './assets/AssetLoader'
import { GameConfig } from './config/GameConfig'
import { DeviceUtils } from './utils/deviceUtils'
import { PerformanceOptimizer } from './utils/performanceOptimizer'
import { OptimizedAnimations } from './utils/optimizedAnimations'
import { checkWins, getSpinDuration, getScrollSpeed, getWinTier } from './utils/winChecker'
import './ui/SpinEffects.css'

export class PixelTavernGame {
  private app: Application
  private gameActor: any
  private slotMachine: SlotMachine
  private responsiveBackground: ResponsiveBackground
  private winAnimation: WinAnimation
  private fireBackground: FireBackground
  private audioManager: AudioManager
  private userInterface!: UserInterface
  private orientationOverlay: OrientationOverlay
  private assetLoader: AssetLoader
  private isInitialized = false
  private autoSpinTimeout: number | null = null
  private resizeTimeout: number | null = null
  private isMobile: boolean = false

  constructor() {
    this.app = new Application()
    this.assetLoader = new AssetLoader()
    this.audioManager = new AudioManager()
    this.slotMachine = new SlotMachine(this.app)
    this.responsiveBackground = new ResponsiveBackground(this.app)
  this.fireBackground = new FireBackground()
    this.winAnimation = new WinAnimation(this.app)
    this.orientationOverlay = new OrientationOverlay()
    
    // Detect mobile device
    this.isMobile = DeviceUtils.isMobile()
    
    // Setup mobile viewport if needed
    if (this.isMobile) {
      DeviceUtils.setupMobileViewport()
    }
    
    // UserInterface will be initialized later when we have the DOM element
  }

  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize PIXI Application
      await this.initPixiApp()

      // Initialize UI Manager after DOM is ready
      await this.initUserInterface()

      // Load assets
      await this.assetLoader.loadAssets()

      // Initialize audio system
      await this.audioManager.init()

      // Initialize state machine
      this.initStateMachine()

      // Initialize game components
      await this.slotMachine.init(this.assetLoader.getTextures())

      // Initialize responsive background
      const textures = this.assetLoader.getTextures()
      await this.responsiveBackground.init(textures.background)
  // Initialize fire background animations
  await this.fireBackground.init()
      
      // Set up resize callback for background
      this.responsiveBackground.setOnResizeCallback(() => {
        this.updateGameElementsPosition()
      })

      // Initialize win animation
      await this.winAnimation.init()

      // Setup game scene
      this.setupScene()

      // Setup event listeners
      this.setupEventListeners()

      // Start background music
      this.audioManager.playRandomBackgroundMusic()

      this.isInitialized = true

    } catch (error) {      
      // Show error message to user
      const gameContainer = document.querySelector('#game-container')
      if (gameContainer) {
        gameContainer.innerHTML = `
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #d4af37;
            font-family: Arial, sans-serif;
            text-align: center;
            background: #2c1810;
          ">
            <div>
              <h2>Failed to Load Game</h2>
              <p>Please check that all assets are properly loaded and try refreshing the page.</p>
              <p style="font-size: 12px; opacity: 0.7;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        `
      }
    }
  }

  private async initPixiApp(): Promise<void> {
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement
    
    // Get initial screen dimensions
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    await this.app.init({
      canvas,
      width: screenWidth,
      height: screenHeight,
      backgroundColor: 0x2c1810, // Fallback background color
      backgroundAlpha: 1, // Opaque background since PIXI will handle it
      antialias: false, // Disable for better performance
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
      powerPreference: 'high-performance', // Request high-performance GPU
      hello: false, // Disable PIXI hello message for slight perf gain
      eventFeatures: {
        move: true,
        globalMove: false, // Disable global move events for performance
        click: true,
        wheel: false // Disable wheel events if not needed
      }
    })

    // Initialize performance optimizer after PIXI app is ready
    PerformanceOptimizer.init(this.app)
    
    // Initialize optimized animations
    OptimizedAnimations.initializeGSAP()

    // Performance optimizations for PIXI v8
    // Enable texture garbage collection
    this.app.renderer.textureGC.maxIdle = 60 * 60 // 1 hour
    this.app.renderer.textureGC.checkCountMax = 600 // Check every 10 seconds at 60fps

    // Setup responsive viewport container
    this.setupResponsiveViewport()
    
    // Initial resize to fit current screen
    this.handleViewportResize()
  }

  private async initUserInterface(): Promise<void> {
    // Get UI overlay container
    const uiOverlay = document.getElementById('ui-overlay')
    if (!uiOverlay) {
      throw new Error('UI overlay element not found')
    }

    // Initialize UI Manager with container and audio manager
    this.userInterface = new UserInterface(uiOverlay, this.audioManager)

    // Set up game action handler
    this.userInterface.setOnGameAction((action: string, payload?: any) => {
      switch (action) {
        case 'spin':
          this.spin()
          break
        case 'setBet':
          this.setBet(payload)
          break
        case 'maxBet':
          this.setMaxBet()
          break
        case 'toggleAutoSpin':
          this.toggleAutoSpin()
          break
        case 'startAutoSpin':
          this.startAutoSpin(payload)
          break
        case 'requestAutoSpinStop':
          this.requestAutoSpinStop()
          break
        case 'setAutoSpinDelay':
          // Update auto spin delay in game state
          this.gameActor.send({ type: 'SET_AUTO_SPIN_DELAY', delay: payload })
          break
        case 'setAnimationSpeed':
          // Update animation speed in game state
          this.gameActor.send({ type: 'SET_ANIMATION_SPEED', speed: payload })
          break
        case 'continueAfterWin':
          // Continue after win modal
          break
        default:
          // Unknown UI action
      }
    })

    // Initial UI positioning to match PIXI
    const initialScale = this.calculateUnifiedScale(window.innerWidth, window.innerHeight)
    this.synchronizeUIWithPixi(initialScale, window.innerWidth, window.innerHeight)
  }

  private setupResponsiveViewport(): void {
    const resizeHandler = () => {
      // Debounce resize events to prevent excessive calls
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
      this.resizeTimeout = window.setTimeout(() => {
        this.handleViewportResize()
      }, 100)
    }

    window.addEventListener('resize', resizeHandler)
  }

  private handleViewportResize(): void {
    // Get available screen space
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Check if mobile device is in correct orientation
    if (this.isMobile && !DeviceUtils.isMobileInCorrectOrientation()) {
      // Don't update layout when orientation overlay is showing
      return
    }
    
    // Update game elements position and scale for PIXI components
    // This will also synchronize the UI automatically
    this.updateGameElementsPosition()
    
    // Notify UI of resize for any internal UI logic
    this.userInterface?.handleResize(screenWidth, screenHeight)
  }

  private calculateUnifiedScale(screenWidth: number, screenHeight: number): number {
    // Define margins for all screen sizes (not just mobile)
    const marginX = this.isMobile ? GameConfig.RESPONSIVE.MOBILE.MARGIN_X : 40
    const marginY = this.isMobile ? GameConfig.RESPONSIVE.MOBILE.MARGIN_Y : 40
    
    // Available space after margins
    const availableWidth = screenWidth - (marginX * 2)
    const availableHeight = screenHeight - (marginY * 2)
    
    // Calculate scale based on available space to maintain aspect ratio
    const scaleX = availableWidth / GameConfig.RESPONSIVE.BASE_WIDTH
    const scaleY = availableHeight / GameConfig.RESPONSIVE.BASE_HEIGHT
    
    // Use the smaller scale to maintain aspect ratio and fit within margins
    let scale = Math.min(scaleX, scaleY)
    
    if (this.isMobile) {
      // Apply mobile maximum size constraints
      const maxWidthScale = (screenWidth * GameConfig.RESPONSIVE.MOBILE.MAX_WIDTH_PERCENT) / GameConfig.RESPONSIVE.BASE_WIDTH
      const maxHeightScale = (screenHeight * GameConfig.RESPONSIVE.MOBILE.MAX_HEIGHT_PERCENT) / GameConfig.RESPONSIVE.BASE_HEIGHT
      
      scale = Math.min(scale, maxWidthScale, maxHeightScale)
    }
    
    // Apply base scale multiplier - for mobile landscape, use a more generous scale since height is limited
    const BASE_SCALE_MULTIPLIER = this.isMobile ? 1.35 : 1.18 // Standard for mobile, bigger for desktop
    scale *= BASE_SCALE_MULTIPLIER
    
    // Clamp scale within global limits
    scale = Math.max(GameConfig.RESPONSIVE.MIN_SCALE, 
             Math.min(GameConfig.RESPONSIVE.MAX_SCALE, scale))
    
    return scale
  }

  private initStateMachine(): void {
    this.gameActor = createActor(gameStateMachine, {
      input: {
        credits: GameConfig.INITIAL_CREDITS,
        betAmount: GameConfig.DEFAULT_BET,
        maxBet: GameConfig.MAX_BET
      }
    })

    // Subscribe to state changes
    this.gameActor.subscribe((state: any) => {
      this.handleStateChange(state)
    })

    this.gameActor.start()
  }

  private lastStateValue: string = ''
  private isHandlingSpin: boolean = false

  private handleStateChange(state: any): void {
    const { value: stateValue, context } = state

    // Prevent duplicate state handling
    if (stateValue === this.lastStateValue) {
      return
    }
    this.lastStateValue = stateValue

    // Update UI based on state
    this.userInterface.updateStateFromContext({
      credits: context.credits,
      betAmount: context.betAmount,
      lastWin: context.lastWin,
      isSpinning: stateValue === 'spinning',
      isAutoSpinning: context.isAutoSpinning,
      stopAutoSpinAfterRound: context.stopAutoSpinAfterRound,
      autoSpinCount: context.autoSpinCount,
      autoSpinRemaining: context.autoSpinRemaining,
      isInfiniteAutoSpin: context.isInfiniteAutoSpin,
      spinsCompleted: context.spinsCompleted
    })

    // Handle audio based on state
    switch (stateValue) {
      case 'spinning':
        if (!this.isHandlingSpin) {
          this.isHandlingSpin = true
          // Hide win animation if transitioning from win display
          this.winAnimation.hide()
          this.audioManager.startAllColumnSpinSounds() // Start all column spinning sounds
          this.slotMachine.startSpinEffects() // Start lightning effects
          this.handleSpin()
        }
        break
      case 'checkingWin':
        this.audioManager.stopAllColumnSpinSounds() // Stop any remaining column sounds
        this.slotMachine.stopSpinEffects() // Stop lightning effects
        this.isHandlingSpin = false // Reset spin flag
        this.handleWinCheck()
        break
      case 'showingWin':
        if (context.winAmount && context.winAmount > 0) {
          // Show win animation
          if (context.winningCharacter !== null) {
            this.winAnimation.showWin(context.winningCharacter, context.winAmount)
          }
          
          // Play appropriate win sound based on tier
          const tier = getWinTier(context.winAmount, context.betAmount)
          if (tier === 'epic') {
            this.audioManager.playWinSound(context.winAmount, context.betAmount) // Epic win
          } else if (tier === 'mega') {
            this.audioManager.playWinSound(context.winAmount, context.betAmount) // Mega win
          } else if (tier === 'big') {
            this.audioManager.playWinSound(context.winAmount, context.betAmount) // Big win
          } else {
            this.audioManager.playWinSound(context.winAmount, context.betAmount) // Regular win
          }
          
          // Win modal disabled - using only PIXI character animation
          // if (shouldShowWinModal(context.winAmount, context.betAmount)) {
          //   this.userInterface.showWinModal(
          //     context.winAmount, 
          //     context.winningCharacter || 'knight', 
          //     context.winAmount / context.betAmount
          //   )
          // }
        }
        break
      case 'paused':
        this.audioManager.pauseForVisibility()
        // Clear auto-spin timeout when paused
        if (this.autoSpinTimeout) {
          clearTimeout(this.autoSpinTimeout)
          this.autoSpinTimeout = null
        }
        break
      case 'checkingAutoSpin':
        // Check if UI has requested stop before continuing auto-spin
        if (this.userInterface.getStopFlag()) {
          this.userInterface.clearStopFlag()
          this.gameActor.send({ type: 'TOGGLE_AUTO_SPIN' })
        } else {
          // No stop flag detected, continuing auto-spin
        }
        break
      case 'autoSpinDelay':
        // Handle auto-spin delay state
        this.handleAutoSpinDelay(context)
        break
      case 'idle':
        if (state.history?.value === 'paused') {
          this.audioManager.resumeFromVisibility()
        }
        break
    }

    // Handle slot machine animations
    this.slotMachine.handleStateChange(stateValue, context)
    
    // Clear win animation when starting a new spin
    if (stateValue === 'spinning') {
      this.winAnimation.hide()
    }
  }

  private async handleSpin(): Promise<void> {
    try {
      const context = this.gameActor.getSnapshot().context
      const duration = getSpinDuration(context.animationSpeed)
      const scrollSpeed = getScrollSpeed(context.animationSpeed)
      
      // Start spinning animation with column stop callback
      const results = await this.slotMachine.spinReels(duration, scrollSpeed, (columnIndex) => {
        // Stop spinning sound for this specific column and play stop sound
        this.audioManager.stopColumnSpinSound(columnIndex)
      })
      
      // Send results to state machine - let it handle win checking
      this.gameActor.send({ type: 'SPIN_COMPLETE', results })
    } finally {
      // Reset the spin handling flag
      this.isHandlingSpin = false
    }
  }

  private handleWinCheck(): void {
    try {
      const context = this.gameActor.getSnapshot().context
      const results = context.slotResults
      
      if (!results || results.length === 0) {
        this.gameActor.send({ type: 'WIN_CHECK_COMPLETE', winAmount: 0, winningPositions: [], winningCharacter: null })
        return
      }

      // Use the advanced win checking logic from the original game
      const winResult = checkWins(results)
      
      this.gameActor.send({
        type: 'WIN_CHECK_COMPLETE',
        winAmount: winResult.winAmount,
        winningPositions: winResult.winningPositions,
        winningCharacter: winResult.winningCharacter
      })
      
    } catch (error) {
      // Send zero win on error to prevent state machine from hanging
      this.gameActor.send({ type: 'WIN_CHECK_COMPLETE', winAmount: 0, winningPositions: [], winningCharacter: null })
    }
  }

  private handleAutoSpinDelay(context: any): void {
    // Clear any existing timeout
    if (this.autoSpinTimeout) {
      clearTimeout(this.autoSpinTimeout)
    }
    
    // Set new timeout for auto-spin
    this.autoSpinTimeout = window.setTimeout(() => {
      this.gameActor.send({ type: 'AUTO_SPIN_TIMEOUT' })
    }, context.autoSpinDelay)
  }

  private setupScene(): void {
    // Add responsive background to stage (first, so it's behind everything)
    this.app.stage.addChild(this.responsiveBackground.getContainer())

  // Add fire background animations (still behind slot machine)
  this.app.stage.addChild(this.fireBackground.getContainer())

    // Add slot machine to stage
    this.app.stage.addChild(this.slotMachine.container)

    // Add win animation to stage (on top)
    this.app.stage.addChild(this.winAnimation.container)

    // Position elements at center of screen (not base dimensions anymore)
    this.updateGameElementsPosition()
  }

  private updateGameElementsPosition(): void {
    // Get current screen dimensions
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Calculate scale based on screen size to maintain responsive design
    const scale = this.calculateUnifiedScale(screenWidth, screenHeight)
    
    // Position slot machine at center of screen
    this.slotMachine.container.x = screenWidth / 2
    this.slotMachine.container.y = screenHeight / 2
    this.slotMachine.container.scale.set(scale)
    
    // Position win animation at center of screen
    this.winAnimation.container.x = screenWidth / 2
    this.winAnimation.container.y = screenHeight / 2
    this.winAnimation.container.scale.set(scale)
    
    // Position fire background container at center and optionally scale with viewport or background
    if (this.fireBackground) {
      const fbContainer = this.fireBackground.getContainer()
      fbContainer.x = screenWidth / 2
      fbContainer.y = screenHeight / 2
      if (GameConfig.FIRE_BACKGROUND.FOLLOW_BACKGROUND) {
        // Match the background's scale so fire appears glued to it (supports non-uniform stretch)
        const bgScaleX = (this.responsiveBackground as any).getScaleX?.() ?? this.responsiveBackground.getScale?.() ?? scale
        const bgScaleY = (this.responsiveBackground as any).getScaleY?.() ?? this.responsiveBackground.getScale?.() ?? scale
        fbContainer.scale.set(bgScaleX, bgScaleY)
        // Recompute wrapper positions every resize from authored values
        const texSize = this.responsiveBackground.getTextureSize?.()
        if (texSize) {
          this.fireBackground.updatePlacementForBackground(
            texSize.width,
            texSize.height,
            GameConfig.RESPONSIVE.BASE_WIDTH,
            GameConfig.RESPONSIVE.BASE_HEIGHT,
            GameConfig.FIRE_BACKGROUND.COORD_SPACE as 'design' | 'background'
          )
        }
      } else if (GameConfig.FIRE_BACKGROUND.SCALE_WITH_VIEWPORT) {
        fbContainer.scale.set(scale)
      } else {
        fbContainer.scale.set(1)
      }
    }
    
    // Synchronize UI viewport container to match PIXI positioning exactly
    this.synchronizeUIWithPixi(scale, screenWidth, screenHeight)
  }

  private synchronizeUIWithPixi(pixiScale: number, screenWidth: number, screenHeight: number): void {
    // Get the viewport container
    const viewportContainer = document.getElementById('viewport-container')
    if (viewportContainer) {
      // Use the exact same positioning logic as PIXI elements
      const centerX = screenWidth / 2
      const centerY = screenHeight / 2
      
      // Position UI container exactly where PIXI slot machine is positioned
      viewportContainer.style.position = 'fixed'
      viewportContainer.style.left = `${centerX}px`
      viewportContainer.style.top = `${centerY}px`
      viewportContainer.style.transform = `translate(-50%, -50%) scale(${pixiScale})`
      viewportContainer.style.transformOrigin = 'center center'
      viewportContainer.style.width = '1920px'
      viewportContainer.style.height = '1080px'
      viewportContainer.style.setProperty('--viewport-scale', pixiScale.toString())
      
      // Apply mobile-specific CSS class for responsive adjustments
      const uiOverlay = document.getElementById('ui-overlay')
      if (uiOverlay) {
        if (this.isMobile || screenWidth <= 768) {
          uiOverlay.classList.add('mobile-ui')
          
          // Apply compact mode for very small screens
          if (screenWidth <= 480) {
            uiOverlay.style.setProperty('--mobile-compact', '1')
          } else {
            uiOverlay.style.setProperty('--mobile-compact', '0')
          }
        } else {
          uiOverlay.classList.remove('mobile-ui')
          uiOverlay.style.setProperty('--mobile-compact', '0')
        }
        
        // Ensure UI overlay positioning is synchronized
        uiOverlay.style.position = 'absolute'
        uiOverlay.style.width = '100%'
        uiOverlay.style.height = '100%'
        uiOverlay.style.pointerEvents = 'none'
        uiOverlay.style.overflow = 'visible'
      }
      
      // Ensure game container maintains proper dimensions
      const gameContainer = document.getElementById('game-container')
      if (gameContainer) {
        gameContainer.style.position = 'relative'
        gameContainer.style.width = '100%'
        gameContainer.style.height = '100%'
        gameContainer.style.overflow = 'visible'
      }
    }
  }

  private setupEventListeners(): void {
    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.gameActor.send({ type: 'PAUSE' })
      } else {
        this.gameActor.send({ type: 'RESUME' })
      }
    })

    // Window focus/blur handling
    window.addEventListener('blur', () => {
      this.gameActor.send({ type: 'PAUSE' })
    })

    window.addEventListener('focus', () => {
      this.gameActor.send({ type: 'RESUME' })
    })
    
    // Mobile-specific event listeners
    if (this.isMobile) {
      // Handle orientation changes with debouncing
      let orientationTimeout: number | null = null
      
      const handleOrientationChange = () => {
        if (orientationTimeout) {
          clearTimeout(orientationTimeout)
        }
        
        orientationTimeout = window.setTimeout(() => {
          // Check if device is now in correct orientation
          if (DeviceUtils.isMobileInCorrectOrientation()) {
            // Try to lock orientation to landscape
            DeviceUtils.lockOrientation()
            
            // Resume game if it was paused due to orientation
            this.gameActor.send({ type: 'RESUME' })
            
            // Trigger resize to update layout
            this.handleViewportResize()
          } else {
            // Pause game when in wrong orientation
            this.gameActor.send({ type: 'PAUSE' })
          }
        }, 300)
      }
      
      // Listen for orientation changes
      window.addEventListener('orientationchange', handleOrientationChange)
      window.addEventListener('resize', handleOrientationChange)
      
      // Listen for orientation overlay events
      window.addEventListener('orientationOverlayShow', () => {
        this.gameActor.send({ type: 'PAUSE' })
      })
      
      window.addEventListener('orientationOverlayHide', () => {
        this.gameActor.send({ type: 'RESUME' })
        this.handleViewportResize()
      })
      
      // Prevent default touch behaviors that might interfere with the game
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault() // Prevent pinch zoom
        }
      }, { passive: false })
      
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault() // Prevent pinch zoom
        }
      }, { passive: false })
      
      // Prevent double-tap zoom
      let lastTouchEnd = 0
      document.addEventListener('touchend', (e) => {
        const now = Date.now()
        if (now - lastTouchEnd <= 300) {
          e.preventDefault()
        }
        lastTouchEnd = now
      }, false)
    }
  }

  // Public methods for UI interaction
  public spin(): void {
    this.gameActor.send({ type: 'SPIN' })
  }

  public setBet(amount: number): void {
    this.gameActor.send({ type: 'SET_BET', amount })
  }

  public setMaxBet(): void {
    this.gameActor.send({ type: 'MAX_BET' })
  }

  public toggleAutoSpin(): void {
    this.gameActor.send({ type: 'TOGGLE_AUTO_SPIN' })
  }

  public startAutoSpin(payload: { count: number; isInfinite: boolean }): void {
    this.gameActor.send({ 
      type: 'START_AUTO_SPIN', 
      count: payload.count,
      isInfinite: payload.isInfinite
    })
  }

  public requestAutoSpinStop(): void {
    this.gameActor.send({ type: 'REQUEST_AUTO_SPIN_STOP' })
  }

  public checkUIStopFlag(): boolean {
    // Check if UI has requested a stop
    return this.userInterface.getStopFlag()
  }

  public getGameState(): any {
    return this.gameActor.getSnapshot()
  }

  public destroy(): void {
    // Clear timeouts
    if (this.autoSpinTimeout) {
      clearTimeout(this.autoSpinTimeout)
      this.autoSpinTimeout = null
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }
    
    this.gameActor?.stop()
    this.slotMachine?.destroy()
    this.responsiveBackground?.destroy()
  this.fireBackground?.destroy()
    this.audioManager?.cleanup()
    this.userInterface?.destroy()
    this.orientationOverlay?.destroy()
    this.app?.destroy(true)
  }
}
