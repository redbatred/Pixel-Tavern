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
              
              <!-- Custom Bet Input -->
              <div class="custom-bet-input" id="custom-bet-input" style="display: none;">
                <div class="input-label">Enter Custom Bet (use . or , for decimals)</div>
                <input
                  type="text"
                  id="custom-bet-field"
                  placeholder="Enter amount (e.g., 25.50)"
                  class="bet-input"
                  maxlength="7"
                />
                <div class="input-range">
                  <span>Range: 0.01 - <span id="max-bet-range">${Math.min(this.state.credits, 9999.99).toFixed(2)}</span></span>
                </div>
                <div class="input-buttons">
                  <button class="input-btn confirm" id="custom-bet-confirm">
                    <span class="btn-icon">⚔️</span>
                    <span>WAGER</span>
                  </button>
                  <button class="input-btn cancel" id="custom-bet-cancel">
                    <span class="btn-icon">🛡️</span>
                    <span>CANCEL</span>
                  </button>
                </div>
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

        <!-- Info Modal -->
        <div class="info-modal-overlay" id="info-modal" style="display: none;">
          ${this.createInfoModalHTML()}
        </div>

        <!-- Settings Modal -->
        <div class="settings-modal-backdrop" id="settings-modal" style="display: none;">
          ${this.createSettingsModalHTML()}
        </div>

        <!-- Win Modal -->
        <div class="win-modal-overlay" id="win-modal" style="display: none;">
          ${this.createWinModalHTML()}
        </div>
      </div>
    `
  }

  private createInfoModalHTML(): string {
    return `
      <div class="info-modal">
        <div class="modal-header">
          <h2 class="modal-title">📖 Game Information</h2>
          <button class="close-btn" id="info-modal-close">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="info-section">
            <h3 class="section-title">🎯 Game Rules</h3>
            <div class="rules-grid">
              <div class="rule-item">
                <div class="rule-icon">🎰</div>
                <div class="rule-text">
                  <strong>How to Play:</strong> Set your bet amount and spin the reels to match symbols across paylines.
                </div>
              </div>
              <div class="rule-item">
                <div class="rule-icon">💰</div>
                <div class="rule-text">
                  <strong>Winning:</strong> Match 3 or more identical symbols on a payline to win credits.
                </div>
              </div>
              <div class="rule-item">
                <div class="rule-icon">⚡</div>
                <div class="rule-text">
                  <strong>Auto Spin:</strong> Use auto spin to play multiple rounds automatically.
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">👥 Character Symbols</h3>
            <div class="symbols-grid">
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-0"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">Knight</div>
                  <div class="symbol-multiplier">High Value</div>
                  <div class="symbol-description">Brave and noble warrior</div>
                </div>
              </div>
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-1"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">Wizard</div>
                  <div class="symbol-multiplier">High Value</div>
                  <div class="symbol-description">Master of ancient magic</div>
                </div>
              </div>
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-2"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">Archer</div>
                  <div class="symbol-multiplier">Medium Value</div>
                  <div class="symbol-description">Swift and accurate</div>
                </div>
              </div>
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-3"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">Warrior</div>
                  <div class="symbol-multiplier">Medium Value</div>
                  <div class="symbol-description">Fierce battle veteran</div>
                </div>
              </div>
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-4"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">Barmaid</div>
                  <div class="symbol-multiplier">Low Value</div>
                  <div class="symbol-description">Heart of the tavern</div>
                </div>
              </div>
              <div class="symbol-item">
                <div class="symbol-icon">
                  <div class="character-sprite character-5"></div>
                </div>
                <div class="symbol-info">
                  <div class="symbol-name">King</div>
                  <div class="symbol-multiplier">Highest Value</div>
                  <div class="symbol-description">Royal jackpot symbol</div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">💎 Winning Combinations</h3>
            <div class="paylines-grid">
              <div class="payline-item">
                <div class="combo-visual">
                  <div class="combo-slots">
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                  </div>
                </div>
                <div class="combo-info">
                  <div class="combo-name">Three of a Kind</div>
                  <div class="combo-payout">5x - 25x Bet</div>
                </div>
              </div>
              <div class="payline-item">
                <div class="combo-visual">
                  <div class="combo-slots">
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                  </div>
                </div>
                <div class="combo-info">
                  <div class="combo-name">Four of a Kind</div>
                  <div class="combo-payout">10x - 50x Bet</div>
                </div>
              </div>
              <div class="payline-item">
                <div class="combo-visual">
                  <div class="combo-slots">
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                    <div class="combo-slot active"></div>
                  </div>
                </div>
                <div class="combo-info">
                  <div class="combo-name">Five of a Kind</div>
                  <div class="combo-payout">25x - 100x Bet</div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">💡 Tips & Strategies</h3>
            <div class="tips-list">
              <div class="tip-item">
                <div class="tip-bullet">🎯</div>
                <div class="tip-text">Start with smaller bets to understand the game mechanics.</div>
              </div>
              <div class="tip-item">
                <div class="tip-bullet">💰</div>
                <div class="tip-text">Use the MAX BET button for the highest possible winnings.</div>
              </div>
              <div class="tip-item">
                <div class="tip-bullet">⚡</div>
                <div class="tip-text">Auto Spin is great for consistent gameplay without clicking.</div>
              </div>
              <div class="tip-item">
                <div class="tip-bullet">🎰</div>
                <div class="tip-text">Higher value symbols appear less frequently but pay more.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-text">May fortune smile upon your adventures! 🍀</div>
        </div>
      </div>
    `
  }

  private createSettingsModalHTML(): string {
    return `
      <div class="settings-modal">
        <div class="modal-header">
          <h2 class="modal-title">⚙️ Game Settings</h2>
          <button class="close-btn" id="settings-modal-close">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-content">
          <!-- Audio Controls Section -->
          <div class="settings-section">
            <h3 class="section-title">🔊 Audio Settings</h3>
            
            <!-- Master Volume -->
            <div class="volume-control">
              <label class="volume-label">
                <div class="label-with-toggle">
                  <span class="volume-icon">🔊</span>
                  <span class="volume-text">Master Volume</span>
                  <button class="mute-all-btn" id="mute-all-btn" title="Mute All">🔊</button>
                </div>
                <span class="volume-value" id="master-volume-value">100%</span>
              </label>
              <div class="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value="1"
                  id="master-volume-slider"
                  class="volume-slider master-volume"
                />
                <div class="volume-fill master-fill" id="master-volume-fill" style="width: 100%"></div>
              </div>
            </div>

            <!-- Music Volume -->
            <div class="volume-control">
              <label class="volume-label">
                <div class="label-with-toggle">
                  <span class="volume-icon">🎵</span>
                  <span class="volume-text">Music</span>
                  <button class="toggle-btn enabled" id="music-toggle-btn" title="Disable Music">
                    ON
                  </button>
                </div>
                <span class="volume-value" id="music-volume-value">100%</span>
              </label>
              <div class="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value="1"
                  id="music-volume-slider"
                  class="volume-slider music-volume"
                />
                <div class="volume-fill music-fill" id="music-volume-fill" style="width: 100%"></div>
              </div>
            </div>

            <!-- SFX Volume -->
            <div class="volume-control">
              <label class="volume-label">
                <div class="label-with-toggle">
                  <span class="volume-icon">🔊</span>
                  <span class="volume-text">Sound Effects</span>
                  <button class="toggle-btn enabled" id="sfx-toggle-btn" title="Disable SFX">
                    ON
                  </button>
                </div>
                <span class="volume-value" id="sfx-volume-value">100%</span>
              </label>
              <div class="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value="1"
                  id="sfx-volume-slider"
                  class="volume-slider sfx-volume"
                />
                <div class="volume-fill sfx-fill" id="sfx-volume-fill" style="width: 100%"></div>
              </div>
            </div>

            <!-- Music Status -->
            <div class="music-status">
              <div class="status-indicator">
                <span class="status-icon" id="music-status-icon">🎶</span>
                <span class="status-text" id="music-status-text">Tavern Music Playing</span>
              </div>
            </div>
          </div>

          <!-- Game Settings Section -->
          <div class="settings-section">
            <h3 class="section-title">🎮 Game Settings</h3>
            
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-icon">⏱️</span>
                <span class="setting-text">Auto Spin Delay</span>
              </label>
              <select id="auto-spin-delay-select" class="setting-select">
                <option value="1000">Fast (1s)</option>
                <option value="2000" selected>Normal (2s)</option>
                <option value="3000">Slow (3s)</option>
              </select>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-icon">🎭</span>
                <span class="setting-text">Animation Speed</span>
              </label>
              <select id="animation-speed-select" class="setting-select">
                <option value="fast">Fast</option>
                <option value="normal" selected>Normal</option>
                <option value="slow">Slow</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="save-btn" id="save-settings-btn">
            <span class="btn-icon">💾</span>
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    `
  }

  private createWinModalHTML(): string {
    return `
      <div class="win-modal">
        <div class="win-modal-header">
          <h2 id="win-modal-title">🏆 BIG WIN!</h2>
          <button class="close-btn" id="win-modal-close">×</button>
        </div>
        
        <div class="win-modal-content">
          <div class="win-amount-display">
            <div class="win-label">You won</div>
            <div class="win-amount-big" id="win-modal-amount">1000</div>
            <div class="win-label">credits!</div>
          </div>
          
          <div class="win-character" id="win-modal-character">
            <!-- Character sprite will be inserted here -->
          </div>
          
          <div class="win-celebration">
            <div class="celebration-text" id="win-modal-celebration">
              Congratulations, brave adventurer!
            </div>
          </div>
        </div>
        
        <div class="win-modal-footer">
          <button class="continue-btn" id="win-modal-continue">
            ⚔️ Continue Adventure
          </button>
        </div>
      </div>
    `
  }

  private setupEventListeners(): void {
    this.setupBetControlListeners()
    this.setupActionButtonListeners()
    this.setupModalListeners()
    this.setupCustomBetListeners()
    this.setupAudioControlListeners()
  }

  private setupBetControlListeners(): void {
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
  }

  private setupActionButtonListeners(): void {
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
  }

  private setupModalListeners(): void {
    // Info modal
    const infoBtn = document.getElementById('info-btn')
    const infoModal = document.getElementById('info-modal')
    const infoModalClose = document.getElementById('info-modal-close')

    infoBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.state.isInfoModalOpen = true
      if (infoModal) infoModal.style.display = 'flex'
      this.onGameAction?.('paytable')
    })

    const closeInfoModal = () => {
      this.audioManager.playSoundEffect('ui')
      this.state.isInfoModalOpen = false
      if (infoModal) infoModal.style.display = 'none'
    }

    infoModalClose?.addEventListener('click', closeInfoModal)

    infoModal?.addEventListener('click', (e) => {
      if (e.target === infoModal) {
        closeInfoModal()
      }
    })

    // Settings modal
    const settingsBtn = document.getElementById('settings-btn')
    const settingsModal = document.getElementById('settings-modal')
    const settingsModalClose = document.getElementById('settings-modal-close')
    const saveSettingsBtn = document.getElementById('save-settings-btn')

    settingsBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      this.state.isSettingsModalOpen = true
      if (settingsModal) settingsModal.style.display = 'flex'
      this.onGameAction?.('settings')
    })

    const closeSettingsModal = () => {
      this.audioManager.playSoundEffect('ui')
      this.state.isSettingsModalOpen = false
      if (settingsModal) settingsModal.style.display = 'none'
    }

    settingsModalClose?.addEventListener('click', closeSettingsModal)
    saveSettingsBtn?.addEventListener('click', closeSettingsModal)

    settingsModal?.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal()
      }
    })

    // Win modal
    const winModal = document.getElementById('win-modal')
    const winModalClose = document.getElementById('win-modal-close')
    const winModalContinue = document.getElementById('win-modal-continue')

    const closeWinModal = () => {
      this.audioManager.playSoundEffect('ui')
      this.state.isWinModalOpen = false
      if (winModal) winModal.style.display = 'none'
      this.onGameAction?.('continueAfterWin')
    }

    winModalClose?.addEventListener('click', closeWinModal)
    winModalContinue?.addEventListener('click', closeWinModal)
  }

  private setupCustomBetListeners(): void {
    const showCustomBetBtn = document.getElementById('show-custom-bet')
    const customBetInput = document.getElementById('custom-bet-input')
    const customBetField = document.getElementById('custom-bet-field') as HTMLInputElement
    const customBetConfirm = document.getElementById('custom-bet-confirm')
    const customBetCancel = document.getElementById('custom-bet-cancel')
    const betControls = document.getElementById('bet-controls')
    const controlButtons = document.getElementById('control-buttons')
    const betPanel = document.getElementById('bet-panel')

    showCustomBetBtn?.addEventListener('click', () => {
      if (this.state.isSpinning || this.state.isAutoSpinning) return
      this.audioManager.playSoundEffect('ui')
      this.state.showCustomBetInput = true
      if (customBetInput && betControls && controlButtons && betPanel) {
        customBetInput.style.display = 'flex'
        betControls.style.display = 'none'
        controlButtons.style.display = 'none'
        betPanel.classList.add('custom-input-open')
        customBetField.focus()
      }
    })

    const hideCustomBetInput = () => {
      this.state.showCustomBetInput = false
      if (customBetInput && betControls && controlButtons && betPanel) {
        customBetInput.style.display = 'none'
        betControls.style.display = 'flex'
        controlButtons.style.display = 'block'
        betPanel.classList.remove('custom-input-open')
        customBetField.value = ''
      }
    }

    customBetCancel?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      hideCustomBetInput()
    })

    customBetConfirm?.addEventListener('click', () => {
      const amount = parseFloat(customBetField.value.replace(',', '.'))
      if (!isNaN(amount) && amount >= 0.01 && amount <= this.state.credits && amount <= 9999.99) {
        this.audioManager.playSoundEffect('ui')
        const roundedAmount = Math.round(amount * 100) / 100
        this.onGameAction?.('setBet', roundedAmount)
        hideCustomBetInput()
      }
    })

    customBetField?.addEventListener('input', (e) => {
      let value = (e.target as HTMLInputElement).value
      value = value.replace(/,/g, '.')
      value = value.replace(/[^0-9.]/g, '')
      
      const parts = value.split('.')
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('')
      }
      
      if (value.length <= 7) {
        customBetField.value = value
      }
    })

    customBetField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        customBetConfirm?.click()
      } else if (e.key === 'Escape') {
        customBetCancel?.click()
      }
    })
  }

  private setupAudioControlListeners(): void {
    // Master volume
    const masterVolumeSlider = document.getElementById('master-volume-slider') as HTMLInputElement
    const masterVolumeValue = document.getElementById('master-volume-value')
    const masterVolumeFill = document.getElementById('master-volume-fill')

    masterVolumeSlider?.addEventListener('input', () => {
      const value = parseFloat(masterVolumeSlider.value)
      console.log('🎯 Master volume slider changed to:', value)
      this.audioManager.setMasterVolume(value)
      if (masterVolumeValue) masterVolumeValue.textContent = `${Math.round(value * 100)}%`
      if (masterVolumeFill) masterVolumeFill.style.width = `${value * 100}%`
    })

    // Music volume and toggle
    const musicVolumeSlider = document.getElementById('music-volume-slider') as HTMLInputElement
    const musicVolumeValue = document.getElementById('music-volume-value')
    const musicVolumeFill = document.getElementById('music-volume-fill')
    const musicToggleBtn = document.getElementById('music-toggle-btn')

    musicVolumeSlider?.addEventListener('input', () => {
      const value = parseFloat(musicVolumeSlider.value)
      console.log('🎯 Music volume slider changed to:', value)
      this.audioManager.setMusicVolume(value)
      if (musicVolumeValue) musicVolumeValue.textContent = `${Math.round(value * 100)}%`
      if (musicVolumeFill) musicVolumeFill.style.width = `${value * 100}%`
    })

    musicToggleBtn?.addEventListener('click', () => {
      console.log('🎯 Music toggle button clicked')
      this.audioManager.playSoundEffect('ui')
      const isEnabled = musicToggleBtn.classList.contains('enabled')
      console.log('🎯 Music was enabled:', isEnabled)
      if (isEnabled) {
        console.log('🎯 Disabling music - setting volume to 0')
        this.audioManager.setMusicVolume(0)
        musicToggleBtn.classList.remove('enabled')
        musicToggleBtn.classList.add('disabled')
        musicToggleBtn.textContent = 'OFF'
        musicToggleBtn.title = 'Enable Music'
        if (musicVolumeSlider) musicVolumeSlider.value = '0'
        if (musicVolumeValue) musicVolumeValue.textContent = '0%'
        if (musicVolumeFill) musicVolumeFill.style.width = '0%'
      } else {
        console.log('🎯 Enabling music - setting volume to 1')
        this.audioManager.setMusicVolume(1)
        musicToggleBtn.classList.remove('disabled')
        musicToggleBtn.classList.add('enabled')
        musicToggleBtn.textContent = 'ON'
        musicToggleBtn.title = 'Disable Music'
        if (musicVolumeSlider) musicVolumeSlider.value = '1'
        if (musicVolumeValue) musicVolumeValue.textContent = '100%'
        if (musicVolumeFill) musicVolumeFill.style.width = '100%'
      }
    })

    // SFX volume and toggle
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider') as HTMLInputElement
    const sfxVolumeValue = document.getElementById('sfx-volume-value')
    const sfxVolumeFill = document.getElementById('sfx-volume-fill')
    const sfxToggleBtn = document.getElementById('sfx-toggle-btn')

    sfxVolumeSlider?.addEventListener('input', () => {
      const value = parseFloat(sfxVolumeSlider.value)
      this.audioManager.setSfxVolume(value)
      if (sfxVolumeValue) sfxVolumeValue.textContent = `${Math.round(value * 100)}%`
      if (sfxVolumeFill) sfxVolumeFill.style.width = `${value * 100}%`
    })

    sfxToggleBtn?.addEventListener('click', () => {
      this.audioManager.playSoundEffect('ui')
      const isEnabled = sfxToggleBtn.classList.contains('enabled')
      if (isEnabled) {
        this.audioManager.setSfxVolume(0)
        sfxToggleBtn.classList.remove('enabled')
        sfxToggleBtn.classList.add('disabled')
        sfxToggleBtn.textContent = 'OFF'
        sfxToggleBtn.title = 'Enable SFX'
        if (sfxVolumeSlider) sfxVolumeSlider.value = '0'
        if (sfxVolumeValue) sfxVolumeValue.textContent = '0%'
        if (sfxVolumeFill) sfxVolumeFill.style.width = '0%'
      } else {
        this.audioManager.setSfxVolume(1)
        sfxToggleBtn.classList.remove('disabled')
        sfxToggleBtn.classList.add('enabled')
        sfxToggleBtn.textContent = 'ON'
        sfxToggleBtn.title = 'Disable SFX'
        if (sfxVolumeSlider) sfxVolumeSlider.value = '1'
        if (sfxVolumeValue) sfxVolumeValue.textContent = '100%'
        if (sfxVolumeFill) sfxVolumeFill.style.width = '100%'
      }
    })

    // Mute all button
    const muteAllBtn = document.getElementById('mute-all-btn')
    let allMuted = false
    muteAllBtn?.addEventListener('click', () => {
      console.log('🎯 Master mute button clicked, currently muted:', allMuted)
      this.audioManager.playSoundEffect('ui')
      if (!allMuted) {
        console.log('🎯 Muting all - setting master volume to 0')
        this.audioManager.setMasterVolume(0)
        muteAllBtn.textContent = '🔇'
        muteAllBtn.title = 'Unmute All'
        if (masterVolumeSlider) masterVolumeSlider.value = '0'
        if (masterVolumeValue) masterVolumeValue.textContent = '0%'
        if (masterVolumeFill) masterVolumeFill.style.width = '0%'
        allMuted = true
      } else {
        console.log('🎯 Unmuting all - setting master volume to 1')
        this.audioManager.setMasterVolume(1)
        muteAllBtn.textContent = '🔊'
        muteAllBtn.title = 'Mute All'
        if (masterVolumeSlider) masterVolumeSlider.value = '1'
        if (masterVolumeValue) masterVolumeValue.textContent = '100%'
        if (masterVolumeFill) masterVolumeFill.style.width = '100%'
        allMuted = false
      }
    })

    // Game settings
    const autoSpinDelaySelect = document.getElementById('auto-spin-delay-select') as HTMLSelectElement
    const animationSpeedSelect = document.getElementById('animation-speed-select') as HTMLSelectElement

    autoSpinDelaySelect?.addEventListener('change', () => {
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('setAutoSpinDelay', parseInt(autoSpinDelaySelect.value))
    })

    animationSpeedSelect?.addEventListener('change', () => {
      this.audioManager.playSoundEffect('ui')
      this.onGameAction?.('setAnimationSpeed', animationSpeedSelect.value)
    })
  }

  private closeAllModals(): void {
    // Close info modal
    if (this.state.isInfoModalOpen) {
      const infoModal = document.getElementById('info-modal')
      if (infoModal) infoModal.style.display = 'none'
      this.state.isInfoModalOpen = false
    }

    // Close settings modal
    if (this.state.isSettingsModalOpen) {
      const settingsModal = document.getElementById('settings-modal')
      if (settingsModal) settingsModal.style.display = 'none'
      this.state.isSettingsModalOpen = false
    }

    // Close win modal
    if (this.state.isWinModalOpen) {
      const winModal = document.getElementById('win-modal')
      if (winModal) winModal.style.display = 'none'
      this.state.isWinModalOpen = false
    }

    // Close custom bet input
    if (this.state.showCustomBetInput) {
      const customBetInput = document.getElementById('custom-bet-input')
      const betControls = document.getElementById('bet-controls')
      const controlButtons = document.getElementById('control-buttons')
      const betPanel = document.getElementById('bet-panel')
      const customBetField = document.getElementById('custom-bet-field') as HTMLInputElement

      if (customBetInput && betControls && controlButtons && betPanel) {
        customBetInput.style.display = 'none'
        betControls.style.display = 'flex'
        controlButtons.style.display = 'block'
        betPanel.classList.remove('custom-input-open')
        if (customBetField) customBetField.value = ''
      }
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

    // Update max bet range
    const maxBetRangeElement = document.getElementById('max-bet-range')
    if (maxBetRangeElement) {
      maxBetRangeElement.textContent = Math.min(this.state.credits, 9999.99).toFixed(2)
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
    const winModal = document.getElementById('win-modal')
    const winModalTitle = document.getElementById('win-modal-title')
    const winModalAmount = document.getElementById('win-modal-amount')
    const winModalCelebration = document.getElementById('win-modal-celebration')

    if (winModal && winModalTitle && winModalAmount && winModalCelebration) {
      // Set title based on multiplier
      if (multiplier >= 50) {
        winModalTitle.textContent = '👑 EPIC WIN!'
      } else if (multiplier >= 20) {
        winModalTitle.textContent = '💎 MEGA WIN!'
      } else if (multiplier >= 10) {
        winModalTitle.textContent = '⭐ BIG WIN!'
      } else {
        winModalTitle.textContent = '🏆 WIN!'
      }

      winModalAmount.textContent = winAmount.toLocaleString()
      
      // Set celebration text
      const celebrations = [
        'Congratulations, brave adventurer!',
        'The tavern cheers your victory!',
        'Fortune smiles upon you!',
        'A legendary win worthy of song!',
        'Your quest for gold bears fruit!'
      ]
      winModalCelebration.textContent = celebrations[Math.floor(Math.random() * celebrations.length)]

      this.state.isWinModalOpen = true
      winModal.style.display = 'flex'
    }
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
