/**
 * Orientation Overlay - Shows a message when mobile device is in portrait mode
 */

export class OrientationOverlay {
  private overlay: HTMLElement | null = null;
  private isShowing = false;

  constructor() {
    this.createOverlay();
    this.setupEventListeners();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'orientation-overlay';
    this.overlay.innerHTML = `
      <div class="orientation-content">
        <div class="orientation-icon">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <!-- Phone icon -->
            <rect x="35" y="10" width="50" height="60" rx="8" stroke="#d4af37" stroke-width="3" fill="none"/>
            <rect x="40" y="16" width="40" height="48" rx="2" fill="#d4af37" opacity="0.3"/>
            <!-- Rotation arrows -->
            <path d="M15 40 L25 30 L25 35 L30 35 L30 45 L25 45 L25 50 Z" fill="#d4af37"/>
            <path d="M105 40 L95 50 L95 45 L90 45 L90 35 L95 35 L95 30 Z" fill="#d4af37"/>
          </svg>
        </div>
        <h2 class="orientation-title">Rotate Your Device</h2>
        <p class="orientation-message">
          Please turn your device to landscape mode<br>
          for the best gaming experience
        </p>
        <div class="orientation-pulse"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #orientation-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
        color: #d4af37;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      #orientation-overlay.show {
        opacity: 1;
        visibility: visible;
      }

      .orientation-content {
        text-align: center;
        padding: 40px 20px;
        max-width: 400px;
        animation: orientationPulse 2s ease-in-out infinite alternate;
      }

      .orientation-icon {
        margin-bottom: 30px;
        animation: orientationRotate 3s ease-in-out infinite;
      }

      .orientation-title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        color: #d4af37;
      }

      .orientation-message {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 30px;
        color: #f4e4bc;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
      }

      .orientation-pulse {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, #d4af37 0%, transparent 70%);
        margin: 0 auto;
        animation: orientationPulseRing 2s ease-in-out infinite;
      }

      @keyframes orientationPulse {
        0% { transform: scale(1); }
        100% { transform: scale(1.05); }
      }

      @keyframes orientationRotate {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
      }

      @keyframes orientationPulseRing {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      /* Landscape override - hide overlay */
      @media (orientation: landscape) and (max-height: 600px) {
        #orientation-overlay {
          display: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);
  }

  private setupEventListeners(): void {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
    });

    // Listen for resize events (for devices that don't support orientationchange)
    window.addEventListener('resize', () => {
      this.checkOrientation();
    });

    // Initial check
    setTimeout(() => this.checkOrientation(), 100);
  }

  private checkOrientation(): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
                    window.innerWidth <= 768;

    const isPortrait = window.innerHeight > window.innerWidth;
    const shouldShow = isMobile && isPortrait;

    if (shouldShow && !this.isShowing) {
      this.show();
    } else if (!shouldShow && this.isShowing) {
      this.hide();
    }
  }

  private show(): void {
    if (!this.overlay) return;
    
    this.isShowing = true;
    this.overlay.classList.add('show');
    
    // Prevent scrolling when overlay is showing
    document.body.style.overflow = 'hidden';
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('orientationOverlayShow'));
  }

  private hide(): void {
    if (!this.overlay) return;
    
    this.isShowing = false;
    this.overlay.classList.remove('show');
    
    // Restore scrolling
    document.body.style.overflow = '';
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('orientationOverlayHide'));
  }

  public isVisible(): boolean {
    return this.isShowing;
  }

  public destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isShowing = false;
    
    // Clean up event listeners
    window.removeEventListener('orientationchange', this.checkOrientation);
    window.removeEventListener('resize', this.checkOrientation);
  }
}
