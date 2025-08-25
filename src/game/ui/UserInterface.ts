import { AudioManager } from '../audio/AudioManager'
import { InfoModal } from './InfoModal'
import { SettingsModal } from './SettingsModal'
import { AutoSpinModal } from './AutoSpinModal'
import { HistoryBoard } from './HistoryBoard'
import { GameConfig } from '../config/GameConfig'
import { DeviceUtils } from '../utils/DeviceUtils'
import './modals.css'

interface UIState {
  credits: number
  betAmount: number
  lastWin: number
  isSpinning: boolean
  isAutoSpinning: boolean
  stopAutoSpinAfterRound: boolean
  autoSpinCount: number
  autoSpinRemaining: number
  isInfiniteAutoSpin: boolean
  spinsCompleted: number
  showCustomBetInput: boolean
  customBetInput: string
  isInstantMode: boolean
  isPadlockAnimating: boolean
}

export class UserInterface {
  private container: HTMLElement
  private audioManager: AudioManager
  private state: UIState
  private betAmounts = [5, 10, 25, 50, 100]
  private onGameAction?: (action: string, data?: any) => void
  private infoModal: InfoModal
  private settingsModal: SettingsModal
  private autoSpinModal: AutoSpinModal
  private historyBoard!: HistoryBoard // Use definite assignment assertion


  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
    this.state = {
      credits: 1000,
      betAmount: 10,
      lastWin: 0,
      isSpinning: false,
      isAutoSpinning: false,
      stopAutoSpinAfterRound: false,
      autoSpinCount: 0,
      autoSpinRemaining: 0,
      isInfiniteAutoSpin: false,
      spinsCompleted: 0,
      showCustomBetInput: false,
      customBetInput: '',
      isInstantMode: false,
      isPadlockAnimating: false
    }
    
    // Initialize modals
    this.infoModal = new InfoModal(document.body, audioManager)
    this.settingsModal = new SettingsModal(document.body, audioManager)
    this.autoSpinModal = new AutoSpinModal(document.body, audioManager)
    
    // Connect settings modal to game actions
    this.settingsModal.setOnSettingsChange((settings) => {
      if (settings.animationSpeed) {
        this.onGameAction?.('setAnimationSpeed', settings.animationSpeed)
      }
      if (settings.autoSpinDelay !== undefined) {
        this.onGameAction?.('setAutoSpinDelay', settings.autoSpinDelay)
      }
    })
    
    this.initializeUI()
    this.initializeHistoryBoard() // Initialize history board after main UI
    this.setupKeyboardHandlers()

  }

  setOnGameAction(callback: (action: string, data?: any) => void): void {
    this.onGameAction = callback
  }

  private initializeUI(): void {
    this.container.innerHTML = this.createMainUIHTML()
    this.setupEventListeners()
    this.updateDisplay()
    this.updateButtonStates() // Ensure button states are set correctly initially
  }

  private initializeHistoryBoard(): void {
    // Create history board container after main UI is set up
    const historyContainer = document.createElement('div')
    historyContainer.id = 'history-container'
    historyContainer.style.position = 'absolute'
    historyContainer.style.pointerEvents = 'auto'
    // Remove hardcoded positioning to allow CSS media queries to work
    // historyContainer.style.top = '0'
    // historyContainer.style.left = '0'
    historyContainer.style.width = '100%'
    historyContainer.style.height = '100%'
    historyContainer.style.zIndex = '30' // Lower than right panel to avoid conflicts
    historyContainer.style.isolation = 'isolate' // Prevent event bubbling
    this.container.appendChild(historyContainer)
    this.historyBoard = new HistoryBoard(historyContainer, this.audioManager)
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals()
        if (this.state.showCustomBetInput) {
          this.hideCustomBetInput()
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        // Spacebar hotkey for spin button
        e.preventDefault() // Prevent page scroll
        
        // Don't trigger if modals are open or input fields are focused
        const activeElement = document.activeElement
        if (activeElement?.tagName === 'INPUT' || 
            activeElement?.tagName === 'SELECT' || 
            activeElement?.tagName === 'TEXTAREA' ||
            (this.infoModal as any).isOpen ||
            (this.settingsModal as any).isOpen ||
            (this.autoSpinModal as any).isVisible ||
            this.state.showCustomBetInput) {
          return
        }
        
        // Check if spin is possible
        if (this.state.isSpinning || this.state.isAutoSpinning || this.state.credits < this.state.betAmount) {
          return
        }
        
        // Trigger spin
        this.audioManager.playImmediateSound('UI_CLICK')
        this.onGameAction?.('spin')
      }
    })
  }

  private createMainUIHTML(): string {
    return `
      <div class="slot-ui-overlay">
        <!-- Top Info Bar -->
        <div class="top-info-bar">
          <div class="info-panel">
            <div class="credits-display">
              <div class="counter-label">CREDITS</div>
              <div class="counter-display" id="credits-counter">
                ${this.generateDigitalDisplay(this.state.credits)}
              </div>
            </div>
          </div>
          
          <div class="center-info">
            <div class="win-display" id="win-display" style="display: ${this.state.lastWin > 0 ? 'flex' : 'none'};">
              <span class="win-label">WIN</span>
              <span class="win-amount" id="win-amount">${this.state.lastWin % 1 === 0 ? this.state.lastWin.toLocaleString() : this.state.lastWin.toFixed(2)}</span>
            </div>
          </div>

          <div class="info-panel">
            <button class="menu-btn" id="settings-btn">
              <div class="settings-icon">
                <div class="gear">
                  <div class="gear-inner"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Side Panels -->
        <div class="left-panel">
          <div class="bet-panel ${this.state.showCustomBetInput ? 'custom-input-open' : ''}" id="bet-panel">
            <!-- Animated Beer Sprite Behind bet board -->
            <div class="beer-sprite"></div>
            
            <!-- Table Hat Image -->
            <div class="table-hat">
              <img 
                src="./assets/images/beersprite/table.png" 
                alt="Tavern Table" 
                class="table-image"
              />
            </div>
            <div class="bet-frame ${(this.state.isSpinning || this.state.isAutoSpinning) ? 'disabled' : ''}" id="bet-frame">
              <div class="bet-label">BET</div>
              
              <!-- Current Bet Display -->
              <div class="current-bet-display">
                <span class="current-bet-label">Current:</span>
                <span class="current-bet-amount" id="current-bet-amount">${this.state.betAmount % 1 === 0 ? this.state.betAmount.toLocaleString() : this.state.betAmount.toFixed(2)}</span>
              </div>
              
              <!-- Custom Bet Input (conditionally rendered) -->
              <div class="custom-bet-input" id="custom-bet-input" style="display: ${this.state.showCustomBetInput ? 'block' : 'none'};">
                <div class="input-label">Enter Custom Bet (use . or , for decimals)</div>
                <input
                  type="text"
                  id="custom-bet-input-field"
                  value="${this.state.customBetInput}"
                  placeholder="Enter amount (e.g., 25.50)"
                  class="bet-input"
                  maxlength="7"
                  autocomplete="off"
                />
                <div class="input-range">
                  <span>Range: 0.01 - ${Math.min(this.state.credits, 9999.99).toFixed(2)}</span>
                </div>
                <div class="input-buttons">
                  <button class="input-btn confirm" id="confirm-custom-bet">
                    <span class="btn-icon">⚔️</span>
                    <span>WAGER</span>
                  </button>
                  <button class="input-btn cancel" id="cancel-custom-bet">
                    <span class="btn-icon">🛡️</span>
                    <span>CANCEL</span>
                  </button>
                </div>
              </div>
              
              <!-- Existing Bet Buttons -->
              <div class="bet-controls" id="bet-controls" style="display: ${this.state.showCustomBetInput ? 'none' : 'grid'};">
                ${this.betAmounts.map(amount => `
                  <button
                    class="bet-btn ${this.state.betAmount === amount ? 'active' : ''}"
                    data-bet="${amount}"
                  >
                    ${amount}
                  </button>
                `).join('')}
              </div>
              
              <!-- Custom Bet Button -->
              <button 
                class="control-btn custom-bet-btn" 
                id="show-custom-bet"
                style="display: ${this.state.showCustomBetInput ? 'none' : 'flex'};"
              >
                <div class="btn-content">
                  <span class="btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </span>
                  <span class="btn-text">CUSTOM</span>
                </div>
              </button>

              <!-- MAX BET Button (only when not showing custom input) -->
              <button 
                class="control-btn max-bet-btn" 
                id="max-bet-btn"
                style="display: ${this.state.showCustomBetInput ? 'none' : 'flex'};"
              >
                <div class="btn-content">
                  <span class="btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="8" cy="8" r="1"/>
                      <circle cx="16" cy="16" r="1"/>
                      <circle cx="16" cy="8" r="1"/>
                      <circle cx="8" cy="16" r="1"/>
                    </svg>
                  </span>
                  <span class="btn-text">MAX BET</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <button class="side-btn info-btn" id="info-btn">
            <div class="info-icon">
              <svg viewBox="0 0 512 512" class="info-svg">
                <circle class="info-outer-circle" cx="256" cy="256"/>
                <circle class="info-letter-i-top" cx="256" cy="200" r="0"/>
                <line class="info-letter-i-bottom" x1="256" y1="340" x2="256" y2="240" stroke-width="48" stroke-linecap="round"/>
              </svg>
            </div>
          </button>
        </div>

        <!-- Side Action Buttons -->
        <div class="left-action-btn">
          <button 
            class="auto-spin-btn ${this.state.isAutoSpinning ? 'active' : ''} ${this.state.stopAutoSpinAfterRound ? 'stopping' : ''}" 
            id="auto-spin-btn"
          >
            <div class="auto-btn-inner">
              <div class="auto-icon">
                <div class="automation-icon">
                  <div class="gear-outer">
                    <div class="gear-tooth"></div>
                    <div class="gear-tooth"></div>
                    <div class="gear-tooth"></div>
                    <div class="gear-tooth"></div>
                    <div class="gear-tooth"></div>
                    <div class="gear-tooth"></div>
                  </div>
                  <div class="gear-inner">
                    <div class="center-dot"></div>
                  </div>
                  <div class="automation-indicator">
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring"></div>
                  </div>
                </div>
              </div>
              <span class="auto-text" id="auto-text">${this.getAutoSpinButtonText()}</span>
              ${this.state.isAutoSpinning && !this.state.isInfiniteAutoSpin ? 
                `<span class="auto-count" id="auto-count">${this.state.autoSpinRemaining} left</span>` : 
                ''}
            </div>
          </button>
        </div>

        <div class="right-action-btn">
          <button 
            class="spin-btn ${this.state.isSpinning ? 'spinning' : ''}" 
            id="spin-btn"
            title="Click to spin or press Spacebar"
          >
            <div class="spin-btn-inner">
              <div class="spin-icon">
                <div class="slot-machine-icon">
                  <div class="slot-frame"></div>
                  <div class="slot-reels">
                    <div class="reel"></div>
                    <div class="reel"></div>
                    <div class="reel"></div>
                  </div>
                  <div class="slot-handle"></div>
                </div>
              </div>
              <span class="spin-text" id="spin-text">
                ${this.state.isSpinning ? 'SPINNING...' : 'SPIN'}
              </span>
              <span class="spin-cost" id="spin-cost">(${this.state.betAmount % 1 === 0 ? this.state.betAmount : this.state.betAmount.toFixed(2)} Credits)</span>
            </div>
          </button>
        </div>

        <!-- Simple Turbo Switch -->
        <div class="turbo-contraption-switch ${this.state.isInstantMode ? 'unlocked' : ''}" id="turbo-contraption-switch">
        </div>

        <!-- Status Messages -->
        <div class="status-message insufficient-funds" id="insufficient-funds" style="display: ${this.state.credits < this.state.betAmount && !this.state.isSpinning && !this.state.isAutoSpinning ? 'block' : 'none'};">
          <span>⚠️ Insufficient Credits!</span>
        </div>
      </div>
    `
  }

  private setupEventListeners(): void {
    // Bet amount buttons
    const betButtons = document.querySelectorAll('.bet-btn')
    betButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this.state.isSpinning || this.state.isAutoSpinning) return
        const amount = parseInt((button as HTMLElement).dataset.bet || '0')
        
        // Immediately update UI state for instant feedback
        this.updateState({ betAmount: amount })
        
        this.audioManager.playImmediateSound('UI_CLICK')
        this.onGameAction?.('setBet', amount)
      })
    })

    // Max bet button
    const maxBetBtn = document.getElementById('max-bet-btn')
    maxBetBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning) return
      
      // Calculate max bet using GameConfig
      const maxBet = Math.min(this.state.credits, GameConfig.MAX_BET)
      
      // Immediately update UI state for instant feedback
      this.updateState({ betAmount: maxBet })
      
      this.audioManager.playImmediateSound('UI_CLICK')
      this.onGameAction?.('maxBet')
    })

    // Custom bet button
    const showCustomBetBtn = document.getElementById('show-custom-bet')
    showCustomBetBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning) return
      this.audioManager.playImmediateSound('UI_CLICK')
      this.showCustomBetInput()
    })

    // Custom bet input handlers
    const confirmCustomBetBtn = document.getElementById('confirm-custom-bet')
    confirmCustomBetBtn?.addEventListener('click', () => {
      this.handleCustomBetSubmit()
    })

    const cancelCustomBetBtn = document.getElementById('cancel-custom-bet')
    cancelCustomBetBtn?.addEventListener('click', () => {
      this.audioManager.playImmediateSound('UI_CLICK')
      this.hideCustomBetInput()
    })

    const customBetInputField = document.getElementById('custom-bet-input-field') as HTMLInputElement
    customBetInputField?.addEventListener('input', (e) => {
      this.state.customBetInput = (e.target as HTMLInputElement).value
    })

    customBetInputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleCustomBetSubmit()
      } else if (e.key === 'Escape') {
        this.audioManager.playImmediateSound('UI_CLICK')
        this.hideCustomBetInput()
      }
    })

    // Spin button
    const spinBtn = document.getElementById('spin-btn')
    spinBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning || this.state.credits < this.state.betAmount) return
      this.audioManager.playImmediateSound('UI_CLICK')
      this.onGameAction?.('spin')
    })

    // Auto spin button
    const autoSpinBtn = document.getElementById('auto-spin-btn')
    autoSpinBtn?.addEventListener('click', () => {
      // Don't allow clicks when stopping is already requested
      if (this.state.stopAutoSpinAfterRound) {
        return
      }
      
      if (!this.state.isAutoSpinning && (this.state.isSpinning || this.state.credits < this.state.betAmount)) return
      
      this.audioManager.playImmediateSound('UI_CLICK')
      
      // If auto-spinning, request stop
      if (this.state.isAutoSpinning) {
        this.updateState({
          ...this.state,
          stopAutoSpinAfterRound: true
        })
        // Send stop request to state machine
        this.onGameAction?.('requestAutoSpinStop')
        return
      } else {
        // Show auto spin selection modal
        this.showAutoSpinModal()
      }
    })

    // Info button
    const infoBtn = document.getElementById('info-btn')
    infoBtn?.addEventListener('click', () => {
      this.audioManager.playImmediateSound('UI_CLICK')
      this.showInfoModal()
    })

    // Settings button
    const settingsBtn = document.getElementById('settings-btn')
    settingsBtn?.addEventListener('click', () => {
      this.audioManager.playImmediateSound('UI_CLICK')
      this.showSettingsModal()
    })

    // Turbo contraption switch
    const turboSwitch = document.getElementById('turbo-contraption-switch')
    turboSwitch?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Prevent turbo toggle during spin or padlock animation
      if (this.state.isSpinning || this.state.isAutoSpinning || this.state.isPadlockAnimating) {
        return
      }
      
      this.audioManager.playImmediateSound('UI_CLICK')
      this.animateContraptionSwitch()
      
      // Provide immediate visual and state feedback
      const currentState = this.state.isInstantMode
      const newState = !currentState
      
      // Update internal state immediately
      this.state.isInstantMode = newState
      
      // Update visual state immediately
      if (newState) {
        turboSwitch.classList.add('unlocked')
      } else {
        turboSwitch.classList.remove('unlocked')
      }
      
      // Trigger immediate padlock animation
      this.onGameAction?.('updatePadlockImmediate', newState)
      
      // Send the toggle action and let the game state machine handle the update
      this.onGameAction?.('toggleTurbo')
    })
  }

  private showCustomBetInput(): void {
    this.state.showCustomBetInput = true
    this.state.customBetInput = ''
    this.refreshUI()
    
    // Focus the input field
    setTimeout(() => {
      const inputField = document.getElementById('custom-bet-input-field') as HTMLInputElement
      inputField?.focus()
    }, 50)
  }

  private hideCustomBetInput(): void {
    this.state.showCustomBetInput = false
    this.state.customBetInput = ''
    this.refreshUI()
  }

  private handleCustomBetSubmit(): void {
    const input = this.state.customBetInput.replace(',', '.')
    const amount = parseFloat(input)
    
    if (isNaN(amount) || amount < 0.01 || amount > this.state.credits || amount > GameConfig.MAX_BET) {
      // Invalid input - could add visual feedback here
      return
    }
    
    // Immediately update UI state for instant feedback
    this.updateState({ betAmount: amount })
    
    this.audioManager.playImmediateSound('UI_CLICK')
    this.onGameAction?.('setBet', amount)
    this.hideCustomBetInput()
  }

  private refreshUI(): void {
    this.container.innerHTML = this.createMainUIHTML()
    this.initializeHistoryBoard() // Re-initialize history board after refresh
    this.setupEventListeners()
    this.updateDisplay()
    this.updateButtonStates() // Ensure button states are set correctly after refresh
  }

  private showInfoModal(): void {
    this.infoModal.show()
  }

  private showSettingsModal(): void {
    this.settingsModal.show()
  }

  private showAutoSpinModal(): void {
    this.audioManager.playImmediateSound('UI_CLICK')
    this.autoSpinModal.show((count, isInfinite) => {
      // Handle auto spin selection
      this.onGameAction?.('startAutoSpin', { count, isInfinite })
    })
  }

  private getAutoSpinButtonText(): string {
    if (this.state.isAutoSpinning) {
      if (this.state.stopAutoSpinAfterRound) {
        return 'STOPPING...'
      }
      if (this.state.isInfiniteAutoSpin) {
        return 'AUTO (∞)'
      }
      return `AUTO (${this.state.autoSpinRemaining})`
    }
    return 'AUTO'
  }

  private closeAllModals(): void {
    this.infoModal.hide()
    this.settingsModal.hide()
    this.autoSpinModal.hide()
  }

  // Public methods for state updates
  updateState(newState: Partial<UIState>): void {
    Object.assign(this.state, newState)
    this.updateDisplay()
  }

  setPadlockAnimating(isAnimating: boolean): void {
    this.state.isPadlockAnimating = isAnimating
    // No need to call updateDisplay() since this only affects click handling
  }

  // For compatibility with PixelTavernGame
  updateStateFromContext(context: any): void {
    // Check if we have a new win to add to history
    if (context.lastWin > 0 && context.lastWin !== this.state.lastWin) {
      this.historyBoard.addWin(context.lastWin, context.betAmount, context.winningCharacter)
    }
    
    this.updateState({
      credits: context.credits,
      betAmount: context.betAmount,
      lastWin: context.lastWin,
      isSpinning: context.isSpinning,
      isAutoSpinning: context.isAutoSpinning,
      stopAutoSpinAfterRound: context.stopAutoSpinAfterRound || false,
      autoSpinCount: context.autoSpinCount || 0,
      autoSpinRemaining: context.autoSpinRemaining || 0,
      isInfiniteAutoSpin: context.isInfiniteAutoSpin || false,
      spinsCompleted: context.spinsCompleted || 0,
      isInstantMode: context.isInstantMode || false
    })
  }

  getStopFlag(): boolean {
    return this.state.stopAutoSpinAfterRound
  }

  clearStopFlag(): void {
    this.updateState({
      ...this.state,
      stopAutoSpinAfterRound: false
    })
  }

  handleResize(width: number, _height: number): void {
    // With unified container approach, we don't need to apply CSS scaling
    // The entire viewport container (including UI) scales together
    
    // Check if mobile device for mobile-specific classes
    const isMobile = DeviceUtils.isMobile();
    
    // Set mobile-specific CSS class
    if (isMobile) {
      this.container.classList.add('mobile-ui');
      
      // For very small screens, also adjust positioning
      if (width < 568) {
        this.container.style.setProperty('--mobile-compact', '1');
      } else {
        this.container.style.setProperty('--mobile-compact', '0');
      }
    } else {
      this.container.classList.remove('mobile-ui');
      this.container.style.setProperty('--mobile-compact', '0');
    }
  }

  showWinModal(_amount: number, _character: string, _multiplier: number): void {
    // Placeholder for win modal implementation
  }

  destroy(): void {
    // Clean up event listeners and modals
    this.infoModal.destroy()
    this.settingsModal.destroy()
    this.historyBoard.destroy()
  }

  private updateDisplay(): void {
    // Update credits display
    const creditsCounter = document.getElementById('credits-counter')
    if (creditsCounter) {
      creditsCounter.innerHTML = this.generateDigitalDisplay(this.state.credits)
      creditsCounter.classList.add('animating')
      setTimeout(() => creditsCounter.classList.remove('animating'), 2000)
    }

    // Update current bet display
    const currentBetDisplay = document.getElementById('current-bet-amount')
    if (currentBetDisplay) {
      currentBetDisplay.textContent = this.state.betAmount % 1 === 0 
        ? this.state.betAmount.toLocaleString() 
        : this.state.betAmount.toFixed(2)
    }

    // Update win display
    const winDisplay = document.getElementById('win-display')
    const winAmount = document.getElementById('win-amount')
    if (winDisplay && winAmount) {
      if (this.state.lastWin > 0) {
        // Show total payout (bet amount + win amount) instead of just win amount
        const totalPayout = this.state.lastWin + this.state.betAmount
        winAmount.textContent = totalPayout % 1 === 0 
          ? totalPayout.toLocaleString() 
          : totalPayout.toFixed(2)
        
        // Use class-based animation to prevent positioning jumps
        winDisplay.style.display = 'flex'
        winDisplay.classList.add('show')
      } else {
        winDisplay.classList.remove('show')
        setTimeout(() => {
          if (!winDisplay.classList.contains('show')) {
            winDisplay.style.display = 'none'
          }
        }, 800) // Wait for animation to complete
      }
    }

    // Update bet buttons active state
    const betButtons = document.querySelectorAll('.bet-btn')
    betButtons.forEach(button => {
      const amount = parseInt((button as HTMLElement).dataset.bet || '0')
      if (amount === this.state.betAmount) {
        button.classList.add('active')
      } else {
        button.classList.remove('active')
      }
    })

    // Update auto spin button text
    const autoText = document.getElementById('auto-text')
    if (autoText) {
      if (this.state.stopAutoSpinAfterRound) {
        autoText.textContent = 'STOPPING...'
      } else {
        autoText.textContent = this.state.isAutoSpinning ? 'STOP' : 'AUTO'
      }
    }

    // Update spin button text and cost
    const spinText = document.getElementById('spin-text')
    const spinCost = document.getElementById('spin-cost')
    if (spinText) {
      spinText.textContent = this.state.isSpinning ? 'SPINNING...' : 'SPIN'
    }
    if (spinCost) {
      spinCost.textContent = `(${this.state.betAmount % 1 === 0 ? this.state.betAmount : this.state.betAmount.toFixed(2)} Credits)`
    }

    // Update insufficient funds message
    const insufficientFunds = document.getElementById('insufficient-funds')
    if (insufficientFunds) {
      const shouldShow = this.state.credits < this.state.betAmount && !this.state.isSpinning && !this.state.isAutoSpinning
      insufficientFunds.style.display = shouldShow ? 'block' : 'none'
    }

    // Update auto spin counter display
    if (this.state.isAutoSpinning) {
      const completed = this.state.isInfiniteAutoSpin 
        ? this.state.spinsCompleted 
        : this.state.autoSpinCount - this.state.autoSpinRemaining
      this.autoSpinModal.updateSpinCounter(
        completed, 
        this.state.autoSpinCount, 
        this.state.isInfiniteAutoSpin
      )
    } else {
      this.autoSpinModal.hideSpinCounter()
    }

    // Update turbo lever state
    const leverArm = document.getElementById('lever-arm')
    const turboLabel = document.querySelector('.turbo-label')
    const statusIndicator = document.querySelector('.status-indicator')
    
    if (leverArm) {
      if (this.state.isInstantMode) {
        leverArm.classList.add('active')
      } else {
        leverArm.classList.remove('active')
      }
    }
    
    if (turboLabel) {
      if (this.state.isInstantMode) {
        turboLabel.classList.add('active')
      } else {
        turboLabel.classList.remove('active')
      }
    }
    
    if (statusIndicator) {
      statusIndicator.textContent = this.state.isInstantMode ? 'ON' : 'OFF'
      if (this.state.isInstantMode) {
        statusIndicator.classList.add('on')
        statusIndicator.classList.remove('off')
      } else {
        statusIndicator.classList.add('off')
        statusIndicator.classList.remove('on')
      }
    }

    // Update turbo switch visual state
    const turboSwitch = document.getElementById('turbo-contraption-switch')
    if (turboSwitch) {
      if (this.state.isInstantMode) {
        turboSwitch.classList.add('unlocked')
      } else {
        turboSwitch.classList.remove('unlocked')
      }
    }

    // Update button states based on spinning/auto-spinning
    this.updateButtonStates()
  }

  private updateButtonStates(): void {
    const isDisabled = this.state.isSpinning || this.state.isAutoSpinning
    const isInsufficientCredits = this.state.credits < this.state.betAmount

    // Bet buttons
    const betButtons = document.querySelectorAll('.bet-btn')
    betButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = isDisabled
    })

    // Control buttons
    const controlButtons = document.querySelectorAll('.control-btn')
    controlButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = isDisabled
    })

    // Spin button
    const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement
    if (spinBtn) {
      spinBtn.disabled = isDisabled || isInsufficientCredits
      if (this.state.isSpinning) {
        spinBtn.classList.add('spinning')
      } else {
        spinBtn.classList.remove('spinning')
      }
    }

    // Auto spin button
    const autoSpinBtn = document.getElementById('auto-spin-btn') as HTMLButtonElement
    if (autoSpinBtn) {
      // Disable button when stopping is requested or when conditions don't allow auto-spin
      autoSpinBtn.disabled = this.state.stopAutoSpinAfterRound || (!this.state.isAutoSpinning && (this.state.isSpinning || isInsufficientCredits))
      
      // Update classes
      if (this.state.stopAutoSpinAfterRound) {
        autoSpinBtn.classList.add('stopping')
        autoSpinBtn.classList.remove('active')
      } else if (this.state.isAutoSpinning) {
        autoSpinBtn.classList.add('active')
        autoSpinBtn.classList.remove('stopping')
      } else {
        autoSpinBtn.classList.remove('active', 'stopping')
      }
    }

    // Bet frame disabled state
    const betFrame = document.getElementById('bet-frame')
    if (betFrame) {
      if (isDisabled) {
        betFrame.classList.add('disabled')
      } else {
        betFrame.classList.remove('disabled')
      }
    }
  }

  private generateDigitalDisplay(value: number): string {
    const valueStr = value.toLocaleString().replace(/,/g, '')
    const digits = valueStr.padStart(6, '0').split('')
    
    return digits.map(digit => this.generateDigit(digit)).join('')
  }

  private generateDigit(digit: string): string {
    const digitPatterns: { [key: string]: boolean[][] } = {
      '0': [
        [true, true, true],
        [true, false, true],
        [true, false, true],
        [true, false, true],
        [true, true, true]
      ],
      '1': [
        [false, false, true],
        [false, false, true],
        [false, false, true],
        [false, false, true],
        [false, false, true]
      ],
      '2': [
        [true, true, true],
        [false, false, true],
        [true, true, true],
        [true, false, false],
        [true, true, true]
      ],
      '3': [
        [true, true, true],
        [false, false, true],
        [true, true, true],
        [false, false, true],
        [true, true, true]
      ],
      '4': [
        [true, false, true],
        [true, false, true],
        [true, true, true],
        [false, false, true],
        [false, false, true]
      ],
      '5': [
        [true, true, true],
        [true, false, false],
        [true, true, true],
        [false, false, true],
        [true, true, true]
      ],
      '6': [
        [true, true, true],
        [true, false, false],
        [true, true, true],
        [true, false, true],
        [true, true, true]
      ],
      '7': [
        [true, true, true],
        [false, false, true],
        [false, false, true],
        [false, false, true],
        [false, false, true]
      ],
      '8': [
        [true, true, true],
        [true, false, true],
        [true, true, true],
        [true, false, true],
        [true, true, true]
      ],
      '9': [
        [true, true, true],
        [true, false, true],
        [true, true, true],
        [false, false, true],
        [true, true, true]
      ]
    }

    const pattern = digitPatterns[digit] || digitPatterns['0']
    
    return `
      <div class="digit">
        ${pattern.map(row => `
          <div class="digit-row">
            ${row.map(box => `<div class="box ${box ? 'on' : 'off'}"></div>`).join('')}
          </div>
        `).join('')}
      </div>
    `
  }

  private animateContraptionSwitch(): void {
    const switchElement = document.getElementById('turbo-contraption-switch')
    
    if (!switchElement) return

    // Add activation animation
    switchElement.classList.add('activating')
    
    // Remove animation class after it's complete
    setTimeout(() => {
      switchElement.classList.remove('activating')
    }, 300)
  }

}
