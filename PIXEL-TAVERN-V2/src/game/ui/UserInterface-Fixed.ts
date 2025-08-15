import { AudioManager } from '../audio/AudioManager'

interface UIState {
  credits: number
  betAmount: number
  lastWin: number
  isSpinning: boolean
  isAutoSpinning: boolean
  showCustomBetInput: boolean
  customBetInput: string
}

export class UserInterface {
  private container: HTMLElement
  private audioManager: AudioManager
  private state: UIState
  private betAmounts = [5, 10, 25, 50, 100]
  private onGameAction?: (action: string, data?: any) => void

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
    this.state = {
      credits: 1000,
      betAmount: 10,
      lastWin: 0,
      isSpinning: false,
      isAutoSpinning: false,
      showCustomBetInput: false,
      customBetInput: ''
    }
    
    console.log('🎨 UserInterface initialized')
    this.initializeUI()
    this.setupKeyboardHandlers()
    console.log('🎨 UserInterface initialization complete')
  }

  setOnGameAction(callback: (action: string, data?: any) => void): void {
    this.onGameAction = callback
  }

  private initializeUI(): void {
    console.log('🎨 Creating UI HTML...')
    this.container.innerHTML = this.createMainUIHTML()
    console.log('🎨 HTML created, setting up event listeners...')
    this.setupEventListeners()
    console.log('🎨 Event listeners setup, updating display...')
    this.updateDisplay()
    console.log('🎨 UserInterface fully initialized')
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals()
        if (this.state.showCustomBetInput) {
          this.hideCustomBetInput()
        }
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
                    ${(this.state.isSpinning || this.state.isAutoSpinning) ? 'disabled' : ''}
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
                ${(this.state.isSpinning || this.state.isAutoSpinning) ? 'disabled' : ''}
              >
                <div class="btn-content">
                  <span class="btn-icon">📜</span>
                  <span class="btn-text">CUSTOM</span>
                </div>
              </button>

              <!-- MAX BET Button (only when not showing custom input) -->
              <button 
                class="control-btn max-bet-btn" 
                id="max-bet-btn"
                style="display: ${this.state.showCustomBetInput ? 'none' : 'flex'};"
                ${(this.state.isSpinning || this.state.isAutoSpinning) ? 'disabled' : ''}
              >
                <div class="btn-content">
                  <span class="btn-icon">💰</span>
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
            class="auto-spin-btn ${this.state.isAutoSpinning ? 'active' : ''}" 
            id="auto-spin-btn"
            ${(!this.state.isAutoSpinning && (this.state.isSpinning || this.state.credits < this.state.betAmount)) ? 'disabled' : ''}
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
              <span class="auto-text" id="auto-text">${this.state.isAutoSpinning ? 'STOP' : 'AUTO'}</span>
            </div>
          </button>
        </div>

        <div class="right-action-btn">
          <button 
            class="spin-btn ${this.state.isSpinning ? 'spinning' : ''}" 
            id="spin-btn"
            ${(this.state.isSpinning || this.state.isAutoSpinning || this.state.credits < this.state.betAmount) ? 'disabled' : ''}
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

        <!-- Status Messages -->
        <div class="status-message insufficient-funds" id="insufficient-funds" style="display: ${this.state.credits < this.state.betAmount && !this.state.isSpinning && !this.state.isAutoSpinning ? 'block' : 'none'};">
          <span>⚠️ Insufficient Credits!</span>
        </div>

        <!-- Info Modal (placeholder - will be handled separately) -->
        <div id="info-modal" class="modal-overlay" style="display: none;">
          <!-- Info modal content will be inserted here -->
        </div>

        <!-- Settings Modal (placeholder - will be handled separately) -->
        <div id="settings-modal" class="modal-overlay" style="display: none;">
          <!-- Settings modal content will be inserted here -->
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

    // Custom bet button
    const showCustomBetBtn = document.getElementById('show-custom-bet')
    showCustomBetBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning) return
      this.audioManager.playSoundEffect('ui')
      this.showCustomBetInput()
    })

    // Custom bet input handlers
    const confirmCustomBetBtn = document.getElementById('confirm-custom-bet')
    confirmCustomBetBtn?.addEventListener('click', () => {
      this.handleCustomBetSubmit()
    })

    const cancelCustomBetBtn = document.getElementById('cancel-custom-bet')
    cancelCustomBetBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
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
        this.audioManager.playSoundEffect('ui')
        this.hideCustomBetInput()
      }
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

    // Info button
    const infoBtn = document.getElementById('info-btn')
    infoBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.showInfoModal()
    })

    // Settings button
    const settingsBtn = document.getElementById('settings-btn')
    settingsBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.showSettingsModal()
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
    
    if (isNaN(amount) || amount < 0.01 || amount > this.state.credits || amount > 9999.99) {
      // Invalid input - could add visual feedback here
      return
    }
    
    this.audioManager.playSoundEffect('ui')
    this.onGameAction?.('setBet', amount)
    this.hideCustomBetInput()
  }

  private refreshUI(): void {
    this.container.innerHTML = this.createMainUIHTML()
    this.setupEventListeners()
  }

  private showInfoModal(): void {
    // Placeholder for info modal implementation
    console.log('Info modal requested')
  }

  private showSettingsModal(): void {
    // Placeholder for settings modal implementation
    console.log('Settings modal requested')
  }

  private closeAllModals(): void {
    // Close any open modals
    const modals = document.querySelectorAll('.modal-overlay')
    modals.forEach(modal => {
      (modal as HTMLElement).style.display = 'none'
    })
  }

  // Public methods for state updates
  updateState(newState: Partial<UIState>): void {
    Object.assign(this.state, newState)
    this.updateDisplay()
  }

  private updateDisplay(): void {
    // Update credits display
    const creditsDisplay = document.getElementById('credits-value')
    if (creditsDisplay) {
      creditsDisplay.textContent = this.state.credits.toLocaleString()
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
        winDisplay.style.display = 'flex'
        winAmount.textContent = this.state.lastWin % 1 === 0 
          ? this.state.lastWin.toLocaleString() 
          : this.state.lastWin.toFixed(2)
      } else {
        winDisplay.style.display = 'none'
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
      autoText.textContent = this.state.isAutoSpinning ? 'STOP' : 'AUTO'
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
      autoSpinBtn.disabled = !this.state.isAutoSpinning && (this.state.isSpinning || isInsufficientCredits)
      if (this.state.isAutoSpinning) {
        autoSpinBtn.classList.add('active')
      } else {
        autoSpinBtn.classList.remove('active')
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
}
