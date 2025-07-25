import React from 'react';
import AudioControls from './AudioControls';
import { useGameStore } from '../store/gameStore';
import { useUISound } from '../hooks/useUISound';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setAnimationSpeed, setAutoSpinDelay } = useGameStore();
  const { withUISound } = useUISound();
  
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAnimationSpeedChange = withUISound((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnimationSpeed(e.target.value as 'slow' | 'normal' | 'fast');
  });

  const handleAutoSpinDelayChange = withUISound((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoSpinDelay(parseInt(e.target.value));
  });

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>⚙️ Game Settings</h2>
          <button className="close-btn" onClick={withUISound(onClose)}>
            ✕
          </button>
        </div>
        
        <div className="settings-modal-content">
          <div className="settings-section">
            <AudioControls />
          </div>
          
          <div className="settings-section">
            <h3>🎮 Game Settings</h3>
            <div className="setting-item">
              <label>
                <span>Auto-spin delay:</span>
                <select 
                  value={settings.autoSpinDelay} 
                  onChange={handleAutoSpinDelayChange}
                >
                  <option value="1000">1 second</option>
                  <option value="1500">1.5 seconds</option>
                  <option value="2000">2 seconds</option>
                  <option value="3000">3 seconds</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <span>Animation speed:</span>
                <select 
                  value={settings.animationSpeed} 
                  onChange={handleAnimationSpeedChange}
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </label>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>ℹ️ About</h3>
            <div className="about-content">
              <p><strong>Medieval Tavern Slots</strong></p>
              <p>Version 1.0.0</p>
              <p>A magical slot machine experience set in a medieval tavern.</p>
              <p>Features original music and authentic medieval characters.</p>
            </div>
          </div>
        </div>
        
        <div className="settings-modal-footer">
          <button className="settings-btn save-btn" onClick={withUISound(onClose)}>
            💾 Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 