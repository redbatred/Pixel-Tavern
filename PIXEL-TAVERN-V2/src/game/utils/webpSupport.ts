/**
 * WebP Support Detection and Asset Path Helper
 * Provides fallback to PNG if WebP is not supported
 */

export class WebPSupport {
  private static isSupported: boolean | null = null

  /**
   * Check if the browser supports WebP format
   */
  static async checkSupport(): Promise<boolean> {
    if (this.isSupported !== null) {
      return this.isSupported
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        this.isSupported = true
        resolve(true)
      }
      img.onerror = () => {
        this.isSupported = false
        resolve(false)
      }
      // WebP test image (1x1 pixel)
      img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
    })
  }

  /**
   * Get the appropriate asset path based on WebP support
   */
  static async getAssetPath(basePath: string): Promise<string> {
    const supportsWebP = await this.checkSupport()
    
    if (supportsWebP) {
      return basePath.replace('.png', '.webp')
    } else {
      // Fallback to PNG
      return basePath
    }
  }

  /**
   * Get multiple asset paths with WebP detection
   */
  static async getAssetPaths(basePaths: string[]): Promise<string[]> {
    const supportsWebP = await this.checkSupport()
    
    return basePaths.map(path => {
      if (supportsWebP) {
        return path.replace('.png', '.webp')
      } else {
        return path
      }
    })
  }
}
