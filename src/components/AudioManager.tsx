import React, { useEffect, useRef } from 'react';
import { useAudioStore, AUDIO_TRACKS } from '../store/audioStore';

interface AudioManagerProps {
  autoStartMusic?: boolean;
  preloadAudio?: boolean;
}

const AudioManager: React.FC<AudioManagerProps> = ({ 
  autoStartMusic = true, 
  preloadAudio = true 
}) => {
  const {
    initializeAudio,
    playBackgroundMusic,
    playRandomBackgroundMusic,
    preloadAudio: preloadAudioTracks,
    cleanup,
    musicEnabled,
    isBackgroundMusicPlaying,
    currentMusicTrack
  } = useAudioStore();
  
  const hasInitialized = useRef(false);
  const hasStartedMusic = useRef(false);

  // Initialize audio system on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    
    console.log('🎵 AudioManager: Initializing...');
    initializeAudio();
    hasInitialized.current = true;

    // Preload audio files if enabled
    if (preloadAudio) {
      const tracksToPreload = Object.values(AUDIO_TRACKS);
      preloadAudioTracks(tracksToPreload);
    }

    // Cleanup on unmount
    return () => {
      console.log('🎵 AudioManager: Cleaning up...');
      cleanup();
    };
  }, [initializeAudio, preloadAudio, preloadAudioTracks, cleanup]);

  // Auto-start background music
  useEffect(() => {
    if (!autoStartMusic || hasStartedMusic.current || !musicEnabled) return;
    
    // Wait a bit for user interaction to enable audio context
    const startMusicTimer = setTimeout(() => {
      if (!isBackgroundMusicPlaying && !currentMusicTrack) {
        console.log('🎵 AudioManager: Auto-starting random tavern music...');
        playRandomBackgroundMusic();
        hasStartedMusic.current = true;
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(startMusicTimer);
  }, [autoStartMusic, musicEnabled, isBackgroundMusicPlaying, currentMusicTrack, playBackgroundMusic]);

  // Start music on first user interaction if not already playing
  useEffect(() => {
    if (!autoStartMusic || !musicEnabled) return;

    const startMusicOnInteraction = () => {
      if (!isBackgroundMusicPlaying && !currentMusicTrack) {
        console.log('🎵 AudioManager: Starting random music on user interaction...');
        playRandomBackgroundMusic();
        hasStartedMusic.current = true;
      }
    };

    // Listen for first user interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, startMusicOnInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, startMusicOnInteraction);
      });
    };
  }, [autoStartMusic, musicEnabled, isBackgroundMusicPlaying, currentMusicTrack, playBackgroundMusic]);

  // This component doesn't render anything visible
  return null;
};

export default AudioManager; 