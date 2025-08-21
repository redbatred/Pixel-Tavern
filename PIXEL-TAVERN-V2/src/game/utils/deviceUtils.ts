/**
 * Device detection and mobile utilities
 */

export class DeviceUtils {
  /**
   * Check if the current device is mobile
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
           window.innerWidth <= 768;
  }

  /**
   * Check if the current device is tablet
   */
  static isTablet(): boolean {
    return /iPad|Android|Tablet/i.test(navigator.userAgent) ||
           !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && window.innerWidth > 768);
  }

  /**
   * Check if device is in landscape orientation
   */
  static isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Check if device is in portrait orientation
   */
  static isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Check if mobile device is in correct orientation for the game
   */
  static isMobileInCorrectOrientation(): boolean {
    if (!this.isMobile()) return true;
    return this.isLandscape();
  }

  /**
   * Get device type string
   */
  static getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (this.isMobile() && !this.isTablet()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get optimal scale factor for the device
   */
  static getOptimalScale(): number {
    const deviceType = this.getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        return 0.7;
      case 'tablet':
        return 0.85;
      default:
        return 1.0;
    }
  }

  /**
   * Request fullscreen on mobile devices
   */
  static async requestFullscreen(element?: HTMLElement): Promise<void> {
    const targetElement = element || document.documentElement;
    
    if (targetElement.requestFullscreen) {
      await targetElement.requestFullscreen();
    } else if ((targetElement as any).webkitRequestFullscreen) {
      await (targetElement as any).webkitRequestFullscreen();
    } else if ((targetElement as any).mozRequestFullScreen) {
      await (targetElement as any).mozRequestFullScreen();
    } else if ((targetElement as any).msRequestFullscreen) {
      await (targetElement as any).msRequestFullscreen();
    }
  }

  /**
   * Exit fullscreen
   */
  static async exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  }

  /**
   * Lock orientation to landscape (mobile only)
   */
  static async lockOrientation(): Promise<void> {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        await (screen.orientation as any).lock('landscape');
      } catch (error) {
      }
    }
  }

  /**
   * Add viewport meta tag for mobile optimization
   */
  static setupMobileViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }

    if (this.isMobile()) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    } else {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0'
      );
    }
  }
}
