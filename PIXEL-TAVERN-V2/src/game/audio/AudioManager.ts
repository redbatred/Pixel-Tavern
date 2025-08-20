import sound from 'pixi-sound'
import { GameConfig } from '../config/GameConfig'

export interface AudioTrack {
  id: string
  name: string
  url: string
  volume: number
  loop: boolean
  category: 'music' | 'sfx'
}

export class AudioManager {
  // Prevent multiple pixi-sound entries from reloading the same URL
  private urlAliasMap: Map<string, string> = new Map()
  private backgroundMusicInstance: any = null
  private currentMusicTrack: string | null = null
  private isBackgroundMusicPlaying = false
  private wasPlayingBeforePause = false
  
  // Settings
  private masterVolume = GameConfig.AUDIO.MASTER_VOLUME
  private musicVolume = GameConfig.AUDIO.MUSIC_VOLUME
  private sfxVolume = GameConfig.AUDIO.SFX_VOLUME
  private isMuted = false
  private musicEnabled = true
  private sfxEnabled = true
  private lastPlayedTrack: string | null = null // Store the last track for resuming
  private playingLoopIds: Set<string> = new Set()

  // Audio tracks configuration
  private readonly AUDIO_TRACKS: Record<string, AudioTrack> = {
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
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
      loop: true, // Changed to loop for continuous spinning
      category: 'sfx'
    },
    SPIN_SOUND_1: {
      id: 'spin_sound_1',
      name: 'Reel Spin Column 1',
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
      loop: true,
      category: 'sfx'
    },
    SPIN_SOUND_2: {
      id: 'spin_sound_2',
      name: 'Reel Spin Column 2',
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
      loop: true,
      category: 'sfx'
    },
    SPIN_SOUND_3: {
      id: 'spin_sound_3',
      name: 'Reel Spin Column 3',
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
      loop: true,
      category: 'sfx'
    },
    SPIN_SOUND_4: {
      id: 'spin_sound_4',
      name: 'Reel Spin Column 4',
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
      loop: true,
      category: 'sfx'
    },
    SPIN_SOUND_5: {
      id: 'spin_sound_5',
      name: 'Reel Spin Column 5',
      url: '/assets/images/UI Sounds/spin-sound.wav',
      volume: 0.8,
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
    WIN_SOUND: {
      id: 'win_sound',
      name: 'Win Sound',
      url: '/assets/images/UI Sounds/win-sound.wav',
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
    }
  }

  async init(): Promise<void> {
    try {
      // Prioritize UI sounds for immediate responsiveness
      const prioritySounds = ['UI_CLICK', 'SPIN_SOUND', 'SPIN_SOUND_1', 'SPIN_SOUND_2', 'SPIN_SOUND_3', 'SPIN_SOUND_4', 'SPIN_SOUND_5', 'REEL_STOP']
      const otherSounds = Object.values(this.AUDIO_TRACKS)
        .filter(track => !prioritySounds.includes(track.id.toUpperCase()))

  // Load priority sounds first
      for (const soundId of prioritySounds) {
        const track = this.AUDIO_TRACKS[soundId]
        if (track) {
          try {
    const key = this.getOrRegisterUrlKey(track.url)
    await sound.add(track.id, {
      url: key,
              preload: true,
              loaded: () => {
                console.log(`✅ Priority sound loaded: ${soundId}`)
              }
            })
          } catch (error) {
            console.warn(`Failed to load priority sound ${soundId}:`, error)
          }
        }
      }

      // Load other sounds in parallel
      const loadPromises = otherSounds.map(async track => {
        try {
          const key = this.getOrRegisterUrlKey(track.url)
          await sound.add(track.id, {
            url: key,
            preload: true
          })
        } catch (error) {
          console.warn(`Failed to load sound ${track.id}:`, error)
        }
      })

      await Promise.allSettled(loadPromises)
      console.log('🎵 Audio system initialized')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  // Return a canonical key for a URL so multiple IDs share a single decode buffer
  private getOrRegisterUrlKey(url: string): string {
    // Normalize URL (encode spaces) to avoid duplicates
    const normalized = encodeURI(url)
    if (this.urlAliasMap.has(normalized)) return this.urlAliasMap.get(normalized) as string
    this.urlAliasMap.set(normalized, normalized)
    return normalized
  }

  // Background Music
  async playBackgroundMusic(trackId: string): Promise<void> {
    const track = this.AUDIO_TRACKS[trackId]

    if (!track || !this.musicEnabled || this.isMuted) {
      return
    }

    try {
      // Stop current music if playing
      if (this.backgroundMusicInstance) {
        try {
          this.backgroundMusicInstance.stop()
        } catch (error) {
          // Ignore stop errors
        }
        this.backgroundMusicInstance = null
      }

      // Stop any existing instances of this track
      sound.stop(track.id)

      // Play new track
      this.backgroundMusicInstance = sound.play(track.id, {
        loop: track.loop,
        volume: this.masterVolume * this.musicVolume * track.volume,
        complete: () => {
          // Handle track completion
          if (!track.loop) {
            this.isBackgroundMusicPlaying = false
            this.currentMusicTrack = null
            this.backgroundMusicInstance = null
          }
        }
      })

      this.currentMusicTrack = trackId
      this.lastPlayedTrack = trackId // Also store as last played
      this.isBackgroundMusicPlaying = true
    } catch (error) {
      // Failed to play background music
      this.backgroundMusicInstance = null
      this.isBackgroundMusicPlaying = false
      this.currentMusicTrack = null
    }
  }

  async playRandomBackgroundMusic(): Promise<void> {
    const backgroundTracks = ['TAVERN_BACKGROUND', 'WINTESHIRE_BACKGROUND']
    const randomTrack = backgroundTracks[Math.floor(Math.random() * backgroundTracks.length)]
    await this.playBackgroundMusic(randomTrack)
  }

  stopBackgroundMusic(): void {
    if (this.backgroundMusicInstance) {
      // For pixi-sound, we need to call stop on the instance
      try {
        this.backgroundMusicInstance.stop()
      } catch (error) {
        // If the instance doesn't have stop, try destroying it
        if (this.backgroundMusicInstance.destroy) {
          this.backgroundMusicInstance.destroy()
        }
      }
      this.backgroundMusicInstance = null
      this.isBackgroundMusicPlaying = false
      this.currentMusicTrack = null
    }
  }

  pauseBackgroundMusic(): void {
    if (this.backgroundMusicInstance && this.isBackgroundMusicPlaying) {
      try {
        this.backgroundMusicInstance.paused = true
      } catch (error) {
        // Fallback: stop the music if pause doesn't work
        this.stopBackgroundMusic()
        return
      }
      this.isBackgroundMusicPlaying = false
    }
  }

  resumeBackgroundMusic(): void {
    if (this.backgroundMusicInstance && !this.isBackgroundMusicPlaying) {
      try {
        this.backgroundMusicInstance.paused = false
      } catch (error) {
        // If resume fails, try to restart the current track
        if (this.currentMusicTrack) {
          this.playBackgroundMusic(this.currentMusicTrack)
        }
        return
      }
      this.isBackgroundMusicPlaying = true
    }
  }

  // Sound Effects
  // Fast, synchronous sound effect playback for immediate response
  playSoundEffect(soundId: string, customVolume?: number): void {
    const track = this.AUDIO_TRACKS[soundId]

    if (!track || !this.sfxEnabled || this.isMuted) {
      return
    }

    try {
      const volume = customVolume !== undefined
        ? customVolume * this.masterVolume
        : this.masterVolume * this.sfxVolume * track.volume

      // Immediate playback for responsive audio
      if (sound.exists(track.id)) {
        sound.play(track.id, { 
          volume,
          speed: 1.0 // Ensure normal playback speed
        })
      } else {
        // Fallback: try to load and play immediately (not recommended for click sounds)
        console.warn(`Sound ${soundId} not preloaded, attempting immediate load`)
      }
    } catch (error) {
      // Failed to play sound effect, ignore silently
      console.warn(`Failed to play sound effect ${soundId}:`, error)
    }
  }

  // Convenience methods for common game sounds
  playSpinSound(): void {
    // Start all 5 column spin sounds
    this.startAllColumnSpinSounds()
  }

  // Start spinning sounds for all columns
  startAllColumnSpinSounds(): void {
    for (let i = 1; i <= 5; i++) {
      this.startColumnSpinSound(i)
    }
  }

  // Start spinning sound for a specific column
  startColumnSpinSound(columnIndex: number): void {
    const soundId = `SPIN_SOUND_${columnIndex}` as keyof typeof this.AUDIO_TRACKS
    const track = this.AUDIO_TRACKS[soundId]
    
    if (!track) {
      console.warn(`Spin sound for column ${columnIndex} not found`)
      return
    }

    try {
      const volume = track.category === 'music' 
        ? this.masterVolume * this.musicVolume * track.volume
        : this.masterVolume * this.sfxVolume * track.volume

      if (sound.exists(track.id)) {
        // Guard: if already flagged as playing, don't start again
        if (this.playingLoopIds.has(track.id)) return
        const instance = sound.play(track.id, { 
          volume,
          loop: true, // Loop the spinning sound
          speed: 1.0
        })
        if (instance) this.playingLoopIds.add(track.id)
      }
    } catch (error) {
      console.warn(`Failed to start spin sound for column ${columnIndex}:`, error)
    }
  }

  // Stop spinning sound for a specific column
  stopColumnSpinSound(columnIndex: number): void {
    const soundId = `SPIN_SOUND_${columnIndex}` as keyof typeof this.AUDIO_TRACKS
    const track = this.AUDIO_TRACKS[soundId]
    
    if (!track) {
      console.warn(`Spin sound for column ${columnIndex} not found`)
      return
    }

    try {
      if (sound.exists(track.id)) {
        sound.stop(track.id)
        this.playingLoopIds.delete(track.id)
        // Always play reel stop sound when each column stops
        this.playReelStopSound()
      }
    } catch (error) {
      console.warn(`Failed to stop spin sound for column ${columnIndex}:`, error)
    }
  }

  // Stop all column spin sounds
  stopAllColumnSpinSounds(): void {
    for (let i = 1; i <= 5; i++) {
      // Stop without playing individual stop sounds (used when stopping all at once)
      this.stopColumnSpinSoundSilently(i)
    }
  }

  // Stop column spin sound without playing stop sound (for bulk operations)
  private stopColumnSpinSoundSilently(columnIndex: number): void {
    const soundId = `SPIN_SOUND_${columnIndex}` as keyof typeof this.AUDIO_TRACKS
    const track = this.AUDIO_TRACKS[soundId]
    
    if (!track) {
      return
    }

    try {
      if (sound.exists(track.id)) {
        sound.stop(track.id)
        this.playingLoopIds.delete(track.id)
      }
    } catch (error) {
      // Ignore errors for bulk operations
    }
  }

  stopSpinSound(): void {
    // Stop all column spinning sounds for compatibility
    this.stopAllColumnSpinSounds()
  }

  playWinSound(winAmount: number, betAmount: number): void {
    const multiplier = winAmount / betAmount
    
    // Play different sounds based on win size
    if (multiplier >= 50) {
      this.playSoundEffect('SWORD_ATTACK') // Epic win
    } else if (multiplier >= 20) {
      this.playSoundEffect('SWORD_UNSHEATH') // Mega win
    } else {
      this.playSoundEffect('WIN_SOUND') // Normal win
    }
  }

  playReelStopSound(): void {
    this.playImmediateSound('REEL_STOP')
  }

  playUIClickSound(): void {
    // Immediate click sound for maximum responsiveness
    this.playSoundEffect('UI_CLICK')
  }

  // Immediate play method for critical UI sounds
  playImmediateSound(soundId: string): void {
    const track = this.AUDIO_TRACKS[soundId]
    
    if (!track || !this.sfxEnabled || this.isMuted) {
      return
    }

    try {
      // Bypass all checks for immediate playback
      if (sound.exists(track.id)) {
        const volume = this.masterVolume * this.sfxVolume * track.volume
        sound.play(track.id, { 
          volume,
          speed: 1.0,
          start: 0 // Start from beginning
        })
      }
    } catch (error) {
      // Silently handle any playback errors
    }
  }

  // Volume Controls
  setMasterVolume(volume: number): void {
    console.log('🎵 AudioManager.setMasterVolume called with:', volume)
    this.masterVolume = Math.max(0, Math.min(1, volume))
    console.log('🎵 AudioManager.masterVolume set to:', this.masterVolume)
    this.updateBackgroundMusicVolume()
  }

  setMusicVolume(volume: number): void {
    console.log('🎵 AudioManager.setMusicVolume called with:', volume)
    this.musicVolume = Math.max(0, Math.min(1, volume))
    console.log('🎵 AudioManager.musicVolume set to:', this.musicVolume)
    this.updateBackgroundMusicVolume()
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  private updateBackgroundMusicVolume(): void {
    console.log('🎵 updateBackgroundMusicVolume called')
    console.log('🎵 Current state:', {
      hasInstance: !!this.backgroundMusicInstance,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      currentTrack: this.currentMusicTrack
    })
    
    if (this.backgroundMusicInstance) {
      const track = this.currentMusicTrack ? this.AUDIO_TRACKS[this.currentMusicTrack] : null
      if (track) {
        try {
          // Calculate if music should be silent
          const calculatedVolume = this.masterVolume * this.musicVolume * track.volume
          const shouldBeSilent = calculatedVolume === 0
          
          console.log('🎵 Calculated volume:', calculatedVolume, 'Should be silent:', shouldBeSilent)
          
          if (shouldBeSilent) {
            console.log('🎵 === MUTING MUSIC ===')
            // Store the current track before clearing it
            if (this.currentMusicTrack) {
              this.lastPlayedTrack = this.currentMusicTrack
              console.log('🎵 Stored last played track:', this.lastPlayedTrack)
            }
            
            // Stop all instances of this sound using pixi-sound
            try {
              sound.stop(track.id)
              console.log('🎵 Called sound.stop() for track:', track.id)
            } catch (e) {
              console.log('🎵 Error calling sound.stop:', e)
            }
            
            // IMMEDIATELY clear the instance reference
            console.log('🎵 Clearing instance reference')
            this.backgroundMusicInstance = null
            this.isBackgroundMusicPlaying = false
            this.currentMusicTrack = null
            console.log('🎵 Instance cleared - music should be fully stopped')
            
          } else {
            console.log('🎵 === UNMUTING MUSIC ===')
            // Music should play - recreate instance if needed
            const trackToPlay = this.currentMusicTrack || this.lastPlayedTrack
            console.log('🎵 Track to play:', trackToPlay, '(current:', this.currentMusicTrack, ', last:', this.lastPlayedTrack, ')')
            
            if (!this.backgroundMusicInstance && trackToPlay) {
              console.log('🎵 No instance exists, recreating for track:', trackToPlay)
              
              // Get the track config
              const trackConfig = this.AUDIO_TRACKS[trackToPlay]
              if (trackConfig) {
                try {
                  console.log('🎵 Playing track with ID:', trackConfig.id)
                  this.backgroundMusicInstance = sound.play(trackConfig.id, {
                    loop: trackConfig.loop,
                    volume: calculatedVolume,
                    complete: () => {
                      console.log('🎵 Background music completed')
                      this.isBackgroundMusicPlaying = false
                      this.backgroundMusicInstance = null
                      this.currentMusicTrack = null
                    }
                  })
                  this.isBackgroundMusicPlaying = true
                  this.currentMusicTrack = trackToPlay
                  console.log('🎵 Music instance recreated and playing')
                } catch (error) {
                  console.error('🎵 Error recreating music instance:', error)
                }
              } else {
                console.log('🎵 No track config found for:', trackToPlay)
              }
            } else if (this.backgroundMusicInstance) {
              // Instance exists, just update volume and resume
              console.log('🎵 Instance exists, resuming and setting volume')
              if (this.backgroundMusicInstance.paused) {
                this.backgroundMusicInstance.paused = false
                console.log('🎵 Music resumed')
              }
              this.backgroundMusicInstance.volume = calculatedVolume
              console.log('🎵 Music volume set to:', calculatedVolume)
            } else {
              console.log('🎵 No track to recreate')
            }
          }
          
        } catch (error) {
          console.error('🎵 Error updating background music:', error)
        }
      } else {
        console.log('🎵 No track found for volume update')
      }
    } else {
      console.log('🎵 No background music instance to update')
      
      // If no instance but we should have music, create it (only if volumes > 0 and enabled)
      const trackToPlay = this.currentMusicTrack || this.lastPlayedTrack
      const shouldHaveMusic = this.masterVolume > 0 && this.musicVolume > 0 && this.musicEnabled
      
      if (trackToPlay && shouldHaveMusic) {
        console.log('🎵 No instance but should have music, creating new one for track:', trackToPlay)
        const track = this.AUDIO_TRACKS[trackToPlay]
        if (track) {
          const calculatedVolume = this.masterVolume * this.musicVolume * track.volume
          try {
            this.backgroundMusicInstance = sound.play(track.id, {
              loop: track.loop,
              volume: calculatedVolume,
              complete: () => {
                this.isBackgroundMusicPlaying = false
                this.backgroundMusicInstance = null
                this.currentMusicTrack = null
              }
            })
            this.isBackgroundMusicPlaying = true
            this.currentMusicTrack = trackToPlay
            console.log('🎵 New music instance created for:', trackToPlay)
          } catch (error) {
            console.error('🎵 Error creating new music instance:', error)
          }
        } else {
          console.log('🎵 No track config found for:', trackToPlay)
        }
      } else {
        console.log('🎵 Not creating music - Track:', trackToPlay, 'ShouldHaveMusic:', shouldHaveMusic, 'Master:', this.masterVolume, 'Music:', this.musicVolume, 'Enabled:', this.musicEnabled)
      }
    }
    
    console.log('🎵 Final music state:', {
      hasInstance: !!this.backgroundMusicInstance,
      paused: this.backgroundMusicInstance?.paused,
      volume: this.backgroundMusicInstance?.volume,
      playing: this.backgroundMusicInstance?.playing,
      currentTrack: this.currentMusicTrack
    })
  }

  // Toggle Controls
  toggleMute(): void {
    this.isMuted = !this.isMuted
    this.updateBackgroundMusicVolume()
  }

  toggleMusic(): void {
    this.musicEnabled = !this.musicEnabled
    
    if (!this.musicEnabled) {
      // Disable music: stop current music
      this.stopBackgroundMusic()
    } else if (!this.isMuted) {
      // Enable music: start playing if not muted
      if (this.currentMusicTrack) {
        this.playBackgroundMusic(this.currentMusicTrack)
      } else {
        // Start random background music if no track was playing
        this.playRandomBackgroundMusic()
      }
    }
  }

  toggleSfx(): void {
    this.sfxEnabled = !this.sfxEnabled
  }

  setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return // No change needed
    
    this.musicEnabled = enabled
    
    if (!enabled) {
      // Disable music: set volume to 0 but keep playing
      this.updateBackgroundMusicVolume()
    } else if (!this.isMuted) {
      // Enable music: restore volume if not muted
      if (this.backgroundMusicInstance) {
        this.updateBackgroundMusicVolume()
      } else if (this.currentMusicTrack) {
        this.playBackgroundMusic(this.currentMusicTrack)
      } else {
        this.playRandomBackgroundMusic()
      }
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
  }

  // Pause/Resume for page visibility
  pauseForVisibility(): void {
    if (this.backgroundMusicInstance && this.isBackgroundMusicPlaying && !this.wasPlayingBeforePause) {
      this.pauseBackgroundMusic()
      this.wasPlayingBeforePause = true
    }
  }

  resumeFromVisibility(): void {
    if (this.backgroundMusicInstance && this.wasPlayingBeforePause && !this.isMuted && this.musicEnabled) {
      this.resumeBackgroundMusic()
      this.wasPlayingBeforePause = false
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopBackgroundMusic()
    sound.stopAll()
    sound.removeAll()
  }

  // Getters
  get volumes() {
    return {
      master: this.masterVolume,
      music: this.musicVolume,
      sfx: this.sfxVolume
    }
  }

  get settings() {
    return {
      muted: this.isMuted,
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled
    }
  }

  get currentTrack() {
    return this.currentMusicTrack
  }

  get isPlaying() {
    return this.isBackgroundMusicPlaying
  }

  get isMutedState() {
    return this.isMuted
  }
}
