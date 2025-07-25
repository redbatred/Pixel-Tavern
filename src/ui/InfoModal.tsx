import React from 'react';
import { useUISound } from '../hooks/useUISound';
import './InfoModal.scss';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { withUISound } = useUISound();
  
  if (!isOpen) return null;

  const symbols = [
    { name: 'Knight', multiplier: '25x', description: 'Noble warrior of the realm' },
    { name: 'Wizard', multiplier: '20x', description: 'Master of ancient magic' },
    { name: 'Archer', multiplier: '15x', description: 'Skilled marksman' },
    { name: 'Warrior', multiplier: '12x', description: 'Fierce battle champion' },
    { name: 'Barmaid', multiplier: '10x', description: 'Heart of the tavern' },
    { name: 'King', multiplier: '50x', description: 'The mighty ruler of the tavern' }
  ];

  const paylines = [
    { combo: '3 in a row', payout: '30 credits (10 × 3)' },
    { combo: '4 in a row', payout: '40 credits (10 × 4)' },
    { combo: '5 in a row', payout: '50 credits (10 × 5)' }
  ];

  return (
    <div className="info-modal-overlay" onClick={withUISound(onClose)}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Medieval Tavern Slots</h2>
          <button className="close-btn" onClick={withUISound(onClose)}>
            <span className="close-icon">×</span>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="info-section">
            <h3 className="section-title">🏰 Game Rules</h3>
            <div className="rules-grid">
              <div className="rule-item">
                <div className="rule-icon">🎰</div>
                <div className="rule-text">
                  <strong>How to Play:</strong> Select your bet amount and spin the reels. Match 3 or more symbols in a row to win!
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">💰</div>
                <div className="rule-text">
                  <strong>Betting:</strong> Choose from 5, 10, 25, 50, or 100 credits per spin. Use MAX BET for maximum wager.
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">⚙️</div>
                <div className="rule-text">
                  <strong>Auto Spin:</strong> Click AUTO to spin continuously until you click STOP or run out of credits.
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">👑 Symbol Values</h3>
            <div className="symbols-grid">
              {symbols.map((symbol, index) => (
                <div key={index} className="symbol-item">
                  <div className="symbol-icon">
                    <div className={`character-sprite character-${index}`}></div>
                  </div>
                  <div className="symbol-info">
                    <div className="symbol-name">{symbol.name}</div>
                    <div className="symbol-multiplier">{symbol.multiplier}</div>
                    <div className="symbol-description">{symbol.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">💎 Winning Combinations</h3>
            <div className="paylines-grid">
              {paylines.map((line, index) => (
                <div key={index} className="payline-item">
                  <div className="combo-visual">
                    <div className="combo-slots">
                      {Array.from({ length: index + 3 }).map((_, i) => (
                        <div key={i} className="combo-slot active"></div>
                      ))}
                      {Array.from({ length: 5 - (index + 3) }).map((_, i) => (
                        <div key={i + index + 3} className="combo-slot"></div>
                      ))}
                    </div>
                  </div>
                  <div className="combo-info">
                    <div className="combo-name">{line.combo}</div>
                    <div className="combo-payout">{line.payout}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">⚔️ Tips & Strategy</h3>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-bullet">🗡️</span>
                <span>Higher bet amounts don't change your odds, but increase potential winnings</span>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">🛡️</span>
                <span>Use AUTO spin for hands-free gaming, but watch your credit balance</span>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">🏹</span>
                <span>The King symbol offers the highest payouts - look for royal combinations!</span>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">🍺</span>
                <span>Remember to gamble responsibly and enjoy the medieval adventure</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-text">
            Welcome to the Medieval Tavern! May fortune favor your quest! 🏰
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal; 