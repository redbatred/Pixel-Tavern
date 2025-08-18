import './game-style.css'
import './game/ui/ui-styles.scss'
import { PixelTavernGame } from './game/PixelTavernGame'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.querySelector<HTMLDivElement>('#app')!
  
  if (!gameContainer) {
    return
  }
  
  // Create unified game container that scales together
  gameContainer.innerHTML = `
    <div id="background-container" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #2c1810 url('/assets/images/background.png') center center / cover no-repeat;
      z-index: 1;
    "></div>
    <div id="viewport-container" style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(var(--viewport-scale, 1));
      transform-origin: center center;
      width: 1920px;
      height: 1080px;
      --viewport-scale: 1;
      z-index: 2;
    ">
      <div id="game-container" style="
        position: relative; 
        width: 100%; 
        height: 100%; 
        overflow: hidden;
      ">
        <canvas id="pixi-canvas" style="
          display: block;
          width: 100%;
          height: 100%;
          background: transparent;
        "></canvas>
        <div class="spin-particles-overlay" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 500;
        "></div>
        <div id="ui-overlay" style="
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          pointer-events: none; 
          z-index: 1000;
        ">
          <!-- UI elements will be added here -->
        </div>
      </div>
    </div>
  `
  
  // Initialize the game
  const game = new PixelTavernGame()
  
  game.init().catch(() => {
    // Error handling could be implemented here if needed
  })
})
