import React, { useState, useRef } from 'react';
import './SlotUI.scss';
import AnimatedCounter from './AnimatedCounter';
import InfoModal from './InfoModal';
import SettingsModal from '../components/SettingsModal';
import { useUISound } from '../hooks/useUISound';

interface SlotUIProps {
  credits: number;
  isSpinning: boolean;
  isAutoSpinning: boolean;
  lastWin: number;
  onSpin: () => void;
  onSettings: () => void;
  onPaytable: () => void;
  onAutoSpin: () => void;
  onMaxBet: () => void;
  betAmount: number;
  onBetChange: (amount: number) => void;
}

const SlotUI: React.FC<SlotUIProps> = ({
  credits,
  isSpinning,
  isAutoSpinning,
  lastWin,
  onSpin,
  onSettings,
  onPaytable,
  onAutoSpin,
  onMaxBet,
  betAmount,
  onBetChange
}) => {
  const betAmounts = [5, 10, 25, 50, 100];
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [customBetInput, setCustomBetInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { withUISound } = useUISound();

  // Handle custom bet input
  const handleCustomBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Replace comma with dot for decimal consistency
    value = value.replace(/,/g, '.');
    
    // Allow only numbers and one decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to reasonable length (e.g., 9999.99)
    if (value.length <= 7) {
      setCustomBetInput(value);
    }
  };

  const handleCustomBetSubmit = withUISound(() => {
    const amount = parseFloat(customBetInput);
    if (!isNaN(amount) && amount >= 0.01 && amount <= credits && amount <= 9999.99) {
      // Round to 2 decimal places to avoid floating point issues
      const roundedAmount = Math.round(amount * 100) / 100;
      onBetChange(roundedAmount);
      setShowCustomInput(false);
      setCustomBetInput('');
    }
  });

  const handleCustomBetCancel = withUISound(() => {
    setShowCustomInput(false);
    setCustomBetInput('');
  });

  const handleCustomBetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomBetSubmit();
    } else if (e.key === 'Escape') {
      handleCustomBetCancel();
    }
  };



  const handleInfoClick = withUISound(() => {
    setIsInfoModalOpen(true);
    onPaytable(); // Call the original paytable handler if needed
  });

  const handleInfoClose = withUISound(() => {
    setIsInfoModalOpen(false);
  });

  const handleSettingsClick = withUISound(() => {
    setIsSettingsModalOpen(true);
    onSettings(); // Call the original settings handler if needed
  });

  const handleSettingsClose = withUISound(() => {
    setIsSettingsModalOpen(false);
  });

  return (
    <div className="slot-ui-overlay">
      {/* Top Info Bar */}
      <div className="top-info-bar">
        <div className="info-panel">
          <AnimatedCounter value={credits} label="CREDITS" />
        </div>
        
        <div className="center-info">
          {lastWin > 0 && (
            <div className="win-display">
              <span className="win-label">WIN</span>
              <span className="win-amount">{lastWin % 1 === 0 ? lastWin.toLocaleString() : lastWin.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="info-panel">
          <button className="menu-btn" onClick={handleSettingsClick}>
            <div className="settings-icon">
              <div className="gear">
                <div className="gear-inner"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Side Panels */}
      <div className="left-panel">
        <div className="bet-panel">
          {/* Table Hat Image with Animated Beer Sprite Behind */}
          <div className="table-hat">
            <div className="beer-sprite"></div>
            <img 
              src="/assets/images/beersprite/table.png" 
              alt="Tavern Table" 
              className="table-image"
            />
          </div>
          <div className={`bet-frame ${(isSpinning || isAutoSpinning) ? 'disabled' : ''}`}>
            <div className="bet-label">BET</div>
            
            {/* Current Bet Display */}
            <div className="current-bet-display">
              <span className="current-bet-label">Current:</span>
              <span className="current-bet-amount">{betAmount % 1 === 0 ? betAmount.toLocaleString() : betAmount.toFixed(2)}</span>
            </div>
            
            {/* Custom Bet Input */}
            {showCustomInput ? (
              <div className="custom-bet-input">
                <div className="input-label">Enter Custom Bet (use . or , for decimals)</div>
                <input
                  ref={inputRef}
                  type="text"
                  value={customBetInput}
                  onChange={handleCustomBetChange}
                  onKeyDown={handleCustomBetKeyPress}
                  onClick={() => inputRef.current?.focus()}
                  placeholder="Enter amount (e.g., 25.50)"
                  className="bet-input"
                  maxLength={7}
                  autoFocus
                />
                <div className="input-range">
                  <span>Range: 0.01 - {Math.min(credits, 9999.99).toFixed(2)}</span>
                </div>
                <div className="input-buttons">
                  <button 
                    className="input-btn confirm"
                    onClick={handleCustomBetSubmit}
                    disabled={!customBetInput || isNaN(parseFloat(customBetInput)) || parseFloat(customBetInput) < 0.01 || parseFloat(customBetInput) > credits || parseFloat(customBetInput) > 9999.99}
                  >
                    <span className="btn-icon">⚔️</span>
                    <span>WAGER</span>
                  </button>
                  <button 
                    className="input-btn cancel"
                    onClick={handleCustomBetCancel}
                  >
                    <span className="btn-icon">🛡️</span>
                    <span>CANCEL</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Existing Bet Buttons */}
                <div className="bet-controls">
                  {betAmounts.map(amount => (
                    <button
                      key={amount}
                      className={`bet-btn ${betAmount === amount ? 'active' : ''}`}
                      onClick={withUISound(() => onBetChange(amount))}
                      disabled={isSpinning || isAutoSpinning}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                
                {/* Custom Bet Button */}
                <button 
                  className="control-btn custom-bet-btn"
                  onClick={withUISound(() => setShowCustomInput(true))}
                  disabled={isSpinning || isAutoSpinning}
                >
                  <div className="btn-content">
                    <span className="btn-icon">📜</span>
                    <span className="btn-text">CUSTOM</span>
                  </div>
                </button>
              </>
            )}

            {/* MAX BET Button */}
            {!showCustomInput && (
              <button 
                className="control-btn max-bet-btn"
                onClick={withUISound(onMaxBet)}
                disabled={isSpinning || isAutoSpinning}
              >
                <div className="btn-content">
                  <span className="btn-icon">💰</span>
                  <span className="btn-text">MAX BET</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <button className="side-btn info-btn" onClick={handleInfoClick}>
          <div className="info-icon">
            <svg viewBox="0 0 512 512" className="info-svg">
              <circle className="info-outer-circle" cx="256" cy="256"/>
              <circle className="info-letter-i-top" cx="256" cy="200" r="0"/>
              <line className="info-letter-i-bottom" x1="256" y1="340" x2="256" y2="240" strokeWidth="48" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
      </div>

            {/* Side Action Buttons */}
      <div className="left-action-btn">
        <button 
          className={`auto-spin-btn ${isAutoSpinning ? 'active' : ''}`} 
          onClick={withUISound(onAutoSpin)}
          disabled={!isAutoSpinning && (isSpinning || credits < betAmount)}
        >
          <div className="auto-btn-inner">
            <div className="auto-icon">
              <div className="automation-icon">
                <div className="gear-outer">
                  <div className="gear-tooth"></div>
                  <div className="gear-tooth"></div>
                  <div className="gear-tooth"></div>
                  <div className="gear-tooth"></div>
                  <div className="gear-tooth"></div>
                  <div className="gear-tooth"></div>
                </div>
                <div className="gear-inner">
                  <div className="center-dot"></div>
                </div>
                <div className="automation-indicator">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                </div>
              </div>
            </div>
            <span className="auto-text">{isAutoSpinning ? 'STOP' : 'AUTO'}</span>
          </div>
        </button>
      </div>

      <div className="right-action-btn">
                  <button 
            className={`spin-btn ${isSpinning ? 'spinning' : ''}`}
            onClick={withUISound(onSpin)}
            disabled={isSpinning || isAutoSpinning || credits < betAmount}
          >
            <div className="spin-btn-inner">
              <div className="spin-icon">
                <div className="slot-machine-icon">
                  <div className="slot-frame"></div>
                  <div className="slot-reels">
                    <div className="reel"></div>
                    <div className="reel"></div>
                    <div className="reel"></div>
                  </div>
                  <div className="slot-handle"></div>
                </div>
              </div>
              <span className="spin-text">
                {isSpinning ? 'SPINNING...' : 'SPIN'}
              </span>
              <span className="spin-cost">({betAmount % 1 === 0 ? betAmount : betAmount.toFixed(2)} Credits)</span>
            </div>
          </button>
      </div>

      {/* Status Messages */}
      {credits < betAmount && !isSpinning && !isAutoSpinning && (
        <div className="status-message insufficient-funds">
          <span>⚠️ Insufficient Credits!</span>
        </div>
      )}

      {/* Info Modal */}
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={handleInfoClose} 
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={handleSettingsClose} 
      />
    </div>
  );
};

export default SlotUI; 