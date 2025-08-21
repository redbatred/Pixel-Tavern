import { AudioManager } from '../audio/AudioManager'

interface SettingsState {
  animationSpeed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'
  autoSpinDelay: number
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  musicEnabled: boolean
  sfxEnabled: boolean
  muted: boolean
}

export class SettingsModal {
  private container: HTMLElement
  private audioManager: AudioManager
  private modal: HTMLElement | null = null
  private isOpen = false
  private onSettingsChange?: (settings: Partial<SettingsState>) => void
  
  private settings: SettingsState = {
    animationSpeed: 'normal',
    autoSpinDelay: 2000,
    masterVolume: 0.7,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
    muted: false
  }

  constructor(container: HTMLElement, audioManager: AudioManager) {
    this.container = container
    this.audioManager = audioManager
  }

  setOnSettingsChange(callback: (settings: Partial<SettingsState>) => void): void {
    this.onSettingsChange = callback
  }

  updateSettings(newSettings: Partial<SettingsState>): void {
    this.settings = { ...this.settings, ...newSettings }
    if (this.isOpen) {
      this.updateUI()
    }
  }

  show(): void {
    if (this.isOpen) return
    
    this.isOpen = true
    this.audioManager.playImmediateSound('UI_CLICK')
    this.createModal()
    document.body.style.overflow = 'hidden'
  }

  hide(): void {
    if (!this.isOpen) return
    
    this.isOpen = false
    this.audioManager.playImmediateSound('UI_CLICK')
    
    if (this.modal) {
      this.modal.style.animation = 'modal-fade-out 0.3s ease-out'
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal)
          this.modal = null
        }
        document.body.style.overflow = ''
      }, 300)
    }
  }

  private createModal(): void {
    this.modal = document.createElement('div')
    this.modal.className = 'settings-modal-backdrop'
    this.modal.innerHTML = `
      <div class="settings-modal">
        <div class="settings-modal-header">
          <h2>⚙️ Game Settings</h2>
          <button class="close-btn">✕</button>
        </div>
        
        <div class="settings-modal-content">
          <div class="settings-section">
            <div class="audio-controls">
              <div class="audio-controls-header">
                <h3>🎵 Audio Settings</h3>
                <button class="mute-btn" id="muteBtn" title="Toggle Mute">
                  ${this.settings.muted ? '🔇' : '🔊'}
                </button>
              </div>

              <!-- Master Volume -->
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">🎚️</span>
                  <span class="volume-text">Master Volume</span>
                  <span class="volume-value" id="masterVolumeValue">${Math.round(this.settings.masterVolume * 100)}%</span>
                </label>
                <div class="volume-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value="${this.settings.masterVolume}"
                    id="masterVolumeSlider"
                    class="volume-slider master-volume"
                    ${this.settings.muted ? 'disabled' : ''}
                  />
                  <div class="volume-fill" style="width: ${this.settings.masterVolume * 100}%"></div>
                </div>
              </div>

              <!-- Music Volume -->
              <div class="volume-control">
                <label class="volume-label">
                  <div class="label-with-toggle">
                    <span class="volume-icon">🎵</span>
                    <span class="volume-text">Music</span>
                    <button class="toggle-btn ${this.settings.musicEnabled ? 'enabled' : 'disabled'}" id="musicToggle" title="Toggle Music">
                      ${this.settings.musicEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <span class="volume-value" id="musicVolumeValue">${Math.round(this.settings.musicVolume * 100)}%</span>
                </label>
                <div class="volume-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value="${this.settings.musicVolume}"
                    id="musicVolumeSlider"
                    class="volume-slider music-volume"
                    ${this.settings.muted || !this.settings.musicEnabled ? 'disabled' : ''}
                  />
                  <div class="volume-fill music-fill" style="width: ${this.settings.musicVolume * 100}%"></div>
                </div>
              </div>

              <!-- SFX Volume -->
              <div class="volume-control">
                <label class="volume-label">
                  <div class="label-with-toggle">
                    <span class="volume-icon">🔊</span>
                    <span class="volume-text">Sound Effects</span>
                    <button class="toggle-btn ${this.settings.sfxEnabled ? 'enabled' : 'disabled'}" id="sfxToggle" title="Toggle SFX">
                      ${this.settings.sfxEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <span class="volume-value" id="sfxVolumeValue">${Math.round(this.settings.sfxVolume * 100)}%</span>
                </label>
                <div class="volume-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value="${this.settings.sfxVolume}"
                    id="sfxVolumeSlider"
                    class="volume-slider sfx-volume"
                    ${this.settings.muted || !this.settings.sfxEnabled ? 'disabled' : ''}
                  />
                  <div class="volume-fill sfx-fill" style="width: ${this.settings.sfxVolume * 100}%"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>🎮 Game Settings</h3>
            <div class="setting-item">
              <label>
                <span>Animation speed:</span>
                <select id="animationSpeedSelect" title="Controls how fast the reels spin">
                  <option value="very-slow" ${this.settings.animationSpeed === 'very-slow' ? 'selected' : ''}>Very Slow (2.2s)</option>
                  <option value="slow" ${this.settings.animationSpeed === 'slow' ? 'selected' : ''}>Slow (1.6s)</option>
                  <option value="normal" ${this.settings.animationSpeed === 'normal' ? 'selected' : ''}>Normal (1.0s)</option>
                  <option value="fast" ${this.settings.animationSpeed === 'fast' ? 'selected' : ''}>Fast (0.6s)</option>
                  <option value="very-fast" ${this.settings.animationSpeed === 'very-fast' ? 'selected' : ''}>Very Fast (0.35s)</option>
                </select>
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <span>Auto-spin delay:</span>
                <select id="autoSpinDelaySelect" title="Delay between automatic spins">
                  <option value="500" ${this.settings.autoSpinDelay === 500 ? 'selected' : ''}>0.5 seconds (Rapid)</option>
                  <option value="1000" ${this.settings.autoSpinDelay === 1000 ? 'selected' : ''}>1 second (Fast)</option>
                  <option value="1500" ${this.settings.autoSpinDelay === 1500 ? 'selected' : ''}>1.5 seconds (Quick)</option>
                  <option value="2000" ${this.settings.autoSpinDelay === 2000 ? 'selected' : ''}>2 seconds (Normal)</option>
                  <option value="2500" ${this.settings.autoSpinDelay === 2500 ? 'selected' : ''}>2.5 seconds (Relaxed)</option>
                  <option value="3000" ${this.settings.autoSpinDelay === 3000 ? 'selected' : ''}>3 seconds (Slow)</option>
                  <option value="4000" ${this.settings.autoSpinDelay === 4000 ? 'selected' : ''}>4 seconds (Very Slow)</option>
                  <option value="5000" ${this.settings.autoSpinDelay === 5000 ? 'selected' : ''}>5 seconds (Maximum)</option>
                </select>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>ℹ️ About</h3>
            <div class="about-content">
              <p><strong>Medieval Tavern Slots</strong></p>
              <p>Version 2.0.0</p>
              <p>A magical slot machine experience set in a medieval tavern.</p>
              <p>Built with PIXI.js, XState, and pure TypeScript.</p>
            </div>
          </div>
        </div>
        
        <div class="settings-modal-footer">
          <button class="settings-btn save-btn">💾 Save & Close</button>
        </div>
      </div>
    `

    this.setupEventListeners()
    this.container.appendChild(this.modal)
  }

  private setupEventListeners(): void {
    if (!this.modal) return

    const backdrop = this.modal
    const closeBtn = this.modal.querySelector('.close-btn') as HTMLButtonElement
    const saveBtn = this.modal.querySelector('.save-btn') as HTMLButtonElement
    const modalContent = this.modal.querySelector('.settings-modal') as HTMLElement

    // Close modal handlers
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.hide()
      }
    })

    closeBtn.addEventListener('click', () => this.hide())
    saveBtn.addEventListener('click', () => this.hide())

    // Prevent modal content clicks from closing modal
    modalContent.addEventListener('click', (e) => e.stopPropagation())

    // Audio control handlers
    this.setupAudioControls()
    this.setupGameSettings()
  }

  private setupAudioControls(): void {
    if (!this.modal) return

    const muteBtn = this.modal.querySelector('#muteBtn') as HTMLButtonElement
    const musicToggle = this.modal.querySelector('#musicToggle') as HTMLButtonElement
    const sfxToggle = this.modal.querySelector('#sfxToggle') as HTMLButtonElement
    
    const masterSlider = this.modal.querySelector('#masterVolumeSlider') as HTMLInputElement
    const musicSlider = this.modal.querySelector('#musicVolumeSlider') as HTMLInputElement
    const sfxSlider = this.modal.querySelector('#sfxVolumeSlider') as HTMLInputElement

    // Mute toggle
    muteBtn.addEventListener('click', () => {
      this.settings.muted = !this.settings.muted
      this.audioManager.setMasterVolume(this.settings.muted ? 0 : this.settings.masterVolume)
      this.updateUI()
      // Play click sound after updating mute state
      if (!this.settings.muted) {
        this.audioManager.playImmediateSound('UI_CLICK')
      }
    })

    // Music toggle
    musicToggle.addEventListener('click', () => {
      this.settings.musicEnabled = !this.settings.musicEnabled
      const volumeToSet = this.settings.musicEnabled ? this.settings.musicVolume : 0
      this.audioManager.setMusicVolume(volumeToSet)
      this.updateUI()
      this.audioManager.playImmediateSound('UI_CLICK')
    })

    // SFX toggle
    sfxToggle.addEventListener('click', () => {
      this.settings.sfxEnabled = !this.settings.sfxEnabled
      this.audioManager.setSfxVolume(this.settings.sfxEnabled ? this.settings.sfxVolume : 0)
      this.updateUI()
      this.audioManager.playImmediateSound('UI_CLICK')
    })

    // Volume sliders
    masterSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.settings.masterVolume = value
      this.audioManager.setMasterVolume(this.settings.muted ? 0 : value)
      this.updateUI()
    })

    musicSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.settings.musicVolume = value
      this.audioManager.setMusicVolume(this.settings.musicEnabled ? value : 0)
      this.updateUI()
    })

    sfxSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.settings.sfxVolume = value
      this.audioManager.setSfxVolume(this.settings.sfxEnabled ? value : 0)
      this.updateUI()
    })
  }

  private setupGameSettings(): void {
    if (!this.modal) return

    const autoSpinSelect = this.modal.querySelector('#autoSpinDelaySelect') as HTMLSelectElement
    const animationSelect = this.modal.querySelector('#animationSpeedSelect') as HTMLSelectElement

    autoSpinSelect.addEventListener('change', (e) => {
      this.settings.autoSpinDelay = parseInt((e.target as HTMLSelectElement).value)
      this.notifySettingsChange({ autoSpinDelay: this.settings.autoSpinDelay })
      this.audioManager.playImmediateSound('UI_CLICK')
    })

    animationSelect.addEventListener('change', (e) => {
      this.settings.animationSpeed = (e.target as HTMLSelectElement).value as 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'
      this.notifySettingsChange({ animationSpeed: this.settings.animationSpeed })
      this.audioManager.playImmediateSound('UI_CLICK')
    })
  }

  private updateUI(): void {
    if (!this.modal) return

    // Update mute button
    const muteBtn = this.modal.querySelector('#muteBtn') as HTMLButtonElement
    muteBtn.innerHTML = this.settings.muted ? '🔇' : '🔊'
    muteBtn.className = `mute-btn ${this.settings.muted ? 'muted' : ''}`

    // Update music toggle
    const musicToggle = this.modal.querySelector('#musicToggle') as HTMLButtonElement
    musicToggle.innerHTML = this.settings.musicEnabled ? 'ON' : 'OFF'
    musicToggle.className = `toggle-btn ${this.settings.musicEnabled ? 'enabled' : 'disabled'}`

    // Update SFX toggle
    const sfxToggle = this.modal.querySelector('#sfxToggle') as HTMLButtonElement
    sfxToggle.innerHTML = this.settings.sfxEnabled ? 'ON' : 'OFF'
    sfxToggle.className = `toggle-btn ${this.settings.sfxEnabled ? 'enabled' : 'disabled'}`

    // Update volume values and sliders
    const masterVolumeValue = this.modal.querySelector('#masterVolumeValue') as HTMLElement
    const musicVolumeValue = this.modal.querySelector('#musicVolumeValue') as HTMLElement
    const sfxVolumeValue = this.modal.querySelector('#sfxVolumeValue') as HTMLElement

    masterVolumeValue.textContent = `${Math.round(this.settings.masterVolume * 100)}%`
    musicVolumeValue.textContent = `${Math.round(this.settings.musicVolume * 100)}%`
    sfxVolumeValue.textContent = `${Math.round(this.settings.sfxVolume * 100)}%`

    // Update slider disabled states
    const masterSlider = this.modal.querySelector('#masterVolumeSlider') as HTMLInputElement
    const musicSlider = this.modal.querySelector('#musicVolumeSlider') as HTMLInputElement
    const sfxSlider = this.modal.querySelector('#sfxVolumeSlider') as HTMLInputElement

    masterSlider.disabled = this.settings.muted
    musicSlider.disabled = this.settings.muted || !this.settings.musicEnabled
    sfxSlider.disabled = this.settings.muted || !this.settings.sfxEnabled

    // Update volume fill bars
    const masterFill = this.modal.querySelector('.volume-control:nth-child(2) .volume-fill') as HTMLElement
    const musicFill = this.modal.querySelector('.volume-control:nth-child(3) .volume-fill') as HTMLElement
    const sfxFill = this.modal.querySelector('.volume-control:nth-child(4) .volume-fill') as HTMLElement

    if (masterFill) masterFill.style.width = `${this.settings.masterVolume * 100}%`
    if (musicFill) musicFill.style.width = `${this.settings.musicVolume * 100}%`
    if (sfxFill) sfxFill.style.width = `${this.settings.sfxVolume * 100}%`
  }

  private notifySettingsChange(settings: Partial<SettingsState>): void {
    if (this.onSettingsChange) {
      this.onSettingsChange(settings)
    }
  }

  destroy(): void {
    this.hide()
  }
}
