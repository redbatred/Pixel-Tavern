import { AudioManager } from '../audio/AudioManager'

export interface WinRecord {
  id: string
  amount: number
  betAmount: number
  multiplier: number
  character: number | null
  timestamp: number
  tier: 'small' | 'big' | 'mega' | 'epic'
}

export class HistoryBoard {
  private container: HTMLElement
  private audioManager: AudioManager
  private winHistory: WinRecord[] = []
  private maxHistorySize = 6

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
    this.initializeBoard()
  }

  private initializeBoard(): void {
    const historyHTML = this.createHistoryBoardHTML()
    this.container.innerHTML = historyHTML
    
    // Since history items are now non-interactive (pointer-events: none), 
    // we only need to prevent clicks on the board container itself
    this.container.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    })
  }

  private createHistoryBoardHTML(): string {
    return `
  <div class="history-board interactive">
        <div class="history-header">
          <div class="history-title">
            <span class="history-text">HISTORY</span>
          </div>
        </div>
        <div class="history-content">
          <div class="history-list" id="history-list">
            ${this.winHistory.length === 0 ? this.createEmptyStateHTML() : this.createHistoryItemsHTML()}
          </div>
        </div>
      </div>
    `
  }

  private createEmptyStateHTML(): string {
    return `
      <div class="history-empty">
        <div class="empty-text">NO WINS YET</div>
        <div class="empty-subtext">Start playing!</div>
      </div>
    `;
  }

  private createHistoryItemsHTML(): string {
    return this.winHistory.map((win, index) => this.createHistoryItemHTML(win, index === 0)).join('')
  }

  private createHistoryItemHTML(record: WinRecord, isLatest: boolean = false): string {
    const amount = record.amount.toFixed(2);
    const classes = isLatest ? 'history-item latest' : 'history-item';
    
    return `
      <div class="${classes}">
        ${amount}€
      </div>
    `;
  }

  private determineWinTier(multiplier: number): 'small' | 'big' | 'mega' | 'epic' {
    if (multiplier >= 50) return 'epic'
    if (multiplier >= 20) return 'mega'
    if (multiplier >= 5) return 'big'
    return 'small'
  }

  public addWin(amount: number, betAmount: number, character: number | null): void {
    if (amount <= 0) return

    const multiplier = amount / betAmount
    const tier = this.determineWinTier(multiplier)
    
    const newWin: WinRecord = {
      id: Date.now().toString(),
      amount,
      betAmount,
      multiplier,
      character,
      timestamp: Date.now(),
      tier
    }

    // Add to beginning of array (most recent first)
    this.winHistory.unshift(newWin)

    // Keep only the last 6 wins
    if (this.winHistory.length > this.maxHistorySize) {
      this.winHistory = this.winHistory.slice(0, this.maxHistorySize)
    }

    // Update the display
    this.updateDisplay()

    // Play a subtle sound for history update
    this.audioManager.playImmediateSound('UI_CLICK')
  }

  public clearHistory(): void {
    this.winHistory = []
    this.updateDisplay()
  }

  private updateDisplay(): void {
    const historyList = document.getElementById('history-list')
    if (historyList) {
      if (this.winHistory.length === 0) {
        historyList.innerHTML = this.createEmptyStateHTML()
      } else {
        historyList.innerHTML = this.createHistoryItemsHTML()
        
        // Add animation to the newest item
        setTimeout(() => {
          const latestItem = historyList.querySelector('.history-item.latest')
          if (latestItem) {
            latestItem.classList.add('animate-in')
          }
        }, 50)
      }
      
      // Since history items are now non-interactive, no need for additional event handlers
    }
  }

  public getWinHistory(): WinRecord[] {
    return [...this.winHistory]
  }

  public destroy(): void {
    // Clean up any event listeners if needed
  }
}
