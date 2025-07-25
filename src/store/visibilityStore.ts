import { create } from 'zustand';
import { useEffect } from 'react';

interface VisibilityState {
  isVisible: boolean;
  isPaused: boolean;
  setVisibility: (visible: boolean) => void;
  pause: () => void;
  resume: () => void;
}

export const useVisibilityStore = create<VisibilityState>((set, get) => ({
  isVisible: true,
  isPaused: false,
  
  setVisibility: (visible: boolean) => {
    const currentState = get();
    console.log('👁️ Visibility changed:', visible ? 'VISIBLE' : 'HIDDEN', 'Currently paused:', currentState.isPaused);
    set({ isVisible: visible });
    
    if (!visible && !currentState.isPaused) {
      // Page became hidden - pause everything
      console.log('⏸️ Triggering pause...');
      get().pause();
    } else if (visible && currentState.isPaused) {
      // Page became visible - resume everything
      console.log('▶️ Triggering resume...');
      get().resume();
    }
  },
  
  pause: () => {
    console.log('🔇 Game paused - tab hidden');
    set({ isPaused: true });
  },
  
  resume: () => {
    console.log('🔊 Game resumed - tab visible');
    set({ isPaused: false });
  },
}));

// Hook to set up page visibility detection
export const usePageVisibility = () => {
  const { setVisibility } = useVisibilityStore();
  
  useEffect(() => {
    let pauseTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log('📄 Page visibility changed:', isVisible ? 'VISIBLE' : 'HIDDEN');
      
      if (!isVisible) {
        // Only pause after a short delay to avoid pausing when clicking browser UI
        pauseTimeout = setTimeout(() => {
          // Double-check that the page is still hidden after the delay
          if (document.hidden) {
            console.log('📄 Page still hidden after delay - pausing game');
            setVisibility(false);
          }
        }, 100); // 100ms delay to filter out quick focus changes
      } else {
        // Page became visible - clear any pending pause and resume immediately
        if (pauseTimeout) {
          clearTimeout(pauseTimeout);
          pauseTimeout = null;
        }
        setVisibility(true);
      }
    };
    
    const handleWindowBlur = () => {
      // Additional check for window losing focus (tab switch, minimize, etc.)
      console.log('📄 Window blur detected');
      // Only pause if the document is also hidden (true tab switch)
      if (document.hidden) {
        console.log('📄 Window blur + document hidden - pausing game');
        setVisibility(false);
      }
    };
    
    const handleWindowFocus = () => {
      // Window regained focus - resume immediately
      console.log('📄 Window focus detected - resuming game');
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
      }
      setVisibility(true);
    };
    
    // Listen for visibility changes and window focus/blur
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    // Set initial state
    setVisibility(!document.hidden);
    
    return () => {
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [setVisibility]);
}; 