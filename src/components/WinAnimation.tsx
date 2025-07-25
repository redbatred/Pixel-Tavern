import React, { useEffect, useRef, useState } from 'react';
import { Application, Assets, Sprite, Rectangle, Texture } from 'pixi.js';
import { useVisibilityStore } from '../store/visibilityStore';
import { useAudioStore } from '../store/audioStore';
import './WinAnimation.scss';

interface WinAnimationProps {
  isVisible: boolean;
  characterIndex: number; // 0-5 for Knight, Wizard, Archer, Warrior, Barmaid, King
  onAnimationComplete: () => void;
}

const WinAnimation: React.FC<WinAnimationProps> = ({ 
  isVisible, 
  characterIndex, 
  onAnimationComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const animationRef = useRef<number | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { playSoundEffect } = useAudioStore();

  // Always show knight animation for any win

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    const initializeAnimation = async () => {
      if (!canvasRef.current) return;

      try {
        // Create PIXI application
        const app = new Application();
        await app.init({
          width: 400,
          height: 400,
          backgroundColor: 0x000000,
          backgroundAlpha: 0, // Fully transparent background
          antialias: false, // Keep pixel art crisp
          view: canvasRef.current,
        });

        appRef.current = app;

        // Load appropriate sprite based on character index
        let spriteTexture;
        let isKnight = false;
        let isMage = false;
        
        if (characterIndex === 0) {
          // Knight (index 0) - use ATTACK 2 sprite
          spriteTexture = await Assets.load('/assets/images/knight-sprite/ATTACK 2.png');
          isKnight = true;
        } else if (characterIndex === 1) {
          // Wizard/Mage (index 1) - use death-sheet sprite
          spriteTexture = await Assets.load('/assets/images/mage-sprite/death-sheet.png');
          isMage = true;
        } else {
          // Default to knight for other characters
          spriteTexture = await Assets.load('/assets/images/knight-sprite/ATTACK 2.png');
          isKnight = true;
        }
        
        if (cancelled) return;

        // Check the actual dimensions of the sprite sheet
        console.log('🧙 Sprite dimensions:', spriteTexture.width, 'x', spriteTexture.height);
        
        let frameWidth, frameHeight, totalFrames, frameSpacing;
        
        if (isKnight) {
          // ATTACK 2 sprite: 480x84 pixels with 5 frames of 84x84 each
          frameWidth = 84;
          frameHeight = 84;
          totalFrames = 5;
          frameSpacing = spriteTexture.width / totalFrames; // 96px spacing
        } else if (isMage) {
          // Mage death-sheet: 2048x120 pixels with 16 frames of 128x120 each
          // Exact specifications: 16 frames in 1 row, 16 columns
          frameWidth = 128;
          frameHeight = 120;
          totalFrames = 16;
          frameSpacing = 128; // Exact frame spacing (2048 / 16 = 128)
        } else {
          // Default to knight specs
          frameWidth = 84;
          frameHeight = 84;
          totalFrames = 5;
          frameSpacing = spriteTexture.width / totalFrames;
        }
        
        console.log(`🧙 Sprite: ${spriteTexture.width}x${spriteTexture.height}`);
        console.log(`🧙 Frame specs: ${frameWidth}x${frameHeight}, ${totalFrames} frames, spacing: ${frameSpacing}px`);
        
        // Validate mage sprite specifications
        if (isMage) {
          const expectedWidth = 2048;
          const expectedHeight = 120;
          const expectedFrameWidth = 128;
          const expectedFrameHeight = 120;
          const expectedFrames = 16;
          
          if (spriteTexture.width !== expectedWidth || spriteTexture.height !== expectedHeight) {
            console.warn(`🚫 Mage sprite size mismatch! Expected: ${expectedWidth}x${expectedHeight}, Got: ${spriteTexture.width}x${spriteTexture.height}`);
          }
          
          if (frameWidth !== expectedFrameWidth || frameHeight !== expectedFrameHeight) {
            console.warn(`🚫 Mage frame size mismatch! Expected: ${expectedFrameWidth}x${expectedFrameHeight}, Got: ${frameWidth}x${frameHeight}`);
          }
          
          if (totalFrames !== expectedFrames) {
            console.warn(`🚫 Mage frame count mismatch! Expected: ${expectedFrames}, Got: ${totalFrames}`);
          }
          
          console.log('✅ Mage sprite specifications validated');
        }

        // Create animation frames
        const frames: Texture[] = [];
        for (let i = 0; i < totalFrames; i++) {
          const rect = new Rectangle(
            i * frameSpacing,  // X position based on frame spacing
            0,                 // Y position: 0 (single row)
            frameWidth,        // Width based on character
            frameHeight        // Height based on character
          );
          const frameTexture = new Texture({
            source: spriteTexture.source,
            frame: rect
          });
          frames.push(frameTexture);
          if (isMage) {
            console.log(`🧙 Frame ${i}: x=${i * frameSpacing}, y=0, w=${frameWidth}, h=${frameHeight}`);
          }
        }

        // Create animated sprite
        const animatedSprite = new Sprite(frames[0]);
        animatedSprite.anchor.set(0.5);
        animatedSprite.x = app.screen.width / 2;
        animatedSprite.y = app.screen.height / 2;
        
        // Scale based on character type for optimal display
        let targetSize;
        if (isMage) {
          targetSize = 250; // Slightly smaller for mage's larger frames (128x120)
        } else {
          targetSize = 300; // Knight size for 84x84 frames
        }
        
        const scale = targetSize / Math.max(frameWidth, frameHeight);
        animatedSprite.scale.set(scale);

        app.stage.addChild(animatedSprite);
        spriteRef.current = animatedSprite;

        setIsLoaded(true);

        // Play knight sword sounds if this is a knight animation
        if (isKnight) {
          // Play sword unsheath immediately
          playSoundEffect('SWORD_UNSHEATH');
          
          // Play sword attack after a short delay (when attack animation starts)
          setTimeout(() => {
            playSoundEffect('SWORD_ATTACK');
          }, 600); // Delay to sync with attack animation frame
        }

        // Animate through frames - adjust timing based on character
        let currentFrame = 0;
        let frameCounter = 0;
        let frameRate, maxLoops;
        let loops = 0;
        
        if (isMage) {
          frameRate = 6; // Slower for better visibility (10 FPS) - 16 frames * 6 = 96 frames total
          maxLoops = 1; // Play once - death animation is longer
          console.log('🧙 Mage animation: 16 frames at 10 FPS, playing once');
        } else {
          frameRate = 15; // Slower for 5-frame knight attack (4 FPS)
          maxLoops = 2; // Play twice for knight
          console.log('⚔️ Knight animation: 5 frames at 4 FPS, playing twice');
        }

        const animate = () => {
          if (cancelled) return;

          // Check if game is paused
          const currentState = useVisibilityStore.getState();
          if (currentState.isPaused) {
            // Continue animation loop but don't update frames
            animationRef.current = requestAnimationFrame(animate);
            return;
          }

          frameCounter++;
          if (frameCounter >= frameRate) {
            frameCounter = 0;
            currentFrame = (currentFrame + 1) % frames.length;
            
            if (spriteRef.current) {
              spriteRef.current.texture = frames[currentFrame];
              if (isMage && currentFrame % 4 === 0) {
                console.log(`🧙 Mage frame: ${currentFrame}/${frames.length - 1}`);
              }
            }

            // Check if we completed a full animation cycle
            if (currentFrame === 0) {
              loops++;
              if (loops >= maxLoops) {
                // Animation complete
                setTimeout(() => {
                  if (!cancelled) {
                    onAnimationComplete();
                  }
                }, 800); // Brief pause before hiding
                return;
              }
            }
          }

          animationRef.current = requestAnimationFrame(animate);
        };

        animate();

      } catch (error) {
        console.error('Failed to load win animation:', error);
        onAnimationComplete();
      }
    };

    initializeAnimation();

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
        });
        appRef.current = null;
      }
      setIsLoaded(false);
    };
  }, [isVisible, characterIndex, onAnimationComplete]);

  if (!isVisible) return null;

  const characterNames = ['knight', 'wizard', 'archer', 'warrior', 'barmaid', 'king'];
  const characterClass = characterNames[characterIndex] || 'knight';

  return (
    <div className="win-animation-overlay">
      <div className={`win-animation-container ${characterClass}`}>
        <canvas 
          ref={canvasRef}
          className={`win-animation-canvas ${isLoaded ? 'loaded' : ''}`}
        />
        <div className="win-animation-glow"></div>
        <div className="win-animation-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WinAnimation; 