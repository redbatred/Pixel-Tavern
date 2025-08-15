import { Application } from 'pixi.js'
import { createActor } from 'xstate'
import { gameStateMachine } from './state/gameStateMachine'
import { SlotMachine } from './components/SlotMachine'
import { WinAnimation } from './components/WinAnimation'
import { AudioManager } from './audio/AudioManager'
import { UserInterface } from './ui/UserInterface'
import { AssetLoader } from './assets/AssetLoader'
import { GameConfig } from './config/GameConfig'
import { checkWins, getSpinDuration, getScrollSpeed, getWinTier } from './utils/winChecker'

export class PixelTavernGame {
  private app: Application
  private gameActor: any
  private slotMachine: SlotMachine
  private winAnimation: WinAnimation
  private audioManager: AudioManager
  private userInterface!: UserInterface
  private assetLoader: AssetLoader
  private isInitialized = false
  private autoSpinTimeout: number | null = null

  constructor() {
    this.app = new Application()
    this.assetLoader = new AssetLoader()
    this.audioManager = new AudioManager()
    this.slotMachine = new SlotMachine(this.app)
    this.winAnimation = new WinAnimation(this.app)
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
    
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: GameConfig.BACKGROUND_COLOR,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    })

    // Setup responsive canvas
    this.setupResponsiveCanvas()
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
        case 'requestAutoSpinStop':
          this.requestAutoSpinStop()
          break
        case 'setAutoSpinDelay':
          // Handle auto spin delay setting
          break
        case 'setAnimationSpeed':
          // Handle animation speed setting
          break
        case 'continueAfterWin':
          // Continue after win modal
          break
        default:
          // Unknown UI action
      }
    })
  }

  private setupResponsiveCanvas(): void {
    const resizeHandler = () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight)
      this.slotMachine?.handleResize(window.innerWidth, window.innerHeight)
      this.userInterface?.handleResize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', resizeHandler)
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
      stopAutoSpinAfterRound: context.stopAutoSpinAfterRound
    })

    // Handle audio based on state
    switch (stateValue) {
      case 'spinning':
        if (!this.isHandlingSpin) {
          this.isHandlingSpin = true
          this.audioManager.playSpinSound()
          this.handleSpin()
        }
        break
      case 'checkingWin':
        this.audioManager.stopSpinSound()
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
      
      // Start spinning animation
      const results = await this.slotMachine.spinReels(duration, scrollSpeed)
      
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
    // Add slot machine to stage
    this.app.stage.addChild(this.slotMachine.container)

    // Add win animation to stage (on top)
    this.app.stage.addChild(this.winAnimation.container)

    // Position slot machine in center
    this.slotMachine.container.x = this.app.screen.width / 2
    this.slotMachine.container.y = this.app.screen.height / 2
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
    // Clear auto-spin timeout
    if (this.autoSpinTimeout) {
      clearTimeout(this.autoSpinTimeout)
      this.autoSpinTimeout = null
    }
    
    this.gameActor?.stop()
    this.slotMachine?.destroy()
    this.audioManager?.cleanup()
    this.userInterface?.destroy()
    this.app?.destroy(true)
  }
}
