import { setup, assign } from "xstate";

export interface GameContext {
  credits: number;
  betAmount: number;
  maxBet: number;
  lastWin: number;
  isAutoSpinning: boolean;
  stopAutoSpinAfterRound: boolean;
  autoSpinCount: number;
  autoSpinRemaining: number;
  isInfiniteAutoSpin: boolean;
  spinsCompleted: number;
  animationSpeed: "very-slow" | "slow" | "normal" | "fast" | "very-fast";
  autoSpinDelay: number;
  isInstantMode: boolean;
  previousState?: string; // Store previous state for pause/resume
  slotResults?: number[][];
  winAmount?: number;
  winningPositions?: Array<{ payline: number; positions: [number, number][] }>;
  winningCharacter?: number | null;
  
  // Pause/resume state tracking  
  isResumingFromPause?: boolean;
}

export type GameEvent =
  | { type: "SPIN" }
  | { type: "INSTANT_SPIN" }
  | { type: "ENABLE_TURBO" }
  | { type: "DISABLE_TURBO" }
  | { type: "SPIN_COMPLETE"; results: number[][] }
  | {
      type: "WIN_CHECK_COMPLETE";
      winAmount: number;
      winningPositions: Array<{
        payline: number;
        positions: [number, number][];
      }>;
      winningCharacter: number | null;
    }
  | { type: "WIN_ANIMATION_COMPLETE" }
  | { type: "SET_BET"; amount: number }
  | { type: "MAX_BET" }
  | { type: "TOGGLE_AUTO_SPIN" }
  | { type: "START_AUTO_SPIN"; count: number; isInfinite: boolean }
  | { type: "REQUEST_AUTO_SPIN_STOP" }
  | { type: "AUTO_SPIN_TIMEOUT" }
  | { type: "SET_ANIMATION_SPEED"; speed: "very-slow" | "slow" | "normal" | "fast" | "very-fast" }
  | { type: "SET_AUTO_SPIN_DELAY"; delay: number }
  | { type: "PAUSE" }
  | { type: "RESUME" };

export const gameStateMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    hasCredits: ({ context }) => context.credits >= context.betAmount,
    hasWin: ({ context }) => {
      const hasWinResult = (context.winAmount || 0) > 0;
      return hasWinResult;
    },
    isAutoSpinning: ({ context }) => context.isAutoSpinning,
    hasAutoSpinsRemaining: ({ context }) => 
      context.isInfiniteAutoSpin || context.autoSpinRemaining > 0,
    shouldShowWinModal: ({ context }) => {
      const multiplier = (context.winAmount || 0) / context.betAmount;
      return multiplier >= 5; // Show modal for 5x+ wins
    },
    canAffordBet: ({ context, event }) => {
      if (event.type === "SET_BET") {
        return context.credits >= event.amount;
      }
      return context.credits >= context.betAmount;
    },
    isEpicWin: ({ context }) => {
      const multiplier = (context.winAmount || 0) / context.betAmount;
      return multiplier >= 50;
    },
    isMegaWin: ({ context }) => {
      const multiplier = (context.winAmount || 0) / context.betAmount;
      return multiplier >= 20 && multiplier < 50;
    },
  },
  actions: {
    deductBet: assign({
      credits: ({ context }) => context.credits - context.betAmount,
    }),
    setBet: assign({
      betAmount: ({ event }) => {
        if (event.type === "SET_BET") {
          return event.amount;
        }
        return 10;
      },
    }),
    setMaxBet: assign({
      betAmount: ({ context }) => context.maxBet,
    }),
    addWinToCredits: assign({
      credits: ({ context }) => context.credits + (context.winAmount || 0),
    }),
    setSlotResults: assign({
      slotResults: ({ event }) => {
        if (event.type === "SPIN_COMPLETE") {
          return event.results;
        }
        return undefined;
      },
    }),
    setWinResults: assign({
      winAmount: ({ event }) => {
        if (event.type === "WIN_CHECK_COMPLETE") {
          return event.winAmount;
        }
        return 0;
      },
      lastWin: ({ event }) => {
        if (event.type === "WIN_CHECK_COMPLETE") {
          return event.winAmount;
        }
        return 0;
      },
      winningPositions: ({ event }) => {
        if (event.type === "WIN_CHECK_COMPLETE") {
          return event.winningPositions;
        }
        return [];
      },
      winningCharacter: ({ event }) => {
        if (event.type === "WIN_CHECK_COMPLETE") {
          return event.winningCharacter;
        }
        return null;
      },
    }),
    toggleAutoSpin: assign({
      isAutoSpinning: ({ context }) => !context.isAutoSpinning,
      stopAutoSpinAfterRound: false, // Reset the stop flag when toggling
      autoSpinCount: 0,
      autoSpinRemaining: 0,
      isInfiniteAutoSpin: false,
      spinsCompleted: 0,
    }),
    startAutoSpin: assign({
      isAutoSpinning: true,
      stopAutoSpinAfterRound: false,
      spinsCompleted: 0,
      autoSpinCount: ({ event }) => {
        if (event.type === "START_AUTO_SPIN") {
          return event.count;
        }
        return 0;
      },
      autoSpinRemaining: ({ event }) => {
        if (event.type === "START_AUTO_SPIN") {
          return event.isInfinite ? -1 : event.count;
        }
        return 0;
      },
      isInfiniteAutoSpin: ({ event }) => {
        if (event.type === "START_AUTO_SPIN") {
          return event.isInfinite;
        }
        return false;
      },
    }),
    decrementAutoSpinCount: assign({
      autoSpinRemaining: ({ context }) => {
        if (context.isInfiniteAutoSpin) {
          return -1; // Keep infinite
        }
        return Math.max(0, context.autoSpinRemaining - 1);
      },
      spinsCompleted: ({ context }) => context.spinsCompleted + 1,
    }),
    requestAutoSpinStop: assign({
      stopAutoSpinAfterRound: true, // Set flag to stop after current round
    }),
    setAnimationSpeed: assign({
      animationSpeed: ({ event }) => {
        if (event.type === "SET_ANIMATION_SPEED") {
          return event.speed;
        }
        return "normal";
      },
    }),
    setAutoSpinDelay: assign({
      autoSpinDelay: ({ event }) => {
        if (event.type === "SET_AUTO_SPIN_DELAY") {
          return event.delay;
        }
        return 2000; // Default delay
      },
    }),
    clearWinState: assign({
      winAmount: 0,
      lastWin: 0,
      winningPositions: [],
      winningCharacter: null,
    }),
    enableInstantMode: assign({
      isInstantMode: true,
    }),
    disableInstantMode: assign({
      isInstantMode: false,
    }),
    clearResumeFlag: assign({
      isResumingFromPause: false,
    }),
  },
  delays: {
    spinDuration: ({ context }) => {
      switch (context.animationSpeed) {
        case "very-slow":
          return 2000;
        case "slow":
          return 1000;
        case "fast":
          return 400;
        case "very-fast":
          return 250;
        default:
          return 550; // Back to original normal speed
      }
    },
    autoSpinDelay: ({ context }) => {
      // Original delays
      switch (context.animationSpeed) {
        case "very-slow":
          return 400;
        case "slow":
          return 300;
        case "fast":
          return 70;
        case "very-fast":
          return 50;
        default:
          return 150; // Back to original
      }
    },
    winDisplayDuration: ({ context }) => {
      // Show win longer for bigger wins
      const multiplier = (context.winAmount || 0) / context.betAmount;
      if (multiplier >= 50) return 5000;
      if (multiplier >= 20) return 4000;
      if (multiplier >= 10) return 3000;
      return 2100;
    },
  },
}).createMachine({
  id: "pixelTavernSlotMachine",
  initial: "idle",
  context: ({ input }: any) => ({
    credits: input?.credits || 1000,
    betAmount: input?.betAmount || 10,
    maxBet: input?.maxBet || 100,
    lastWin: 0,
    isAutoSpinning: false,
    stopAutoSpinAfterRound: false,
    autoSpinCount: 0,
    autoSpinRemaining: 0,
    isInfiniteAutoSpin: false,
    spinsCompleted: 0,
    animationSpeed: "normal" as const,
    autoSpinDelay: 2000,
    isInstantMode: false,
    slotResults: undefined,
    winAmount: 0,
    winningPositions: [],
    winningCharacter: null,
  }),
  states: {
    idle: {
      on: {
        SPIN: {
          target: "spinning",
          guard: "hasCredits",
          actions: ["deductBet", "clearWinState"],
        },
        INSTANT_SPIN: {
          target: "spinning", 
          guard: "hasCredits",
          actions: ["deductBet", "clearWinState"],
        },
        ENABLE_TURBO: {
          actions: "enableInstantMode",
        },
        DISABLE_TURBO: {
          actions: "disableInstantMode",
        },
        SET_BET: {
          guard: "canAffordBet",
          actions: "setBet",
        },
        MAX_BET: {
          guard: ({ context }) => context.credits >= context.maxBet,
          actions: "setMaxBet",
        },
        TOGGLE_AUTO_SPIN: [
          {
            // If auto-spinning is active, request stop after current round
            guard: ({ context }) =>
              context.isAutoSpinning && !context.stopAutoSpinAfterRound,
            actions: ["requestAutoSpinStop"],
          },
          {
            // If not auto-spinning, just toggle normally (will show modal in UI)
            actions: ["toggleAutoSpin"],
          },
        ],
        START_AUTO_SPIN: {
          target: "spinning",
          guard: ({ context }) =>
            !context.isAutoSpinning && context.credits >= context.betAmount,
          actions: ["startAutoSpin"],
        },
        SET_ANIMATION_SPEED: {
          actions: "setAnimationSpeed",
        },
        SET_AUTO_SPIN_DELAY: {
          actions: "setAutoSpinDelay",
        },
        REQUEST_AUTO_SPIN_STOP: {
          // Safe to set stop flag in idle state
          guard: ({ context }) =>
            context.isAutoSpinning && !context.stopAutoSpinAfterRound,
          actions: ["requestAutoSpinStop"],
        },
        PAUSE: {
          target: "paused",
          actions: assign({ previousState: () => 'idle' })
        },
      },
    },
    spinning: {
      entry: ["decrementAutoSpinCount", "clearResumeFlag"],
      on: {
        SPIN_COMPLETE: {
          target: "checkingWin",
          actions: "setSlotResults",
        },
        REQUEST_AUTO_SPIN_STOP: {
          actions: ["requestAutoSpinStop"],
        },
        PAUSE: {
          target: "paused",
          actions: assign({ previousState: () => 'spinning' })
        },
      },
    },
    checkingWin: {
      on: {
        WIN_CHECK_COMPLETE: {
          target: "evaluatingWin",
          actions: "setWinResults",
        },
        REQUEST_AUTO_SPIN_STOP: {
          actions: ["requestAutoSpinStop"],
        },
      },
    },
    evaluatingWin: {
      always: [
        {
          target: "showingWin",
          guard: "hasWin",
        },
        {
          target: "checkingAutoSpin",
        },
      ],
    },
    showingWin: {
      after: {
        winDisplayDuration: "collectingWin",
      },
      on: {
        SPIN: {
          target: "spinning",
          guard: "hasCredits",
          actions: ["addWinToCredits", "deductBet", "clearWinState"],
        },
        WIN_ANIMATION_COMPLETE: "collectingWin",
        REQUEST_AUTO_SPIN_STOP: {
          actions: ["requestAutoSpinStop"],
        },
      },
    },
    collectingWin: {
      entry: ["addWinToCredits"],
      always: "checkingAutoSpin",
    },
    checkingAutoSpin: {
      always: [
        {
          // Stop auto-spin if stop was requested
          target: "idle",
          guard: ({ context }) => context.stopAutoSpinAfterRound,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false,
              spinsCompleted: 0
            }),
          ],
        },
        {
          // Stop auto-spin if no auto spins remaining
          target: "idle",
          guard: ({ context }) => 
            context.isAutoSpinning && !context.isInfiniteAutoSpin && context.autoSpinRemaining <= 0,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        {
          // Continue auto-spin if still active and has credits and spins remaining
          target: "autoSpinDelay",
          guard: ({ context }) =>
            context.isAutoSpinning &&
            !context.stopAutoSpinAfterRound &&
            context.credits >= context.betAmount &&
            (context.isInfiniteAutoSpin || context.autoSpinRemaining > 0),
        },
        {
          // Stop auto-spin if no credits
          target: "idle",
          guard: ({ context }) => context.credits < context.betAmount,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        {
          // Default to idle
          target: "idle",
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
      ],
    },
    autoSpinDelay: {
      after: {
        autoSpinDelay: {
          target: "checkingAutoSpinContinue",
        },
      },
      on: {
        TOGGLE_AUTO_SPIN: {
          // Always stop auto-spin when toggled during delay
          target: "idle",
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        REQUEST_AUTO_SPIN_STOP: {
          // Set stop flag during delay - will be checked on next transition
          guard: ({ context }) =>
            context.isAutoSpinning && !context.stopAutoSpinAfterRound,
          actions: [assign({ stopAutoSpinAfterRound: true })],
        },
        SPIN: {
          target: "spinning",
          actions: ["deductBet", "clearWinState"],
        },
        PAUSE: {
          target: "paused",
          actions: assign({ previousState: () => 'autoSpinDelay' })
        },
      },
    },
    checkingAutoSpinContinue: {
      always: [
        {
          // Stop auto-spin if stop was requested
          target: "idle",
          guard: ({ context }) => context.stopAutoSpinAfterRound === true,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        {
          // Stop auto-spin if no auto spins remaining
          target: "idle",
          guard: ({ context }) => 
            context.isAutoSpinning && !context.isInfiniteAutoSpin && context.autoSpinRemaining <= 0,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        {
          // Stop auto-spin if no credits
          target: "idle",
          guard: ({ context }) => context.credits < context.betAmount,
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
        {
          // Stop auto-spin if not auto-spinning anymore
          target: "idle",
          guard: ({ context }) => !context.isAutoSpinning,
          actions: [
            assign({ 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            })
          ],
        },
        {
          // Continue spinning if all conditions are met
          target: "spinning",
          guard: ({ context }) =>
            context.isAutoSpinning &&
            !context.stopAutoSpinAfterRound &&
            context.credits >= context.betAmount &&
            (context.isInfiniteAutoSpin || context.autoSpinRemaining > 0),
          actions: ["deductBet", "clearWinState"],
        },
        {
          // Default fallback to idle
          target: "idle",
          actions: [
            assign({ 
              isAutoSpinning: false, 
              stopAutoSpinAfterRound: false,
              autoSpinCount: 0,
              autoSpinRemaining: 0,
              isInfiniteAutoSpin: false
            }),
          ],
        },
      ],
    },
    paused: {
      entry: assign({
        // Store the previous state when pausing
        previousState: ({ context }) => context.previousState || 'idle'
      }),
      on: {
        RESUME: [
          {
            // Resume to autoSpinDelay if we were in that state
            target: "autoSpinDelay",
            guard: ({ context }) => context.previousState === 'autoSpinDelay',
            actions: assign({ isResumingFromPause: false })
          },
          {
            // Resume to spinning if we were spinning
            target: "spinning", 
            guard: ({ context }) => context.previousState === 'spinning',
            actions: assign({ isResumingFromPause: true })
          },
          {
            // Resume to idle by default
            target: "idle",
            actions: assign({ isResumingFromPause: false })
          }
        ],
        SPIN_COMPLETE: {
          // Allow spin completion even while paused
          target: "checkingWin",
          actions: "setSlotResults",
        },
        TOGGLE_AUTO_SPIN: {
          target: "idle",
          actions: "toggleAutoSpin",
        },
      },
    },
  },
});
