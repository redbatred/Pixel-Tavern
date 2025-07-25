import React from 'react';
import { useAudioControls, useBackgroundMusic } from '../store/audioStore';
import { useUISound } from '../hooks/useUISound';
import './AudioControls.scss';

interface AudioControlsProps {
  className?: string;
}

const AudioControls: React.FC<AudioControlsProps> = ({ className = '' }) => {
  const { volumes, settings, setMasterVolume, setMusicVolume, setSfxVolume, toggleMute, toggleMusic, toggleSfx } = useAudioControls();
  const { isPlaying, play } = useBackgroundMusic();
  const { withUISound } = useUISound();

  const handleMusicToggle = () => {
    toggleMusic();
  };

  const handleMuteToggle = () => {
    const wasMuted = settings.muted;
    toggleMute();
    
    // If unmuting and not currently playing, start the tavern music
    if (wasMuted && !isPlaying && settings.musicEnabled) {
      setTimeout(() => {
        play('TAVERN_BACKGROUND');
      }, 100);
    }
  };

  const handleVolumeChange = (type: 'master' | 'music' | 'sfx', value: string) => {
    const numValue = parseFloat(value);
    switch (type) {
      case 'master':
        setMasterVolume(numValue);
        break;
      case 'music':
        setMusicVolume(numValue);
        break;
      case 'sfx':
        setSfxVolume(numValue);
        break;
    }
  };

  const handleSliderInput = (type: 'master' | 'music' | 'sfx', e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    handleVolumeChange(type, (e.target as HTMLInputElement).value);
  };

  return (
    <div className={`audio-controls ${className}`}>
      <div className="audio-controls-header">
        <h3>🎵 Audio Settings</h3>
        <button 
          className={`mute-btn ${settings.muted ? 'muted' : ''}`}
          onClick={withUISound(handleMuteToggle)}
          title={settings.muted ? 'Unmute All' : 'Mute All'}
        >
          {settings.muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Master Volume */}
      <div className="volume-control">
        <label className="volume-label">
          <span className="volume-icon">🎚️</span>
          <span className="volume-text">Master Volume</span>
          <span className="volume-value">{Math.round(volumes.master * 100)}%</span>
        </label>
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volumes.master}
            onChange={(e) => handleSliderInput('master', e)}
            onInput={(e) => handleSliderInput('master', e)}
            className="volume-slider master-volume"
            disabled={settings.muted}
          />
          <div 
            className="volume-fill" 
            style={{ width: `${volumes.master * 100}%` }}
          />
        </div>
      </div>

      {/* Music Volume */}
      <div className="volume-control">
        <label className="volume-label">
          <div className="label-with-toggle">
            <span className="volume-icon">🎵</span>
            <span className="volume-text">Music</span>
            <button 
              className={`toggle-btn ${settings.musicEnabled ? 'enabled' : 'disabled'}`}
              onClick={withUISound(handleMusicToggle)}
              title={settings.musicEnabled ? 'Disable Music' : 'Enable Music'}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <span className="volume-value">{Math.round(volumes.music * 100)}%</span>
        </label>
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volumes.music}
            onChange={(e) => handleSliderInput('music', e)}
            onInput={(e) => handleSliderInput('music', e)}
            className="volume-slider music-volume"
            disabled={settings.muted || !settings.musicEnabled}
          />
          <div 
            className="volume-fill music-fill" 
            style={{ width: `${volumes.music * 100}%` }}
          />
        </div>
      </div>

      {/* SFX Volume */}
      <div className="volume-control">
        <label className="volume-label">
          <div className="label-with-toggle">
            <span className="volume-icon">🔊</span>
            <span className="volume-text">Sound Effects</span>
            <button 
              className={`toggle-btn ${settings.sfxEnabled ? 'enabled' : 'disabled'}`}
              onClick={withUISound(toggleSfx)}
              title={settings.sfxEnabled ? 'Disable SFX' : 'Enable SFX'}
            >
              {settings.sfxEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <span className="volume-value">{Math.round(volumes.sfx * 100)}%</span>
        </label>
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volumes.sfx}
            onChange={(e) => handleSliderInput('sfx', e)}
            onInput={(e) => handleSliderInput('sfx', e)}
            className="volume-slider sfx-volume"
            disabled={settings.muted || !settings.sfxEnabled}
          />
          <div 
            className="volume-fill sfx-fill" 
            style={{ width: `${volumes.sfx * 100}%` }}
          />
        </div>
      </div>

      {/* Music Status */}
      <div className="music-status">
        <div className="status-indicator">
          <span className="status-icon">
            {isPlaying ? '🎶' : '⏸️'}
          </span>
          <span className="status-text">
            {isPlaying ? 'Tavern Music Playing' : 'Music Paused'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioControls; 