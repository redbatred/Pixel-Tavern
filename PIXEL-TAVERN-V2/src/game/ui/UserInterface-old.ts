import { AudioManager } from '../audio/AudioManager'

interface UIState {
  credits: number
  betAmount: number
  lastWin: number
  isSpinning: boolean
  isAutoSpinning: boolean
  isInfoModalOpen: boolean
  isSettingsModalOpen: boolean
  isWinModalOpen: boolean
  showCustomBetInput: boolean
}

class UIManager {
  private container: HTMLElement
  private audioManager: AudioManager
  private onGameAction?: (action: string, payload?: any) => void
  private state: UIState = {
    credits: 1000,
    betAmount: 10,
    lastWin: 0,
    isSpinning: false,
    isAutoSpinning: false,
    isInfoModalOpen: false,
    isSettingsModalOpen: false,
    isWinModalOpen: false,
    showCustomBetInput: false
  }

  // Exact bet amounts from original
  private betAmounts = [5, 10, 25, 50, 100]

  constructor(container: HTMLElement, audioManager: AudioManager) {
    console.log('🎨 UIManager constructor called with:', container, audioManager)
    this.container = container
    this.audioManager = audioManager
    this.initializeUI()
    this.setupKeyboardHandlers()
    console.log('🎨 UIManager initialization complete')
  }

  private initializeUI(): void {
    console.log('🎨 Creating UI HTML...')
    this.container.innerHTML = this.createMainUIHTML()
    console.log('🎨 HTML created, setting up event listeners...')
    this.setupEventListeners()
    console.log('🎨 Event listeners setup, updating display...')
    this.updateDisplay()
    console.log('🎨 UIManager fully initialized')
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals()
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
              <div class="label">CREDITS</div>
              <div class="value" id="credits-value">${this.state.credits.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="center-info">
            <div class="win-display" id="win-display" style="display: none;">
              <span class="win-label">WIN</span>
              <span class="win-amount" id="win-amount">0</span>
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
          <div class="bet-panel" id="bet-panel">
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
            <div class="bet-frame" id="bet-frame">
              <div class="bet-label">BET</div>
              
              <!-- Current Bet Display -->
              <div class="current-bet-display">
                <span class="current-bet-label">Current:</span>
                <span class="current-bet-amount" id="current-bet-amount">${this.state.betAmount}</span>
              </div>
              
              <!-- Bet Controls -->
              <div class="bet-controls" id="bet-controls">
                ${this.betAmounts.map(amount => `
                  <button
                    class="bet-btn ${this.state.betAmount === amount ? 'active' : ''}"
                    data-bet="${amount}"
                  >
                    ${amount}
                  </button>
                `).join('')}
              </div>
              
              <!-- Control Buttons -->
              <div id="control-buttons">
                <!-- Custom Bet Button -->
                <button class="control-btn custom-bet-btn" id="show-custom-bet">
                  <div class="btn-content">
                    <span class="btn-icon">📜</span>
                    <span class="btn-text">CUSTOM</span>
                  </div>
                </button>

                <!-- MAX BET Button -->
                <button class="control-btn max-bet-btn" id="max-bet-btn">
                  <div class="btn-content">
                    <span class="btn-icon">💰</span>
                    <span class="btn-text">MAX BET</span>
                  </div>
                </button>
              </div>
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
          <button class="auto-spin-btn" id="auto-spin-btn">
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
              <span class="auto-text" id="auto-text">AUTO</span>
            </div>
          </button>
        </div>

        <div class="right-action-btn">
          <button class="spin-btn" id="spin-btn">
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
              <span class="spin-text" id="spin-text">SPIN</span>
              <span class="spin-cost" id="spin-cost">(${this.state.betAmount} Credits)</span>
            </div>
          </button>
        </div>

        <!-- Status Messages -->
        <div class="status-message insufficient-funds" id="insufficient-funds" style="display: none;">
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
        this.audioManager.playSoundEffect('ui')
        this.onGameAction?.('setBet', amount)
      })
    })

    // Max bet button
    const maxBetBtn = document.getElementById('max-bet-btn')
    maxBetBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning) return
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('maxBet')
    })

    // Spin button
    const spinBtn = document.getElementById('spin-btn')
    spinBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning || this.state.credits < this.state.betAmount) return
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('spin')
    })

    // Auto spin button
    const autoSpinBtn = document.getElementById('auto-spin-btn')
    autoSpinBtn?.addEventListener('click', () => {
      if (!this.state.isAutoSpinning && (this.state.isSpinning || this.state.credits < this.state.betAmount)) return
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('toggleAutoSpin')
    })

    // Settings button
    const settingsBtn = document.getElementById('settings-btn')
    settingsBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('settings')
    })

    // Info button
    const infoBtn = document.getElementById('info-btn')
    infoBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('paytable')
    })
  }

  private closeAllModals(): void {
    // Close custom bet input if open
    if (this.state.showCustomBetInput) {
      this.state.showCustomBetInput = false
    }
  }

  setOnGameAction(callback: (action: string, payload?: any) => void): void {
    this.onGameAction = callback
  }

  updateStateFromContext(newState: Partial<UIState>): void {
    this.state = { ...this.state, ...newState }
    this.updateDisplay()
  }

  private updateDisplay(): void {
    // Update credits
    const creditsElement = document.getElementById('credits-value')
    if (creditsElement) {
      creditsElement.textContent = this.state.credits.toLocaleString()
    }

    // Update current bet
    const currentBetElement = document.getElementById('current-bet-amount')
    if (currentBetElement) {
      currentBetElement.textContent = this.state.betAmount % 1 === 0 ? 
        this.state.betAmount.toLocaleString() : 
        this.state.betAmount.toFixed(2)
    }

    // Update spin cost
    const spinCostElement = document.getElementById('spin-cost')
    if (spinCostElement) {
      const betText = this.state.betAmount % 1 === 0 ? this.state.betAmount : this.state.betAmount.toFixed(2)
      spinCostElement.textContent = `(${betText} Credits)`
    }

    // Update bet buttons active state
    const betButtons = document.querySelectorAll('.bet-btn')
    betButtons.forEach(button => {
      const amount = parseInt((button as HTMLElement).dataset.bet || '0')
      button.classList.toggle('active', amount === this.state.betAmount)
    })

    // Update button states
    const betFrame = document.getElementById('bet-frame')
    if (betFrame) {
      betFrame.classList.toggle('disabled', this.state.isSpinning || this.state.isAutoSpinning)
    }

    // Update auto spin button
    const autoSpinBtn = document.getElementById('auto-spin-btn')
    const autoText = document.getElementById('auto-text')
    if (autoSpinBtn && autoText) {
      autoSpinBtn.classList.toggle('active', this.state.isAutoSpinning)
      autoText.textContent = this.state.isAutoSpinning ? 'STOP' : 'AUTO'
    }

    // Update spin button
    const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement
    const spinText = document.getElementById('spin-text')
    if (spinBtn && spinText) {
      spinBtn.classList.toggle('spinning', this.state.isSpinning)
      spinText.textContent = this.state.isSpinning ? 'SPINNING...' : 'SPIN'
      spinBtn.disabled = this.state.isSpinning || this.state.isAutoSpinning || this.state.credits < this.state.betAmount
    }

    // Update win display
    const winDisplay = document.getElementById('win-display')
    const winAmount = document.getElementById('win-amount')
    if (winDisplay && winAmount) {
      if (this.state.lastWin > 0) {
        winDisplay.style.display = 'block'
        winAmount.textContent = this.state.lastWin % 1 === 0 ? 
          this.state.lastWin.toLocaleString() : 
          this.state.lastWin.toFixed(2)
      } else {
        winDisplay.style.display = 'none'
      }
    }

    // Update insufficient funds message
    const insufficientFunds = document.getElementById('insufficient-funds')
    if (insufficientFunds) {
      const shouldShow = this.state.credits < this.state.betAmount && !this.state.isSpinning && !this.state.isAutoSpinning
      insufficientFunds.style.display = shouldShow ? 'block' : 'none'
    }
  }

  showWinModal(winAmount: number, _character: string, multiplier: number): void {
    console.log(`Win: ${winAmount}, Character: ${_character}, Multiplier: ${multiplier}`)
  }

  hideWinDisplay(): void {
    const winDisplay = document.getElementById('win-display')
    if (winDisplay) {
      winDisplay.style.display = 'none'
    }
    this.state.lastWin = 0
  }

  // Legacy methods for compatibility
  async init(_gameActor: any): Promise<void> {
    console.log('🎮 UI Manager initialized!')
  }

  updateState(stateValue: string, context: any): void {
    this.updateStateFromContext({
      credits: context.credits,
      betAmount: context.betAmount,
      lastWin: context.lastWin,
      isSpinning: stateValue === 'spinning',
      isAutoSpinning: context.isAutoSpinning
    })
  }

  handleResize(_width: number, _height: number): void {
    // UI is responsive via CSS
  }

  destroy(): void {
    // Cleanup if needed
  }
}

export { UIManager, type UIState }
