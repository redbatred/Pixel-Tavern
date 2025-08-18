import { AudioManager } from '../audio/AudioManager'

export interface AutoSpinOption {
  count: number
  display: string
  isInfinite?: boolean
}

export class AutoSpinModal {
  private container: HTMLElement
  private audioManager: AudioManager
  private modal: HTMLElement | null = null
  private isVisible = false
  private onSelectionCallback?: (count: number, isInfinite: boolean) => void
  private counterDisplay: HTMLElement | null = null

  private autoSpinOptions: AutoSpinOption[] = [
    { count: 10, display: '10 SPINS' },
    { count: 25, display: '25 SPINS' },
    { count: 50, display: '50 SPINS' },
    { count: 100, display: '100 SPINS' },
    { count: -1, display: 'INFINITE', isInfinite: true }
  ]

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
    this.injectStyles()
  }

  show(onSelection: (count: number, isInfinite: boolean) => void): void {
    if (this.isVisible) return

    this.onSelectionCallback = onSelection
    this.isVisible = true
    this.createModal()
    this.setupEventListeners()

    // Add to DOM
    this.container.appendChild(this.modal!)

    // Trigger animation
    requestAnimationFrame(() => {
      this.modal?.classList.add('show')
    })
  }

  hide(): void {
    if (!this.isVisible || !this.modal) return

    this.modal.classList.remove('show')
    
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal)
      }
      this.modal = null
      this.isVisible = false
    }, 300)
  }

  // Public method to update counter display
  updateSpinCounter(current: number, total: number, isInfinite: boolean = false): void {
    if (this.counterDisplay) {
      if (isInfinite) {
        this.counterDisplay.innerHTML = `
          <div class="counter-content">
            ${this.getSVGIcon('infinity')}
            <span class="counter-text">Infinite Spins</span>
            <span class="current-spin">Spin ${current}</span>
          </div>
        `
      } else {
        const remaining = total - current
        this.counterDisplay.innerHTML = `
          <div class="counter-content">
            ${this.getSVGIcon('counter')}
            <span class="counter-text">${remaining} spins remaining</span>
            <span class="progress-text">${current} / ${total}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(current / total) * 100}%"></div>
            </div>
          </div>
        `
      }
      this.counterDisplay.classList.add('active')
    }
  }

  // Public method to hide counter
  hideSpinCounter(): void {
    if (this.counterDisplay) {
      this.counterDisplay.classList.remove('active')
    }
  }

  private createModal(): void {
    this.modal = document.createElement('div')
    this.modal.className = 'auto-spin-modal-overlay'
    
    this.modal.innerHTML = `
      <div class="auto-spin-modal">
        <div class="auto-spin-header">
          <h2 class="auto-spin-title">
            ${this.getSVGIcon('settings')}
            <span>AUTO SPIN</span>
          </h2>
          <button class="modal-close-btn" id="auto-spin-close">
            ${this.getSVGIcon('close')}
          </button>
        </div>
        
        <div class="auto-spin-content">
          <p class="auto-spin-description">
            Choose how many spins to play automatically
          </p>
          
          <div class="auto-spin-options">
            ${this.autoSpinOptions.map((option, index) => `
              <button 
                class="auto-spin-option ${option.isInfinite ? 'infinite-option' : ''}" 
                data-count="${option.count}"
                data-infinite="${option.isInfinite || false}"
                data-index="${index}"
              >
                <div class="option-content">
                  <div class="option-icon">
                    ${option.isInfinite ? this.getSVGIcon('infinity') : this.getSVGIcon('spin')}
                  </div>
                  <span class="option-text">${option.display}</span>
                  ${option.isInfinite ? '<span class="infinite-badge">UNLIMITED</span>' : ''}
                </div>
                <div class="option-glow"></div>
              </button>
            `).join('')}
          </div>
          
          <div class="auto-spin-info">
            <div class="info-item">
              ${this.getSVGIcon('coin')}
              <span class="info-text">Uses your current bet amount</span>
            </div>
            <div class="info-item">
              ${this.getSVGIcon('stop')}
              <span class="info-text">Click AUTO button to stop anytime</span>
            </div>
            <div class="info-item">
              ${this.getSVGIcon('warning')}
              <span class="info-text">Stops automatically when out of credits</span>
            </div>
          </div>
        </div>
      </div>
    `

    // Create counter display overlay
    this.createCounterDisplay()
  }

  private createCounterDisplay(): void {
    this.counterDisplay = document.createElement('div')
    this.counterDisplay.className = 'auto-spin-counter-overlay'
    this.counterDisplay.innerHTML = `
      <div class="counter-content">
        <!-- Content will be updated by updateSpinCounter -->
      </div>
    `
    this.container.appendChild(this.counterDisplay)
  }

  private setupEventListeners(): void {
    if (!this.modal) return

    // Close button
    const closeBtn = this.modal.querySelector('#auto-spin-close')
    closeBtn?.addEventListener('click', () => {
      this.audioManager.playUIClickSound()
      this.hide()
    })

    // Auto spin option buttons
    const optionButtons = this.modal.querySelectorAll('.auto-spin-option')
    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const count = parseInt((button as HTMLElement).dataset.count || '0')
        const isInfinite = (button as HTMLElement).dataset.infinite === 'true'
        
        // Add selection animation
        button.classList.add('selected')
        
        this.audioManager.playUIClickSound()
        
        setTimeout(() => {
          this.onSelectionCallback?.(count, isInfinite)
          this.hide()
        }, 200)
      })

      // Add hover sound effect (if available)
      button.addEventListener('mouseenter', () => {
        // Only play if the method exists
        if ('playUIHoverSound' in this.audioManager) {
          (this.audioManager as any).playUIHoverSound?.()
        }
      })
    })

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.audioManager.playUIClickSound()
        this.hide()
      }
    })

    // Escape key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.audioManager.playUIClickSound()
        this.hide()
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
  }

  private getSVGIcon(type: string): string {
    const icons: { [key: string]: string } = {
      settings: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      `,
      close: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `,
      spin: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
        </svg>
      `,
      infinity: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.6,6.62C16.8,4.81 14.3,4.81 12.5,6.62L12,7.12L11.5,6.62C9.7,4.81 7.2,4.81 5.4,6.62C3.6,8.43 3.6,11.37 5.4,13.18L12,19.78L18.6,13.18C20.4,11.37 20.4,8.43 18.6,6.62M17.19,11.77L12,16.96L6.81,11.77C5.8,10.76 5.8,9.24 6.81,8.23C7.82,7.22 9.34,7.22 10.35,8.23L12,9.88L13.65,8.23C14.66,7.22 16.18,7.22 17.19,8.23C18.2,9.24 18.2,10.76 17.19,11.77Z"/>
        </svg>
      `,
      coin: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12H16A4,4 0 0,0 12,8V6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>
        </svg>
      `,
      stop: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18,18H6V6H18V18Z"/>
        </svg>
      `,
      warning: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
      `,
      counter: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>
      `
    }
    return icons[type] || ''
  }

  private injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .auto-spin-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .auto-spin-modal-overlay.show {
        opacity: 1;
      }

      .auto-spin-modal {
        background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border: 2px solid #ffd700;
        border-radius: 20px;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.7),
          0 0 0 1px rgba(255, 215, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        max-width: 520px;
        width: 90%;
        max-height: 85vh;
        overflow: hidden;
        transform: scale(0.7) translateY(100px) rotateX(10deg);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
      }

      .auto-spin-modal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%);
        pointer-events: none;
      }

      .auto-spin-modal-overlay.show .auto-spin-modal {
        transform: scale(1) translateY(0) rotateX(0deg);
      }

      .auto-spin-header {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
        color: #1a1a2e;
        padding: 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
      }

      .auto-spin-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%);
      }

      .auto-spin-title {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .auto-spin-title svg {
        animation: rotateGlow 3s ease-in-out infinite;
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
      }

      @keyframes rotateGlow {
        0%, 100% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
      }

      .modal-close-btn {
        background: rgba(26, 26, 46, 0.2);
        border: 2px solid #1a1a2e;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1a1a2e;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .modal-close-btn:hover {
        background: rgba(26, 26, 46, 0.4);
        transform: scale(1.1) rotate(90deg);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .auto-spin-content {
        padding: 30px;
        color: #ffd700;
      }

      .auto-spin-description {
        font-size: 18px;
        text-align: center;
        margin-bottom: 30px;
        color: #e6e6fa;
        font-weight: 300;
        line-height: 1.5;
      }

      .auto-spin-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 35px;
      }

      .auto-spin-option {
        background: linear-gradient(145deg, #2d2d4a 0%, #1a1a2e 100%);
        border: 2px solid rgba(255, 215, 0, 0.3);
        border-radius: 15px;
        padding: 24px 16px;
        color: #ffd700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
      }

      .auto-spin-option::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
        transition: all 0.5s ease;
      }

      .auto-spin-option:hover::before {
        left: 100%;
      }

      .auto-spin-option:hover {
        background: linear-gradient(145deg, #3d3d5a 0%, #2a2a3e 100%);
        border-color: #ffd700;
        transform: translateY(-4px) scale(1.02);
        box-shadow: 
          0 10px 30px rgba(255, 215, 0, 0.2),
          0 0 0 1px rgba(255, 215, 0, 0.1);
      }

      .auto-spin-option.selected {
        background: linear-gradient(145deg, #ffd700 0%, #ffed4e 100%);
        color: #1a1a2e;
        border-color: #ffd700;
        transform: scale(0.95);
      }

      .auto-spin-option.infinite-option {
        grid-column: 1 / -1;
        background: linear-gradient(145deg, #2d4a2d 0%, #1a2e1a 100%);
        border-color: rgba(46, 204, 113, 0.5);
      }

      .auto-spin-option.infinite-option:hover {
        background: linear-gradient(145deg, #3d5a3d 0%, #2a3e2a 100%);
        border-color: #2ecc71;
        box-shadow: 
          0 10px 30px rgba(46, 204, 113, 0.2),
          0 0 0 1px rgba(46, 204, 113, 0.1);
      }

      .option-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 2;
      }

      .option-icon {
        margin-bottom: 8px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      .option-icon svg {
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .option-text {
        font-size: 16px;
        font-weight: 700;
        text-align: center;
        letter-spacing: 0.5px;
      }

      .infinite-badge {
        font-size: 11px;
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        margin-top: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
      }

      .option-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
        transform: translate(-50%, -50%) scale(0);
        transition: all 0.3s ease;
        border-radius: 15px;
      }

      .auto-spin-option:hover .option-glow {
        transform: translate(-50%, -50%) scale(1);
      }

      .auto-spin-info {
        border-top: 1px solid rgba(255, 215, 0, 0.2);
        padding-top: 25px;
        margin-top: 25px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #e6e6fa;
        padding: 8px 0;
        border-left: 3px solid transparent;
        transition: all 0.3s ease;
      }

      .info-item:hover {
        border-left-color: #ffd700;
        padding-left: 8px;
      }

      .info-item svg {
        min-width: 20px;
        opacity: 0.8;
      }

      .info-text {
        line-height: 1.4;
        font-weight: 300;
      }

      /* Counter Display Overlay */
      .auto-spin-counter-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(145deg, #1a1a2e 0%, #2d2d4a 100%);
        border: 2px solid #ffd700;
        border-radius: 15px;
        padding: 20px;
        z-index: 10001;
        color: #ffd700;
        min-width: 250px;
        transform: translateX(300px);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 
          0 10px 30px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 215, 0, 0.1);
        backdrop-filter: blur(10px);
      }

      .auto-spin-counter-overlay.active {
        transform: translateX(0);
      }

      .counter-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .counter-content svg {
        margin-bottom: 8px;
        animation: spinCounter 2s linear infinite;
      }

      @keyframes spinCounter {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .counter-text {
        font-size: 16px;
        font-weight: 600;
        text-align: center;
      }

      .current-spin, .progress-text {
        font-size: 14px;
        color: #e6e6fa;
        opacity: 0.8;
      }

      .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 215, 0, 0.2);
        border-radius: 3px;
        overflow: hidden;
        margin-top: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
        border-radius: 3px;
        transition: width 0.3s ease;
        position: relative;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
        animation: shimmer 2s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .auto-spin-modal {
          width: 95%;
          margin: 20px;
        }

        .auto-spin-options {
          grid-template-columns: 1fr;
        }

        .auto-spin-option.infinite-option {
          grid-column: 1;
        }

        .auto-spin-title {
          font-size: 22px;
        }

        .auto-spin-content {
          padding: 25px 20px;
        }

        .auto-spin-counter-overlay {
          top: 10px;
          right: 10px;
          left: 10px;
          min-width: auto;
          transform: translateY(-100px);
        }

        .auto-spin-counter-overlay.active {
          transform: translateY(0);
        }
      }
    `
    document.head.appendChild(style)
  }

  destroy(): void {
    this.hide()
    this.hideSpinCounter()
    if (this.counterDisplay && this.counterDisplay.parentNode) {
      this.counterDisplay.parentNode.removeChild(this.counterDisplay)
    }
  }
}
