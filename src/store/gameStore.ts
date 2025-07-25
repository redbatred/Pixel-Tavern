import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameSettings {
  animationSpeed: 'slow' | 'normal' | 'fast';
  autoSpinDelay: number; // in milliseconds
}

interface GameState {
  settings: GameSettings;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  setAutoSpinDelay: (delay: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      settings: {
        animationSpeed: 'normal',
        autoSpinDelay: 1500, // 1.5 seconds default
      },
      
      setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => {
        set((state) => ({
          settings: { ...state.settings, animationSpeed: speed }
        }));
      },
      
      setAutoSpinDelay: (delay: number) => {
        set((state) => ({
          settings: { ...state.settings, autoSpinDelay: delay }
        }));
      },
    }),
    {
      name: 'medieval-slot-game-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Helper function to get spin duration based on animation speed
export const getSpinDuration = (speed: 'slow' | 'normal' | 'fast'): number => {
  switch (speed) {
    case 'slow':
      return 2500; // 2.5 seconds base duration
    case 'normal':
      return 1500; // 1.5 seconds base duration  
    case 'fast':
      return 800;  // 0.8 seconds base duration
    default:
      return 1500;
  }
};

// Helper function to get scroll speed based on animation speed
export const getScrollSpeed = (speed: 'slow' | 'normal' | 'fast'): number => {
  switch (speed) {
    case 'slow':
      return 6;   // Slower scrolling
    case 'normal':
      return 10;  // Normal scrolling
    case 'fast':
      return 16;  // Faster scrolling
    default:
      return 10;
  }
}; 