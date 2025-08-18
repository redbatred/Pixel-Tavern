/**
 * Optimized Animation System for PIXI.js Slot Machine
 * Provides high-performance animations without compromising visual quality
 */

import { Container } from 'pixi.js'
import { gsap } from 'gsap'

export class OptimizedAnimations {
  /**
   * Create optimized spin animation that runs at full speed
   */
  static createSpinAnimation(
    columns: Container[],
    duration: number,
    scrollSpeed: number,
    onColumnStop?: (columnIndex: number) => void
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const promises = columns.map((column, colIndex) => {
        return new Promise<void>((columnResolve) => {
          const spinDuration = duration + colIndex * 200
          let scrollOffset = 0
          const originalY = column.y
          let lastTime = performance.now()
          
          // Use GSAP's highest performance settings with frame-rate independence
          gsap.to({}, {
            duration: spinDuration / 1000,
            ease: 'power2.out',
            onUpdate: function() {
              // Make animation frame-rate independent using delta time
              const currentTime = performance.now()
              const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to 60fps
              lastTime = currentTime
              
              // Optimized scroll calculation with frame-rate independence
              scrollOffset += scrollSpeed * deltaTime
              const cycleDistance = 190 * 3 // GameConfig.SLOT_MACHINE.SLOT_HEIGHT * 3
              column.y = originalY + (scrollOffset % cycleDistance)
            },
            onComplete: () => {
              // Snap to clean position
              column.y = originalY
              
              // Notify column stop
              onColumnStop?.(colIndex + 1)
              
              columnResolve()
            }
          })
        })
      })
      
      Promise.all(promises).then(() => resolve())
    })
  }

  /**
   * Create optimized particle animation
   */
  static animateParticles(
    particleContainers: Container[],
    scrollSpeed: number,
    isActive: boolean = true
  ): void {
    if (!isActive) return

    particleContainers.forEach((container) => {
      if (!container.visible) return

      container.children.forEach((particle: any, pIndex: number) => {
        if (particle && particle.y !== undefined) {
          // Optimized particle movement
          particle.y += scrollSpeed * 1.5
          if (particle.y > 200) {
            particle.y = -200
            particle.x = (Math.random() - 0.5) * 60
          }
          // Optimized alpha calculation
          particle.alpha = 0.3 + Math.sin(performance.now() * 0.01 + pIndex) * 0.3
        }
      })
    })
  }

  /**
   * Create optimized lightning animation with minimal performance impact
   */
  static animateLightning(
    lightningContainers: Container[],
    isSpinning: boolean
  ): void {
    if (!isSpinning) return

    const time = performance.now()
    
    lightningContainers.forEach((container, index) => {
      if (!(container as any).isActive) return

      const lightning = (container as any).lightning
      const particles = (container as any).particles

      if (lightning) {
        // Clear and redraw lightning
        lightning.clear()

        // Optimized lightning creation
        const lightIntensity = 0.8 + Math.sin(time * 0.03 + index) * 0.1
        const lightHeight = 525
        const segments = 15

        // Create lightning path more efficiently
        const points: number[] = []
        const centerX = 0
        const startY = -lightHeight / 2
        const endY = lightHeight / 2
        const segmentHeight = lightHeight / segments

        // Generate points
        points.push(centerX, startY)
        for (let i = 1; i < segments; i++) {
          const y = startY + i * segmentHeight
          const randomOffset = (Math.sin(time * 0.02 + i) + Math.cos(time * 0.03 + i * 0.7)) * 6
          points.push(centerX + randomOffset, y)
        }
        points.push(centerX, endY)

        // Draw lightning efficiently
        lightning.lineStyle(4, 0xffb347, lightIntensity * 0.2)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }

        lightning.lineStyle(2, 0xd4af37, lightIntensity * 0.3)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }

        lightning.lineStyle(1, 0xffd700, lightIntensity * 0.3)
        lightning.moveTo(points[0], points[1])
        for (let i = 2; i < points.length; i += 2) {
          lightning.lineTo(points[i], points[i + 1])
        }
      }

      // Animate particles efficiently with frame-rate independence
      if (particles) {
        const deltaTime = performance.now() / 16.67 % 1 || 1 // Simple frame-rate independence
        particles.forEach((particle: any, pIndex: number) => {
          particle.y += 2 * deltaTime
          if (particle.y > 125) {
            particle.y = -125
            particle.x = (Math.random() - 0.5) * 20
          }
          particle.alpha = 0.3 + Math.sin(time * 0.01 + pIndex) * 0.3
        })
      }
    })
  }

  /**
   * Create optimized win highlight animation
   */
  static createWinHighlight(
    highlights: any[],
    positions: Array<{ payline: number; positions: [number, number][] }>,
    slotGrid: any[][],
    slotColumns: Container[],
    container: Container
  ): void {
    const paylineColors = [
      0x00ffff, 0xff0080, 0x00ff00, 0xff8000, 0x8000ff,
      0xffff00, 0xff0040, 0x0080ff, 0x40ff00, 0xff4000,
      0x80ff00, 0x0040ff, 0xff0000, 0x00ff80, 0x8040ff,
      0xff8040, 0x4080ff, 0x80ff40, 0xff4080, 0x40ff80
    ]

    positions.forEach(({ payline, positions: winPositions }) => {
      const color = paylineColors[(payline - 1) % paylineColors.length]
      
      winPositions.forEach(([row, col], index) => {
        const highlight = new (window as any).PIXI.Graphics()
        const symbol = slotGrid[row][col]
        
        if (!symbol) return

        const symbolWidth = symbol.texture.width * symbol.scale.x
        const symbolHeight = symbol.texture.height * symbol.scale.y
        
        const boxWidth = symbolWidth + 18
        const boxHeight = symbolHeight + 55
        const boxX = -boxWidth / 2
        const boxY = -boxHeight / 1.95
        
        highlight.clear()
        highlight.beginFill(0x000000, 0)
        highlight.lineStyle(3, color, 1.0)
        highlight.drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 12)
        highlight.lineStyle(1, 0xffffff, 0.9)
        highlight.drawRoundedRect(boxX + 1, boxY + 1, boxWidth - 2, boxHeight - 2, 11)
        highlight.endFill()
        
        const symbolColumn = slotColumns[col]
        if (symbolColumn) {
          highlight.x = symbolColumn.x + symbol.x
          highlight.y = symbolColumn.y + symbol.y
        }
        
        // Optimized animation
        gsap.set(highlight, { scale: 1, alpha: 0 })
        gsap.to(highlight, {
          alpha: 1.0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.08
        })
        
        gsap.to(highlight, {
          pixi: { brightness: 1.6, saturate: 1.4 },
          duration: 0.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        })
        
        container.addChild(highlight)
        highlights.push(highlight)
      })
    })

    // Auto-clear highlights
    gsap.delayedCall(3, () => {
      gsap.to(highlights, {
        alpha: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.in",
        onComplete: () => {
          highlights.forEach(highlight => {
            gsap.killTweensOf(highlight)
            if (highlight.parent) {
              highlight.parent.removeChild(highlight)
            }
            highlight.destroy()
          })
          highlights.length = 0
        }
      })
    })
  }

  /**
   * Optimize GSAP for maximum performance
   */
  static initializeGSAP(): void {
    // Set GSAP to use the highest performance settings
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      units: { left: "px", top: "px" }
    })

    // Set to maximum performance
    gsap.ticker.fps(60)
  }
}
