import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Audio types
export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  category: 'music' | 'sfx';
}

export interface AudioState {
  // Audio instances
  backgroundMusic: HTMLAudioElement | null;
  soundEffects: Map<string, HTMLAudioElement>;
  
  // Settings
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  
  // Current playing
  currentMusicTrack: string | null;
  isBackgroundMusicPlaying: boolean;
  
  // Pause/Resume state
  wasPlayingBeforePause: boolean;
  
  // Actions
  initializeAudio: () => void;
  playBackgroundMusic: (trackId: string) => Promise<void>;
  playRandomBackgroundMusic: () => Promise<void>;
  stopBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
  playSoundEffect: (soundId: string, volume?: number) => Promise<void>;
  playLoopingSoundEffect: (soundId: string, instanceId: string, volume?: number) => Promise<void>;
  stopLoopingSoundEffect: (soundId: string, instanceId: string) => void;
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  preloadAudio: (tracks: AudioTrack[]) => Promise<void>;
  cleanup: () => void;
  pauseForVisibility: () => void;
  resumeFromVisibility: () => void;
}

// Audio tracks configuration
export const AUDIO_TRACKS: Record<string, AudioTrack> = {
  TAVERN_BACKGROUND: {
    id: 'tavern_background',
    name: 'The Daily Brew Tavern',
    url: '/assets/images/Music/The Daily Brew Tavern (LOOP).wav',
    volume: 0.6,
    loop: true,
    category: 'music'
  },
  WINTESHIRE_BACKGROUND: {
    id: 'winteshire_background',
    name: 'Winteshire Tavern',
    url: '/assets/images/Music/Winteshire Tavern (LOOP).wav',
    volume: 0.6,
    loop: true,
    category: 'music'
  },
  SPIN_SOUND: {
    id: 'spin_sound',
    name: 'Reel Spin',
    url: '/assets/sounds/spin.mp3', // We can add this later
    volume: 0.8,
    loop: false,
    category: 'sfx'
  },

  COIN_SOUND: {
    id: 'coin_sound',
    name: 'Coin Drop',
    url: '/assets/sounds/coin.mp3', // We can add this later
    volume: 0.7,
    loop: false,
    category: 'sfx'
  },
  UI_CLICK: {
    id: 'ui_click',
    name: 'UI Button Click',
    url: '/assets/images/UI Sounds/Minimalist9.wav',
    volume: 1,
    loop: false,
    category: 'sfx'
  },
  SPIN_REEL: {
    id: 'spin_reel',
    name: 'Reel Spinning',
    url: '/assets/images/UI Sounds/spin-sound.wav',
    volume: 0.7,
    loop: true,
    category: 'sfx'
  },
  REEL_STOP: {
    id: 'reel_stop',
    name: 'Reel Stop',
    url: '/assets/images/UI Sounds/stop-sound.wav',
    volume: 0.8,
    loop: false,
    category: 'sfx'
  },
  SWORD_UNSHEATH: {
    id: 'sword_unsheath',
    name: 'Sword Unsheath',
    url: '/assets/images/UI Sounds/Sword Unsheath 2.wav',
    volume: 0.7,
    loop: false,
    category: 'sfx'
  },
  SWORD_ATTACK: {
    id: 'sword_attack',
    name: 'Sword Attack',
    url: '/assets/images/UI Sounds/Sword Attack 1.wav',
    volume: 0.8,
    loop: false,
    category: 'sfx'
  },
  WIN_SOUND: {
    id: 'win_sound',
    name: 'Win Sound',
    url: '/assets/images/UI Sounds/win-sound.wav',
    volume: 0.7,
    loop: false,
    category: 'sfx'
  }
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      backgroundMusic: null,
      soundEffects: new Map(),
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      isMuted: false,
      musicEnabled: true,
      sfxEnabled: true,
      currentMusicTrack: null,
      isBackgroundMusicPlaying: false,
      wasPlayingBeforePause: false,

      // Initialize audio system
      initializeAudio: () => {
        console.log('🎵 Initializing audio system...');
        
        // Set up audio context for better browser compatibility
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          
          // Resume audio context on user interaction (required by browsers)
          const resumeAudio = () => {
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
          };
          
          document.addEventListener('click', resumeAudio, { once: true });
          document.addEventListener('keydown', resumeAudio, { once: true });
        }
      },

      // Background music controls
      playBackgroundMusic: async (trackId: string) => {
        const state = get();
        const track = AUDIO_TRACKS[trackId];
        
        if (!track || !state.musicEnabled || state.isMuted) {
          console.log('🎵 Background music disabled or track not found');
          return;
        }

        try {
          // Stop current music if playing
          if (state.backgroundMusic) {
            state.backgroundMusic.pause();
            state.backgroundMusic.currentTime = 0;
          }

          // Create new audio instance
          const audio = new Audio(track.url);
          audio.loop = track.loop;
          audio.volume = (state.masterVolume * state.musicVolume * track.volume);
          
          // Set up event listeners
          audio.addEventListener('loadeddata', () => {
            console.log(`🎵 Loaded: ${track.name}`);
          });
          
          audio.addEventListener('error', (e) => {
            console.error(`🎵 Error loading ${track.name}:`, e);
          });

          audio.addEventListener('ended', () => {
            if (!track.loop) {
              set({ isBackgroundMusicPlaying: false, currentMusicTrack: null });
            }
          });

          // Play the audio
          await audio.play();
          
          set({
            backgroundMusic: audio,
            currentMusicTrack: trackId,
            isBackgroundMusicPlaying: true
          });

          console.log(`🎵 Playing: ${track.name}`);
        } catch (error) {
          console.error('🎵 Failed to play background music:', error);
        }
      },

      playRandomBackgroundMusic: async () => {
        const backgroundTracks = ['TAVERN_BACKGROUND', 'WINTESHIRE_BACKGROUND'];
        const randomTrack = backgroundTracks[Math.floor(Math.random() * backgroundTracks.length)];
        console.log(`🎵 Playing random background music: ${randomTrack}`);
        await get().playBackgroundMusic(randomTrack);
      },

      stopBackgroundMusic: () => {
        const state = get();
        if (state.backgroundMusic) {
          state.backgroundMusic.pause();
          state.backgroundMusic.currentTime = 0;
          set({ 
            isBackgroundMusicPlaying: false, 
            currentMusicTrack: null 
          });
          console.log('🎵 Background music stopped');
        }
      },

      pauseBackgroundMusic: () => {
        const state = get();
        if (state.backgroundMusic && state.isBackgroundMusicPlaying) {
          state.backgroundMusic.pause();
          set({ isBackgroundMusicPlaying: false });
          console.log('🎵 Background music paused');
        }
      },

      resumeBackgroundMusic: () => {
        const state = get();
        if (state.backgroundMusic && !state.isBackgroundMusicPlaying) {
          state.backgroundMusic.play().catch(console.error);
          set({ isBackgroundMusicPlaying: true });
          console.log('🎵 Background music resumed');
        }
      },

      // Sound effects
      playSoundEffect: async (soundId: string, customVolume?: number) => {
        const state = get();
        const track = AUDIO_TRACKS[soundId];
        
        if (!track || !state.sfxEnabled || state.isMuted) {
          return;
        }

        try {
          // Get or create sound effect instance
          let audio = state.soundEffects.get(soundId);
          
          if (!audio) {
            audio = new Audio(track.url);
            state.soundEffects.set(soundId, audio);
          }

          // Reset audio to beginning
          audio.currentTime = 0;
          audio.volume = customVolume !== undefined 
            ? customVolume * state.masterVolume
            : (state.masterVolume * state.sfxVolume * track.volume);

          await audio.play();
          console.log(`🔊 Playing SFX: ${track.name}`);
        } catch (error) {
          console.error(`🔊 Failed to play sound effect ${soundId}:`, error);
        }
      },

      // Looping sound effects with unique instances
      playLoopingSoundEffect: async (soundId: string, instanceId: string, customVolume?: number) => {
        const state = get();
        const track = AUDIO_TRACKS[soundId];
        
        if (!track || !state.sfxEnabled || state.isMuted) {
          return;
        }

        try {
          const instanceKey = `${soundId}_${instanceId}`;
          
          // Stop existing instance if playing
          const existingAudio = state.soundEffects.get(instanceKey);
          if (existingAudio) {
            existingAudio.pause();
            existingAudio.currentTime = 0;
          }

          // Create new audio instance
          const audio = new Audio(track.url);
          audio.loop = track.loop;
          audio.volume = customVolume !== undefined 
            ? customVolume * state.masterVolume
            : (state.masterVolume * state.sfxVolume * track.volume);

          state.soundEffects.set(instanceKey, audio);
          await audio.play();
          console.log(`🔊 Playing looping SFX: ${track.name} (${instanceId})`);
        } catch (error) {
          console.error(`🔊 Failed to play looping sound effect ${soundId} (${instanceId}):`, error);
        }
      },

      stopLoopingSoundEffect: (soundId: string, instanceId: string) => {
        const state = get();
        const instanceKey = `${soundId}_${instanceId}`;
        const audio = state.soundEffects.get(instanceKey);
        
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          state.soundEffects.delete(instanceKey);
          console.log(`🔇 Stopped looping SFX: ${soundId} (${instanceId})`);
        }
      },

      // Volume controls
      setMasterVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ masterVolume: clampedVolume });
        
        // Update all audio volumes immediately - get fresh state after set
        setTimeout(() => {
          const state = get();
          if (state.backgroundMusic && !state.isMuted && state.musicEnabled) {
            const track = state.currentMusicTrack ? AUDIO_TRACKS[state.currentMusicTrack] : null;
            if (track) {
              const newVolume = clampedVolume * state.musicVolume * track.volume;
              state.backgroundMusic.volume = newVolume;
            }
          }
        }, 0);
      },

      setMusicVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ musicVolume: clampedVolume });
        
        // Update background music volume immediately - get fresh state after set
        setTimeout(() => {
          const state = get();
          if (state.backgroundMusic && !state.isMuted && state.musicEnabled) {
            const track = state.currentMusicTrack ? AUDIO_TRACKS[state.currentMusicTrack] : null;
            if (track) {
              const newVolume = state.masterVolume * clampedVolume * track.volume;
              state.backgroundMusic.volume = newVolume;
            }
          }
        }, 0);
      },

      setSfxVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ sfxVolume: clampedVolume });
        console.log(`🔊 SFX volume: ${Math.round(clampedVolume * 100)}%`);
      },

      // Toggle controls
      toggleMute: () => {
        const state = get();
        const newMuted = !state.isMuted;
        
        if (state.backgroundMusic) {
          if (newMuted) {
            // Mute: Just set volume to 0
            state.backgroundMusic.volume = 0;
          } else {
            // Unmute: Restore volume
            const track = state.currentMusicTrack ? AUDIO_TRACKS[state.currentMusicTrack] : null;
            if (track && state.musicEnabled) {
              const newVolume = state.masterVolume * state.musicVolume * track.volume;
              state.backgroundMusic.volume = newVolume;
            }
          }
        }
        
        set({ isMuted: newMuted });
      },

      toggleMusic: () => {
        const state = get();
        const newEnabled = !state.musicEnabled;
        
        if (!newEnabled && state.backgroundMusic) {
          // Disable music: pause but keep the audio instance
          state.backgroundMusic.pause();
          set({ isBackgroundMusicPlaying: false });
        } else if (newEnabled && state.backgroundMusic) {
          // Enable music: resume from where it was paused
          if (!state.isMuted) {
            state.backgroundMusic.play().catch(console.error);
            set({ isBackgroundMusicPlaying: true });
          }
        } else if (newEnabled && state.currentMusicTrack) {
          // Enable music but no audio instance - start fresh
          get().playBackgroundMusic(state.currentMusicTrack);
        }
        
        set({ musicEnabled: newEnabled });
      },

      toggleSfx: () => {
        set((state) => ({ sfxEnabled: !state.sfxEnabled }));
        const newState = get();
        console.log(`🔊 SFX ${newState.sfxEnabled ? 'enabled' : 'disabled'}`);
      },

      // Preload audio files
      preloadAudio: async (tracks: AudioTrack[]) => {
        console.log('🎵 Preloading audio tracks...');
        
        const loadPromises = tracks.map(track => {
          return new Promise<void>((resolve) => {
            const audio = new Audio(track.url);
            
            audio.addEventListener('loadeddata', () => {
              console.log(`✅ Preloaded: ${track.name}`);
              resolve();
            });
            
            audio.addEventListener('error', (e) => {
              console.warn(`⚠️ Failed to preload: ${track.name}`, e);
              resolve(); // Don't reject, just continue
            });
            
            // Start loading
            audio.load();
          });
        });

        try {
          await Promise.allSettled(loadPromises);
          console.log('🎵 Audio preloading complete');
        } catch (error) {
          console.error('🎵 Audio preloading failed:', error);
        }
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        
        if (state.backgroundMusic) {
          state.backgroundMusic.pause();
          state.backgroundMusic = null;
        }
        
        state.soundEffects.forEach(audio => {
          audio.pause();
        });
        state.soundEffects.clear();
        
        set({
          backgroundMusic: null,
          soundEffects: new Map(),
          currentMusicTrack: null,
          isBackgroundMusicPlaying: false
        });
        
        console.log('🎵 Audio system cleaned up');
      },

      // Pause/Resume for page visibility
      pauseForVisibility: () => {
        const state = get();
        console.log('🔇 Pausing audio - was playing:', state.isBackgroundMusicPlaying, 'already flagged:', state.wasPlayingBeforePause);
        
        // Only update state if we haven't already paused
        if (state.backgroundMusic && state.isBackgroundMusicPlaying && !state.wasPlayingBeforePause) {
          state.backgroundMusic.pause();
          set({ 
            wasPlayingBeforePause: true,
            isBackgroundMusicPlaying: false 
          });
          console.log('🔇 Audio paused and flagged for resume');
        } else if (!state.wasPlayingBeforePause && !state.isBackgroundMusicPlaying) {
          // Ensure we don't resume if music wasn't playing before
          set({ wasPlayingBeforePause: false });
          console.log('🔇 Audio was not playing - no resume needed');
        }
        
        // Pause all sound effects (including spin sounds)
        state.soundEffects.forEach((audio) => {
          if (!audio.paused) {
            audio.pause();
          }
        });
      },

      resumeFromVisibility: () => {
        const state = get();
        console.log('🔊 Resuming audio - should resume:', state.wasPlayingBeforePause, 'muted:', state.isMuted, 'enabled:', state.musicEnabled, 'has audio:', !!state.backgroundMusic);
        
        if (state.backgroundMusic && state.wasPlayingBeforePause && !state.isMuted && state.musicEnabled) {
          console.log('🔊 Attempting to resume audio...');
          // Try to resume audio - handle potential audio context suspension
          const playPromise = state.backgroundMusic.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('🎵 Audio resumed successfully');
              set({ 
                wasPlayingBeforePause: false,
                isBackgroundMusicPlaying: true 
              });
            }).catch((error) => {
              console.warn('🎵 Audio resume failed:', error);
              // Try again after a short delay
              setTimeout(() => {
                const retryState = get();
                if (retryState.backgroundMusic && retryState.wasPlayingBeforePause) {
                  console.log('🔄 Retrying audio resume...');
                  retryState.backgroundMusic.play().then(() => {
                    console.log('🎵 Audio resumed on retry');
                    set({ 
                      wasPlayingBeforePause: false,
                      isBackgroundMusicPlaying: true 
                    });
                  }).catch((retryError) => {
                    console.error('🚫 Audio resume retry failed:', retryError);
                    // Reset the flag so we don't keep trying
                    set({ wasPlayingBeforePause: false });
                  });
                }
              }, 500);
            });
          } else {
            // Fallback for browsers that don't return a promise
            console.log('🎵 Audio resumed (no promise)');
            set({ 
              wasPlayingBeforePause: false,
              isBackgroundMusicPlaying: true 
            });
          }
        } else {
          console.log('🔇 Not resuming audio - conditions not met');
        }
        
        // Resume sound effects that should be playing (like spin sounds during active spins)
        // Note: Spin sounds will be managed by the game logic, not automatically resumed here
        // This is intentional as the game state determines which sounds should be playing
      }
    }),
    {
      name: 'medieval-slot-audio', // localStorage key
      partialize: (state) => ({
        // Only persist user settings, not audio instances
        masterVolume: state.masterVolume,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        isMuted: state.isMuted,
        musicEnabled: state.musicEnabled,
        sfxEnabled: state.sfxEnabled,
      }),
    }
  )
);

// Convenience hooks for common operations
export const useBackgroundMusic = () => {
  const { 
    playBackgroundMusic, 
    stopBackgroundMusic, 
    pauseBackgroundMusic, 
    resumeBackgroundMusic,
    isBackgroundMusicPlaying,
    currentMusicTrack,
    musicEnabled
  } = useAudioStore();
  
  return {
    play: playBackgroundMusic,
    stop: stopBackgroundMusic,
    pause: pauseBackgroundMusic,
    resume: resumeBackgroundMusic,
    isPlaying: isBackgroundMusicPlaying,
    currentTrack: currentMusicTrack,
    enabled: musicEnabled
  };
};

export const useSoundEffects = () => {
  const { playSoundEffect, sfxEnabled } = useAudioStore();
  
  return {
    play: playSoundEffect,
    enabled: sfxEnabled
  };
};

export const useAudioControls = () => {
  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    isMuted,
    musicEnabled,
    sfxEnabled,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMute,
    toggleMusic,
    toggleSfx
  } = useAudioStore();
  
  return {
    volumes: { master: masterVolume, music: musicVolume, sfx: sfxVolume },
    settings: { muted: isMuted, musicEnabled, sfxEnabled },
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMute,
    toggleMusic,
    toggleSfx
  };
}; 