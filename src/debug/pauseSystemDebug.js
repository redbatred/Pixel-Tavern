/**
 * Debug utility for testing the comprehensive pause system
 * Add this to your browser console to test pause functionality
 */

// Test timer behavior during pause
window.testPauseSystem = function() {
  console.log('🧪 Starting Pause System Test...')
  
  let counter = 0
  const startTime = Date.now()
  
  // Test setTimeout
  const timeoutId = setTimeout(() => {
    const elapsed = Date.now() - startTime
    console.log(`✅ setTimeout executed after ${elapsed}ms (should be ~3000ms even if paused)`)
  }, 3000)
  
  // Test setInterval
  const intervalId = setInterval(() => {
    counter++
    console.log(`🔄 Interval tick ${counter} - ${Date.now() - startTime}ms elapsed`)
    
    if (counter >= 5) {
      clearInterval(intervalId)
      console.log('✅ Interval test completed')
    }
  }, 1000)
  
  // Test requestAnimationFrame
  let frameCount = 0
  function animationTest() {
    frameCount++
    if (frameCount <= 180) { // ~3 seconds at 60fps
      console.log(`🎬 Animation frame ${frameCount}`)
      requestAnimationFrame(animationTest)
    } else {
      console.log('✅ Animation frame test completed')
    }
  }
  requestAnimationFrame(animationTest)
  
  console.log('📋 Test Instructions:')
  console.log('1. Wait 1-2 seconds')
  console.log('2. Switch to another tab or app for 5+ seconds')
  console.log('3. Return to this tab')
  console.log('4. Observe that timers complete with correct delays')
  console.log('5. Animation frames should pause and resume smoothly')
  
  return {
    timeoutId,
    intervalId,
    stop: () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      console.log('🛑 Pause system test stopped')
    }
  }
}

// Test audio pause state
window.testAudioPause = function() {
  if (window.game?.audioManager) {
    console.log('🎵 Audio Manager State:')
    console.log('- Background music playing:', window.game.audioManager.isBackgroundMusicPlaying)
    console.log('- Music enabled:', window.game.audioManager.musicEnabled)
    console.log('- Is muted:', window.game.audioManager.isMuted)
    return window.game.audioManager
  } else {
    console.log('❌ Audio manager not found')
  }
}

// Test PIXI ticker state
window.testPixiTicker = function() {
  if (window.game?.app?.ticker) {
    const ticker = window.game.app.ticker
    console.log('🎮 PIXI Ticker State:')
    console.log('- Started:', ticker.started)
    console.log('- FPS:', ticker.FPS)
    console.log('- Last time:', ticker.lastTime)
    return ticker
  } else {
    console.log('❌ PIXI ticker not found')
  }
}

// Test pause manager state
window.testPauseManager = function() {
  if (window.pauseManager || (window.game && window.game.pauseManager)) {
    const manager = window.pauseManager || window.game.pauseManager
    console.log('⏸️ Pause Manager State:')
    console.log('- Is paused:', manager.getIsPaused?.() || 'method not available')
    return manager
  } else {
    console.log('❌ Pause manager not found')
  }
}

console.log('🧪 Pause System Debug Tools Loaded!')
console.log('Available commands:')
console.log('- testPauseSystem() - Test timer and animation pausing')
console.log('- testAudioPause() - Check audio manager state')
console.log('- testPixiTicker() - Check PIXI.js ticker state')
console.log('- testPauseManager() - Check pause manager state')
