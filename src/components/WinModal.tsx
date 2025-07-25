import React, { useEffect, useState, useMemo } from "react";
import "./WinModal.scss";

export type WinTier = "big" | "mega" | "epic";

interface WinModalProps {
  isVisible: boolean;
  winAmount: number;
  betAmount: number;
  winTier: WinTier;
  onClose: () => void;
}

const WinModal: React.FC<WinModalProps> = ({
  isVisible,
  winAmount,
  betAmount,
  winTier,
  onClose,
}) => {
  const [showAmount, setShowAmount] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [isCountingComplete, setIsCountingComplete] = useState(false);

  const multiplier = winAmount / betAmount;

  // Memoize all particle effects so they don't re-render during count-up
  const fallingCoins = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => (
      <div
        key={i}
        className="coin"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${6 + Math.random() * 4}s`,
        }}
      >
        🪙
      </div>
    ));
  }, [isVisible]);

  const flyingEmbers = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => (
      <div
        key={i}
        className="ember"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: `${Math.random() * 20}%`,
          animationDelay: `${i * 0.15}s`,
          animationDuration: `${4 + Math.random() * 3}s`,
        }}
      >
        ✨
      </div>
    ));
  }, [isVisible]);

  const magicalSparkles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => (
      <div
        key={i}
        className="sparkle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.1}s`,
        }}
      >
        ⭐
      </div>
    ));
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      // Show the win tier first
      setTimeout(() => {
        setShowAmount(true);
        // Animate the amount counting up
        const duration = 2500; // 2.5 seconds
        const steps = 80;
        const increment = winAmount / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= winAmount) {
            current = winAmount;
            setIsCountingComplete(true);
            clearInterval(timer);
          }
          setAnimatedAmount(Math.floor(current));
        }, duration / steps);

        return () => clearInterval(timer);
      }, 800);

      // Auto close after 6 seconds
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, 6500);

      return () => clearTimeout(autoCloseTimer);
    } else {
      setShowAmount(false);
      setAnimatedAmount(0);
      setIsCountingComplete(false);
    }
  }, [isVisible, winAmount, onClose]);

  if (!isVisible) return null;

  const getTierConfig = (tier: WinTier) => {
    switch (tier) {
      case "big":
        return {
          title: "BIG WIN!",
          className: "big-win",
          particles: "✨",
          color: "#FFD700",
        };
      case "mega":
        return {
          title: "MEGA WIN!",
          className: "mega-win",
          particles: "🎆",
          color: "#FF6B6B",
        };
      case "epic":
        return {
          title: "EPIC WIN!",
          className: "epic-win",
          particles: "💎",
          color: "#9B59B6",
        };
    }
  };

  const config = getTierConfig(winTier);

  return (
    <div className="win-modal-overlay" onClick={onClose}>
      <div
        className={`win-modal ${config.className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Falling Coins */}
        <div className="falling-coins">{fallingCoins}</div>

        {/* Flying Embers */}
        <div className="embers">{flyingEmbers}</div>

        {/* Magical Sparkles */}
        <div className="sparkles">{magicalSparkles}</div>

        {/* Main content - now transparent */}
        <div className="win-content">
          <div className="win-title">
            <h1>{config.title}</h1>
            <div className="multiplier">{multiplier.toFixed(1)}x</div>
          </div>

          {showAmount && (
            <div className="win-amount">
              <div className="amount-label">You Won</div>
              <div
                className={`amount-value ${isCountingComplete ? "pulsing" : ""}`}
              >
                {animatedAmount.toLocaleString()} Credits
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default WinModal;
