export interface WinResult {
  winAmount: number
  winningCharacter: number | null
  winningColumns: number[]
  winningPaylines: number[]
  winningPositions: Array<{ payline: number; positions: [number, number][] }>
}

export type WinTier = 'big' | 'mega' | 'epic'

// Paylines for 3x5 slot machine (3 rows, 5 columns) - Fixed and simplified
export const PAYLINES: [number, number][][] = [
  // Basic horizontal lines
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Payline 1: Top row
  [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Payline 2: Middle row
  [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Payline 3: Bottom row
  
  // Diagonal lines
  [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]], // Payline 4: V shape (top-middle-bottom-middle-top)
  [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4]], // Payline 5: Inverted V (bottom-middle-top-middle-bottom)
  
  // Zigzag patterns
  [[0, 0], [2, 1], [1, 2], [2, 3], [0, 4]], // Payline 6: Top-bottom-middle-bottom-top
  [[2, 0], [0, 1], [1, 2], [0, 3], [2, 4]], // Payline 7: Bottom-top-middle-top-bottom
  
  // More complex patterns
  [[1, 0], [0, 1], [0, 2], [0, 3], [1, 4]], // Payline 8: Middle-top-top-top-middle
  [[1, 0], [2, 1], [2, 2], [2, 3], [1, 4]], // Payline 9: Middle-bottom-bottom-bottom-middle
  [[0, 0], [0, 1], [1, 2], [2, 3], [2, 4]], // Payline 10: Top-top-middle-bottom-bottom
  
  // Additional patterns for more win opportunities
  [[2, 0], [2, 1], [1, 2], [0, 3], [0, 4]], // Payline 11: Bottom-bottom-middle-top-top
  [[0, 0], [1, 1], [1, 2], [1, 3], [2, 4]], // Payline 12: Top-middle-middle-middle-bottom
  [[2, 0], [1, 1], [1, 2], [1, 3], [0, 4]], // Payline 13: Bottom-middle-middle-middle-top
  [[1, 0], [0, 1], [2, 2], [0, 3], [1, 4]], // Payline 14: Middle-top-bottom-top-middle
  [[1, 0], [2, 1], [0, 2], [2, 3], [1, 4]], // Payline 15: Middle-bottom-top-bottom-middle
  
  // Extra patterns
  [[0, 0], [2, 1], [0, 2], [2, 3], [0, 4]], // Payline 16: Top-bottom-top-bottom-top
  [[2, 0], [0, 1], [2, 2], [0, 3], [2, 4]], // Payline 17: Bottom-top-bottom-top-bottom
  [[1, 0], [1, 1], [0, 2], [1, 3], [1, 4]], // Payline 18: Middle-middle-top-middle-middle
  [[1, 0], [1, 1], [2, 2], [1, 3], [1, 4]], // Payline 19: Middle-middle-bottom-middle-middle
  [[0, 0], [1, 1], [2, 2], [2, 3], [2, 4]], // Payline 20: Top-middle-bottom-bottom-bottom
]

export const checkWins = (slotResults: number[][]): WinResult => {
  
  let totalWin = 0
  let winningCharacter: number | null = null
  const winningColumns: number[] = []
  const winningPaylines: number[] = []
  const winningPositions: Array<{ payline: number; positions: [number, number][] }> = []

  console.log('🎰 Checking wins for slot results:', slotResults)

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

    // Debug: Log each payline check
    if (consecutiveCount >= 3) {
      console.log(`🏆 Payline ${paylineIndex + 1} WIN: ${consecutiveCount} consecutive ${firstSymbol}s`)
      console.log(`   Positions:`, payline.slice(0, consecutiveCount))
    } else if (consecutiveCount === 2) {
      console.log(`💸 Payline ${paylineIndex + 1}: Only ${consecutiveCount} consecutive ${firstSymbol}s (need 3+)`)
    }

    // Award win if 3 or more consecutive symbols (matching original game)
    if (consecutiveCount >= 3) {
      // Enhanced payout structure for different combination lengths
      let winAmount: number
      switch (consecutiveCount) {
        case 3:
          winAmount = 10  // 3 symbols = 10x
          break
        case 4:
          winAmount = 50  // 4 symbols = 50x (much better payout)
          break
        case 5:
          winAmount = 200 // 5 symbols = 200x (jackpot!)
          break
        default:
          winAmount = 10
      }
      
      console.log(`💰 Win detected! Payline ${paylineIndex + 1}: ${consecutiveCount} consecutive ${firstSymbol}s = ${winAmount} credits`)
      
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

  console.log(`🎯 Total wins: ${winningPaylines.length} paylines, ${totalWin} credits`)
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

export const getSpinDuration = (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'): number => {
  switch (speed) {
    case 'very-slow': return 3500
    case 'slow': return 2500
    case 'normal': return 1500
    case 'fast': return 800
    case 'very-fast': return 500
    default: return 1500
  }
}

export const getScrollSpeed = (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'): number => {
  switch (speed) {
    case 'very-slow': return 4   // Back to original
    case 'slow': return 6        // Back to original
    case 'normal': return 10     // Back to original
    case 'fast': return 16       // Back to original
    case 'very-fast': return 22  // Back to original
    default: return 10
  }
}
