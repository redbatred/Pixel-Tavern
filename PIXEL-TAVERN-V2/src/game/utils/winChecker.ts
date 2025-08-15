export interface WinResult {
  winAmount: number
  winningCharacter: number | null
  winningColumns: number[]
  winningPaylines: number[]
  winningPositions: Array<{ payline: number; positions: [number, number][] }>
}

export type WinTier = 'big' | 'mega' | 'epic'

// Paylines for 3x5 slot machine (3 rows, 5 columns) - EXACT MATCH to your winning patterns image
export const PAYLINES: [number, number][][] = [
  // Payline 1: Bottom row (all bottom)
  [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
  // Payline 2: Top row (all top)
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], 
  // Payline 3: Bottom row (all bottom) 
  [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
  // Payline 4: Top-bottom-middle-bottom-top pattern
  [[0, 0], [2, 1], [1, 2], [2, 3], [0, 4]],
  // Payline 5: Bottom-top-middle-top-bottom pattern  
  [[2, 0], [0, 1], [1, 2], [0, 3], [2, 4]],
  // Payline 6: Bottom-bottom-top-top-top pattern
  [[2, 0], [2, 1], [0, 2], [0, 3], [0, 4]],
  // Payline 7: Bottom-bottom-middle-top-top pattern
  [[2, 0], [2, 1], [1, 2], [0, 3], [0, 4]],
  // Payline 8: Middle-bottom-middle-top-middle pattern
  [[1, 0], [2, 1], [1, 2], [0, 3], [1, 4]],
  // Payline 9: Middle-top-middle-bottom-middle pattern  
  [[1, 0], [0, 1], [1, 2], [2, 3], [1, 4]],
  // Payline 10: Top-middle-middle-middle-bottom pattern
  [[0, 0], [1, 1], [1, 2], [1, 3], [2, 4]],
  // Payline 11: Bottom-top-middle-middle-middle pattern
  [[2, 0], [0, 1], [1, 2], [1, 3], [1, 4]],
  // Payline 12: Top-bottom-middle-bottom-top pattern
  [[0, 0], [2, 1], [1, 2], [2, 3], [0, 4]],
  // Payline 13: Bottom-bottom-middle-top-bottom pattern
  [[2, 0], [2, 1], [1, 2], [0, 3], [2, 4]],
  // Payline 14: Bottom-top-middle-top-bottom pattern
  [[2, 0], [0, 1], [1, 2], [0, 3], [2, 4]],
  // Payline 15: Top-bottom-middle-bottom-top pattern
  [[0, 0], [2, 1], [1, 2], [2, 3], [0, 4]],
  // Payline 16: Bottom-bottom-middle-top-bottom pattern
  [[2, 0], [2, 1], [1, 2], [0, 3], [2, 4]],
  // Payline 17: Bottom-bottom-middle-bottom-top pattern
  [[2, 0], [2, 1], [1, 2], [2, 3], [0, 4]],
  // Payline 18: Middle-top-bottom-top-bottom pattern
  [[1, 0], [0, 1], [2, 2], [0, 3], [2, 4]],
  // Payline 19: Top-top-bottom-top-top pattern
  [[0, 0], [0, 1], [2, 2], [0, 3], [0, 4]],
  // Payline 20: Top-top-top-middle-bottom pattern
  [[0, 0], [0, 1], [0, 2], [1, 3], [2, 4]],
]

export const checkWins = (slotResults: number[][]): WinResult => {
  
  let totalWin = 0
  let winningCharacter: number | null = null
  const winningColumns: number[] = []
  const winningPaylines: number[] = []
  const winningPositions: Array<{ payline: number; positions: [number, number][] }> = []

  // Check each payline
  PAYLINES.forEach((payline, paylineIndex) => {
    let consecutiveCount = 1
    const firstSymbol = slotResults[payline[0][0]][payline[0][1]]

    // Check consecutive symbols from left to right
    for (let i = 1; i < payline.length; i++) {
      const [row, col] = payline[i]
      const currentSymbol = slotResults[row][col]
      
      if (currentSymbol === firstSymbol) {
        consecutiveCount++
      } else {
        break
      }
    }

    // Award win if 3 or more consecutive symbols (matching original game)
    if (consecutiveCount >= 3) {
      const winAmount = consecutiveCount * 10
      totalWin += winAmount
      winningPaylines.push(paylineIndex + 1)

      // Store winning positions
      const positions: [number, number][] = []
      for (let i = 0; i < consecutiveCount; i++) {
        positions.push([payline[i][0], payline[i][1]])
      }
      winningPositions.push({ payline: paylineIndex + 1, positions })

      // Add winning columns
      for (let i = 0; i < consecutiveCount; i++) {
        const [, col] = payline[i]
        if (!winningColumns.includes(col)) {
          winningColumns.push(col)
        }
      }

      // Set winning character
      if (winningCharacter === null) {
        winningCharacter = firstSymbol
      }
    }
  })

  const result = { winAmount: totalWin, winningCharacter, winningColumns, winningPaylines, winningPositions }
  return result
}

export const getWinTier = (winAmount: number, betAmount: number): WinTier | null => {
  const multiplier = winAmount / betAmount
  if (multiplier >= 50) return 'epic'
  if (multiplier >= 20) return 'mega'  
  if (multiplier >= 10) return 'big'
  return null
}

export const shouldShowWinModal = (winAmount: number, betAmount: number): boolean => {
  return getWinTier(winAmount, betAmount) !== null
}

export const getSpinDuration = (speed: 'slow' | 'normal' | 'fast'): number => {
  switch (speed) {
    case 'slow': return 2500
    case 'normal': return 1500
    case 'fast': return 800
    default: return 1500
  }
}

export const getScrollSpeed = (speed: 'slow' | 'normal' | 'fast'): number => {
  switch (speed) {
    case 'slow': return 6
    case 'normal': return 10
    case 'fast': return 16
    default: return 10
  }
}
