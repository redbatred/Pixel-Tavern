import './game-style.css'
import './game/ui/ui-styles.scss'
import { PixelTavernGame } from './game/PixelTavernGame'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.querySelector<HTMLDivElement>('#app')!
  
  if (!gameContainer) {
    return
  }
  
  // Create game canvas container
  gameContainer.innerHTML = `
    <div id="game-container" style="position: relative; width: 100%; height: 100vh; overflow: hidden;">
      <canvas id="pixi-canvas" style="display: block;"></canvas>
      <div id="ui-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
        <!-- UI elements will be added here -->
      </div>
    </div>
  `
  
  // Initialize the game
  const game = new PixelTavernGame()
  
  game.init().catch(() => {
    // Error handling could be implemented here if needed
  })
})
