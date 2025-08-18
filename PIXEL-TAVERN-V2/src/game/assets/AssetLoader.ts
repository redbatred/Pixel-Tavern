import { Assets, Texture, Rectangle } from 'pixi.js'
import { WebPSupport } from '../utils/webpSupport'

export interface GameTextures {
  background: Texture
  frame: Texture
  characters: Texture
  columnBg: Texture
  symbols: Texture[]
}

export class AssetLoader {
  private textures: GameTextures | null = null

  async loadAssets(): Promise<void> {
    try {
      // Get optimal asset paths based on WebP support
      const assetPaths = await WebPSupport.getAssetPaths([
        '/assets/images/background.png',
        '/assets/images/Frame.png',
        '/assets/images/characters.png',
        '/assets/images/slot-column-bg.png'
      ])

      // Load all textures in parallel with error handling (optimized format)
      const assetPromises = assetPaths.map(path => Assets.load(path).catch(() => null))

      const [backgroundTexture, frameTexture, charactersTexture, columnBgTexture] = await Promise.all(assetPromises)

      // Check if critical assets loaded
      if (!backgroundTexture || !frameTexture || !charactersTexture || !columnBgTexture) {
        throw new Error('Failed to load critical game assets')
      }

      // Create individual symbol textures from sprite sheet
      const symbols = this.createSymbolTextures(charactersTexture)

      this.textures = {
        background: backgroundTexture,
        frame: frameTexture,
        characters: charactersTexture,
        columnBg: columnBgTexture,
        symbols
      }
    } catch (error) {
      throw error
    }
  }

  private createSymbolTextures(charactersTexture: Texture): Texture[] {
    // Characters arranged in 2x3 grid (6 characters total)
    const symbolWidth = charactersTexture.width / 3 // 3 columns
    const symbolHeight = charactersTexture.height / 2 // 2 rows
    const symbols: Texture[] = []

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * symbolWidth
        const y = row * symbolHeight

        // Create precise rectangle for symbol extraction
        const rect = new Rectangle(
          Math.floor(x), 
          Math.floor(y), 
          Math.floor(symbolWidth), 
          Math.floor(symbolHeight)
        )

        const symbolTexture = new Texture({
          source: charactersTexture.source,
          frame: rect
        })

        symbols.push(symbolTexture)
      }
    }

    return symbols
  }

  getTextures(): GameTextures {
    if (!this.textures) {
      throw new Error('Assets not loaded yet. Call loadAssets() first.')
    }
    return this.textures
  }

  getSymbolTexture(index: number): Texture {
    const textures = this.getTextures()
    return textures.symbols[index % textures.symbols.length]
  }
}
