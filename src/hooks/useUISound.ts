import { useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';

export const useUISound = () => {
  const { playSoundEffect } = useAudioStore();

  const playClickSound = useCallback(() => {
    playSoundEffect('UI_CLICK');
  }, [playSoundEffect]);

  const withUISound = useCallback(<T extends unknown[]>(callback?: (...args: T) => void) => {
    return (...args: T) => {
      playClickSound();
      callback?.(...args);
    };
  }, [playClickSound]);

  return {
    playClickSound,
    withUISound
  };
}; 