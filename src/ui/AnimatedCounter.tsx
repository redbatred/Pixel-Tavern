import React, { useEffect, useState } from 'react';
import './AnimatedCounter.scss';

interface AnimatedCounterProps {
  value: number;
  label: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, label }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      // Start animation, then update value after a short delay
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  // Convert number to formatted string with decimal support
  const formatNumber = (num: number): string => {
    // Handle decimal numbers
    if (num % 1 !== 0) {
      return num.toFixed(2).padStart(8, '0'); // Format as decimal with 2 places, pad to 8 chars
    }
    return num.toString().padStart(6, '0'); // Whole numbers padded to 6 chars
  };

  const formattedValue = formatNumber(displayValue);
  const digits = formattedValue.split('');

  // Digital patterns for each digit (0-9) and decimal point
  // Each digit is represented as a 3x5 grid where true = box on, false = box off
  const digitPatterns: { [key: string]: boolean[][] } = {
    '0': [
      [true, true, true],
      [true, false, true],
      [true, false, true],
      [true, false, true],
      [true, true, true]
    ],
    '1': [
      [false, true, false],
      [false, true, false],
      [false, true, false],
      [false, true, false],
      [false, true, false]
    ],
    '2': [
      [true, true, true],
      [false, false, true],
      [true, true, true],
      [true, false, false],
      [true, true, true]
    ],
    '3': [
      [true, true, true],
      [false, false, true],
      [true, true, true],
      [false, false, true],
      [true, true, true]
    ],
    '4': [
      [true, false, true],
      [true, false, true],
      [true, true, true],
      [false, false, true],
      [false, false, true]
    ],
    '5': [
      [true, true, true],
      [true, false, false],
      [true, true, true],
      [false, false, true],
      [true, true, true]
    ],
    '6': [
      [true, true, true],
      [true, false, false],
      [true, true, true],
      [true, false, true],
      [true, true, true]
    ],
    '7': [
      [true, true, true],
      [false, false, true],
      [false, false, true],
      [false, false, true],
      [false, false, true]
    ],
    '8': [
      [true, true, true],
      [true, false, true],
      [true, true, true],
      [true, false, true],
      [true, true, true]
    ],
    '9': [
      [true, true, true],
      [true, false, true],
      [true, true, true],
      [false, false, true],
      [true, true, true]
    ],
    '.': [
      [false, false, false],
      [false, false, false],
      [false, false, false],
      [false, false, false],
      [false, true, false]
    ]
  };

  return (
    <div className="animated-counter">
      <div className="counter-label">{label}</div>
      <div className={`counter-display ${isAnimating ? 'animating' : ''}`}>
        {digits.map((digit, digitIndex) => {
          const pattern = digitPatterns[digit];
          
          // Skip rendering if pattern doesn't exist (safety check)
          if (!pattern) {
            console.warn(`No pattern found for digit: "${digit}"`);
            return null;
          }
          
          return (
            <div key={digitIndex} className="digit">
              {pattern.map((row, rowIndex) => (
                <div key={rowIndex} className="digit-row">
                  {row.map((isOn, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`box ${isOn ? 'on' : 'off'}`}
                      style={{
                        animationDelay: `${(digitIndex * 100) + (rowIndex * 20) + (colIndex * 10)}ms`
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedCounter; 