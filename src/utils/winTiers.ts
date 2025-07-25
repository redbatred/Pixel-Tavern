import { type WinTier } from '../components/WinModal';

export const getWinTier = (winAmount: number, betAmount: number): WinTier | null => {
  const multiplier = winAmount / betAmount;
  
  if (multiplier >= 50) {
    return 'epic';  // 50x or more = Epic Win
  } else if (multiplier >= 20) {
    return 'mega';  // 20x to 49.9x = Mega Win
  } else if (multiplier >= 10) {
    return 'big';   // 10x to 19.9x = Big Win
  }
  
  return null; // Less than 10x = No special win modal
};

export const shouldShowWinModal = (winAmount: number, betAmount: number): boolean => {
  return getWinTier(winAmount, betAmount) !== null;
};