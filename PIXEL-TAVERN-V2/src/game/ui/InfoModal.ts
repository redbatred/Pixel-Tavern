import { AudioManager } from '../audio/AudioManager'

export class InfoModal {
  private container: HTMLElement
  private audioManager: AudioManager
  private modal: HTMLElement | null = null
  private isOpen = false

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
  }

  show(): void {
    if (this.isOpen) return
    
    this.isOpen = true
    this.audioManager.playUIClickSound()
    this.createModal()
    document.body.style.overflow = 'hidden'
  }

  hide(): void {
    if (!this.isOpen) return
    
    this.isOpen = false
    this.audioManager.playUIClickSound()
    
    if (this.modal) {
      this.modal.style.animation = 'modal-fade-out 0.3s ease-out'
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal)
          this.modal = null
        }
        document.body.style.overflow = ''
      }, 300)
    }
  }

  private createModal(): void {
    const symbols = [
      { name: 'Knight', multiplier: '25x', description: 'Noble warrior of the realm' },
      { name: 'Wizard', multiplier: '20x', description: 'Master of ancient magic' },
      { name: 'Archer', multiplier: '15x', description: 'Skilled marksman' },
      { name: 'Warrior', multiplier: '12x', description: 'Fierce battle champion' },
      { name: 'Barmaid', multiplier: '10x', description: 'Heart of the tavern' },
      { name: 'King', multiplier: '50x', description: 'The mighty ruler of the tavern' }
    ]

    const paylines = [
      { combo: '3 consecutive symbols', payout: '30 credits (10 × 3)' },
      { combo: '4 consecutive symbols', payout: '40 credits (10 × 4)' },
      { combo: '5 consecutive symbols', payout: '50 credits (10 × 5)' },
      { combo: '20 different paylines', payout: 'Multiple ways to win!' }
    ]

    this.modal = document.createElement('div')
    this.modal.className = 'info-modal-overlay'
    this.modal.innerHTML = `
      <div class="info-modal">
        <div class="modal-header">
          <h2 class="modal-title">Medieval Tavern Slots</h2>
          <button class="close-btn">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="info-section">
            <h3 class="section-title">🏰 Game Rules</h3>
            <div class="rules-grid">
              <div class="rule-item">
                <div class="rule-icon">🎰</div>
                <div class="rule-text">
                  <strong>How to Play:</strong> Select your bet amount and spin the reels. Match 3 or more symbols in a row to win!
                </div>
              </div>
              <div class="rule-item">
                <div class="rule-icon">💰</div>
                <div class="rule-text">
                  <strong>Betting:</strong> Choose from 5, 10, 25, 50, or 100 credits per spin. Use MAX BET for maximum wager.
                </div>
              </div>
              <div class="rule-item">
                <div class="rule-icon">⚙️</div>
                <div class="rule-text">
                  <strong>Auto Spin:</strong> Click AUTO to spin continuously until you click STOP or run out of credits.
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">👑 Symbol Values</h3>
            <div class="symbols-grid">
              ${symbols.map((symbol, index) => `
                <div class="symbol-item">
                  <div class="symbol-icon">
                    <div class="character-sprite character-${index}"></div>
                  </div>
                  <div class="symbol-info">
                    <div class="symbol-name">${symbol.name}</div>
                    <div class="symbol-multiplier">${symbol.multiplier}</div>
                    <div class="symbol-description">${symbol.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">💎 Winning Combinations</h3>
            <div class="paylines-grid">
              ${paylines.map((line, index) => `
                <div class="payline-item">
                  <div class="combo-visual">
                    <div class="combo-slots">
                      ${Array.from({ length: index + 3 }).map(() => '<div class="combo-slot active"></div>').join('')}
                      ${Array.from({ length: 5 - (index + 3) }).map(() => '<div class="combo-slot"></div>').join('')}
                    </div>
                  </div>
                  <div class="combo-info">
                    <div class="combo-name">${line.combo}</div>
                    <div class="combo-payout">${line.payout}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">⚔️ Tips & Strategy</h3>
            <div class="tips-list">
              <div class="tip-item">
                <span class="tip-bullet">🗡️</span>
                <span>Higher bet amounts don't change your odds, but increase potential winnings</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">🛡️</span>
                <span>Use AUTO spin for hands-free gaming, but watch your credit balance</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">🏹</span>
                <span>The King symbol offers the highest payouts - look for royal combinations!</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">🍺</span>
                <span>Remember to gamble responsibly and enjoy the medieval adventure</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-text">
            Welcome to the Medieval Tavern! May fortune favor your quest! 🏰
          </div>
        </div>
      </div>
    `

    // Event listeners
    const overlay = this.modal
    const closeBtn = this.modal.querySelector('.close-btn') as HTMLButtonElement

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide()
      }
    })

    closeBtn.addEventListener('click', () => {
      this.hide()
    })

    // Prevent modal content clicks from closing modal
    const modalContent = this.modal.querySelector('.info-modal') as HTMLElement
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // Add to DOM
    this.container.appendChild(this.modal)
  }

  destroy(): void {
    this.hide()
  }
}
