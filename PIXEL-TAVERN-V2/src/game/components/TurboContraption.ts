import { Container, Graphics, Text, TextStyle } from 'pixi.js'

export class TurboContraption extends Container {
  private leverBase!: Graphics
  private leverArm!: Graphics
  private leverHandle!: Graphics
  private gears: Graphics[]
  private statusLight!: Graphics
  private statusText!: Text
  private isActive = false
  private isAnimating = false
  private onToggle?: (isActive: boolean) => void

  constructor() {
    super()
    
    this.gears = []
    this.createContraption()
    this.setupInteractivity()
  }

  private createContraption(): void {
    // Create the mechanical base/housing
    const housing = new Graphics()
    housing.beginFill(0x4A4A4A) // Dark gray metal
    housing.lineStyle(2, 0x2A2A2A) // Darker border
    housing.drawRoundedRect(-25, -20, 50, 40, 5)
    housing.endFill()
    
    // Add rivets for detail
    for (let i = 0; i < 4; i++) {
      const rivet = new Graphics()
      rivet.beginFill(0x666666)
      rivet.drawCircle(0, 0, 2)
      rivet.endFill()
      rivet.x = (i % 2) * 30 - 15
      rivet.y = Math.floor(i / 2) * 20 - 10
      housing.addChild(rivet)
    }
    this.addChild(housing)

    // Create lever base (the pivot point)
    this.leverBase = new Graphics()
    this.leverBase.beginFill(0x8B4513) // Brown bronze
    this.leverBase.drawCircle(0, 0, 8)
    this.leverBase.endFill()
    this.leverBase.beginFill(0x654321) // Darker center
    this.leverBase.drawCircle(0, 0, 4)
    this.leverBase.endFill()
    this.leverBase.x = 15
    this.leverBase.y = -5
    this.addChild(this.leverBase)

    // Create lever arm
    this.leverArm = new Graphics()
    this.leverArm.beginFill(0xD2691E) // Orange-brown metal
    this.leverArm.lineStyle(1, 0x8B4513)
    this.leverArm.drawRoundedRect(-2, -25, 4, 25, 2)
    this.leverArm.endFill()
    this.leverArm.x = 15
    this.leverArm.y = -5
    this.leverArm.pivot.set(0, 0) // Pivot at base
    this.addChild(this.leverArm)

    // Create lever handle
    this.leverHandle = new Graphics()
    this.leverHandle.beginFill(0xCD853F) // Sandy brown
    this.leverHandle.lineStyle(1, 0x8B4513)
    this.leverHandle.drawRoundedRect(-6, -30, 12, 8, 4)
    this.leverHandle.endFill()
    this.leverHandle.x = 15
    this.leverHandle.y = -5
    this.addChild(this.leverHandle)

    // Create small gears for mechanical detail
    for (let i = 0; i < 2; i++) {
      const gear = new Graphics()
      gear.beginFill(0x696969) // Dim gray
      gear.lineStyle(1, 0x2F4F4F)
      
      // Draw gear teeth
      const teeth = 8
      const innerRadius = 4
      const outerRadius = 6
      
      gear.moveTo(innerRadius, 0)
      for (let j = 0; j <= teeth; j++) {
        const angle1 = (j / teeth) * Math.PI * 2
        const angle2 = ((j + 0.5) / teeth) * Math.PI * 2
        
        gear.lineTo(
          Math.cos(angle1) * outerRadius,
          Math.sin(angle1) * outerRadius
        )
        gear.lineTo(
          Math.cos(angle2) * innerRadius,
          Math.sin(angle2) * innerRadius
        )
      }
      gear.endFill()
      
      gear.x = -10 + (i * 15)
      gear.y = 10
      this.gears.push(gear)
      this.addChild(gear)
    }

    // Create status light
    this.statusLight = new Graphics()
    this.statusLight.beginFill(0xFF0000) // Red when locked
    this.statusLight.drawCircle(0, 0, 3)
    this.statusLight.endFill()
    this.statusLight.x = -15
    this.statusLight.y = -15
    this.addChild(this.statusLight)

    // Create status text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 8,
      fill: 0xFFD700, // Gold color
      fontWeight: 'bold'
    })
    this.statusText = new Text('LOCKED', textStyle)
    this.statusText.anchor.set(0.5, 0.5)
    this.statusText.x = 0
    this.statusText.y = 25
    this.addChild(this.statusText)

    // Set initial state
    this.updateVisualState()
  }

  private setupInteractivity(): void {
    this.interactive = true
    this.cursor = 'pointer'
    this.on('pointerdown', this.handleClick.bind(this))
  }

  private handleClick(): void {
    if (this.isAnimating) return
    
    this.isActive = !this.isActive
    this.animateToggle()
    this.onToggle?.(this.isActive)
  }

  private async animateToggle(): Promise<void> {
    if (this.isAnimating) return
    
    this.isAnimating = true
    
    // Animate lever movement
    const startRotation = this.isActive ? 0 : -0.5
    const endRotation = this.isActive ? -0.5 : 0
    const duration = 300 // milliseconds
    const startTime = Date.now()
    
    const animateFrame = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easing = 1 - Math.pow(1 - progress, 3) // Ease out cubic
      
      const currentRotation = startRotation + (endRotation - startRotation) * easing
      this.leverArm.rotation = currentRotation
      this.leverHandle.rotation = currentRotation
      
      // Rotate gears
      this.gears.forEach((gear, index) => {
        gear.rotation += (index % 2 === 0 ? 0.1 : -0.1) * easing
      })
      
      if (progress < 1) {
        requestAnimationFrame(animateFrame)
      } else {
        this.updateVisualState()
        this.isAnimating = false
      }
    }
    
    requestAnimationFrame(animateFrame)
  }

  private updateVisualState(): void {
    // Update status light color
    this.statusLight.clear()
    this.statusLight.beginFill(this.isActive ? 0x00FF00 : 0xFF0000) // Green when unlocked, red when locked
    this.statusLight.drawCircle(0, 0, 3)
    this.statusLight.endFill()
    
    // Update status text
    this.statusText.text = this.isActive ? 'UNLOCKED' : 'LOCKED'
    this.statusText.style.fill = this.isActive ? 0x00FF00 : 0xFF6666
  }

  public setToggleCallback(callback: (isActive: boolean) => void): void {
    this.onToggle = callback
  }

  public setActive(active: boolean, immediate = false): void {
    this.isActive = active
    
    if (immediate) {
      this.leverArm.rotation = active ? -0.5 : 0
      this.leverHandle.rotation = active ? -0.5 : 0
      this.updateVisualState()
    } else if (!this.isAnimating) {
      this.animateToggle()
    }
  }

  public getIsActive(): boolean {
    return this.isActive
  }

  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  public setScale(scaleX: number, scaleY: number = scaleX): void {
    this.scale.set(scaleX, scaleY)
  }
}
