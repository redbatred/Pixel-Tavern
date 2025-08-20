import { AnimatedSprite, Container, Texture } from 'pixi.js'
import { GameConfig } from '../config/GameConfig'

export class FireBackground {
  private container: Container
  private sprites: AnimatedSprite[] = []
  private isInitialized = false
  // Keep a reference to per-instance wrappers and their authored base offsets
  private wrappers: { node: Container; baseX: number; baseY: number }[] = []

  constructor() {
    this.container = new Container()
    // keep behind slot machine but above static background if needed; parent decides
    this.container.zIndex = -900
  }

  public getContainer(): Container {
    return this.container
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return
    if (!GameConfig.FIRE_BACKGROUND.ENABLED) {
      this.isInitialized = true
      return
    }

    // Try GIF path first if enabled
    if (GameConfig.FIRE_BACKGROUND.USE_GIF && GameConfig.FIRE_BACKGROUND.GIF_URL) {
      const gifTextures = await this.buildFromGif(GameConfig.FIRE_BACKGROUND.GIF_URL)
      if (gifTextures && gifTextures.length) {
        this.createInstances(gifTextures)
        this.isInitialized = true
        return
      }
    }

    // Prefer reading exact frame rects from the JSON; fall back to the known grid if unavailable
    const jsonUrl = encodeURI('/assets/images/Particle FX 1.3 Free/Spritesheets/Fire+Sparks-Sheet.json')
    let pngUrl = encodeURI('/assets/images/Particle FX 1.3 Free/Spritesheets/Fire+Sparks-Sheet.png')
    type Rect = { x: number; y: number; w: number; h: number }
    let rects: Rect[] | null = null
    try {
      const jsonResp = await fetch(jsonUrl, { cache: 'force-cache' })
      if (jsonResp.ok) {
        const data = await jsonResp.json()
        // If meta.image exists, use it to build the PNG URL to avoid name drift
        if (data?.meta?.image && typeof data.meta.image === 'string') {
          pngUrl = encodeURI(`/assets/images/Particle FX 1.3 Free/Spritesheets/${data.meta.image}`)
        }
        if (data?.frames && typeof data.frames === 'object') {
          // Sort frames by numeric suffix to ensure correct order (fire_0 .. fire_24)
          const entries = Object.entries<any>(data.frames)
          entries.sort((a, b) => {
            const ia = parseInt(a[0].replace(/[^0-9]/g, ''), 10)
            const ib = parseInt(b[0].replace(/[^0-9]/g, ''), 10)
            return (isNaN(ia) ? 0 : ia) - (isNaN(ib) ? 0 : ib)
          })
          rects = entries.map(([, v]) => ({ x: v.frame.x, y: v.frame.y, w: v.frame.w, h: v.frame.h }))
        }
      }
    } catch {
      // Ignore and fall back
    }
    if (!rects) {
      // Known 5x5 grid fallback per the spritesheet: widths [77,77,77,77,76], height 96
      const colWidths = [77, 77, 77, 77, 76]
      const rowHeight = 96
      const colX: number[] = [0]
      for (let i = 1; i < colWidths.length; i++) colX[i] = colX[i - 1] + colWidths[i - 1]
      rects = []
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          rects.push({ x: colX[col], y: row * rowHeight, w: colWidths[col], h: rowHeight })
        }
      }
    }

    // Compute per-frame pivot (bottom-band center) and render into uniform-width canvases
  const frames: Texture[] = []
  const maxW = Math.max(...rects.map(r => r.w))
  const canvasW = (maxW % 2 === 1) ? (maxW + 1) : maxW // even width avoids 0.5 anchor jitter
  const minW = Math.min(...rects.map(r => r.w))
  const CROP_TARGET_W = GameConfig.FIRE_BACKGROUND.CROP_WIDTH || 0 // 0 disables cropping
    const resp = await fetch(pngUrl)
    const blob = await resp.blob()
    const bitmap = await createImageBitmap(blob)
    const bottomCenters: number[] = []
    const bandHcfg = GameConfig.FIRE_BACKGROUND.BASE_BAND_HEIGHT ?? 18
    const alphaThresh = GameConfig.FIRE_BACKGROUND.BASE_ALPHA_THRESHOLD ?? 96
    const densFrac = GameConfig.FIRE_BACKGROUND.BASE_BAND_DENSITY_FRACTION ?? 0.6
    // First pass: measure bottom-band center for each frame rect using column density to avoid side embers
    for (const r of rects) {
      const { x: sx, y: sy, w, h } = r
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, sx, sy, w, h, 0, 0, w, h)
      const img = ctx.getImageData(0, 0, w, h)
      const bandH = bandHcfg // pixels from bottom
      const startY = Math.max(0, h - bandH)
      const dens = new Array<number>(w).fill(0)
      for (let y = startY; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4
          const a = img.data[idx + 3]
          if (a > alphaThresh) dens[x]++
        }
      }
      // Find largest contiguous region above a fraction of the max density
      let maxD = 0
      for (let x = 0; x < w; x++) if (dens[x] > maxD) maxD = dens[x]
      const thr = Math.max(1, Math.floor(maxD * densFrac))
      let bestL = 0, bestR = -1, curL = 0
      let inRun = false
      for (let x = 0; x < w; x++) {
        if (dens[x] >= thr) {
          if (!inRun) { inRun = true; curL = x }
        } else if (inRun) {
          const curR = x - 1
          if (curR - curL > bestR - bestL) { bestL = curL; bestR = curR }
          inRun = false
        }
      }
      if (inRun) {
        const curR = w - 1
        if (curR - curL > bestR - bestL) { bestL = curL; bestR = curR }
      }
      let pivot: number
      if (bestR >= bestL) {
        pivot = (bestL + bestR) / 2
      } else {
        // Fallback to weighted mean if no strong region
        let sumX = 0, count = 0
        for (let x = 0; x < w; x++) { sumX += x * dens[x]; count += dens[x] }
        pivot = count > 0 ? sumX / count : (w / 2)
      }
      bottomCenters.push(pivot)
    }
    // Reference not needed after normalization
    // Second pass: render normalized frames into maxW canvases centered on ref
    let frameIndex = 0
  // Use a robust global pivot when locking: median across frames reduces outliers
  // bottomCenters computed; we'll align frames to a locked pivot at canvas center
  const firstPivot = bottomCenters[0]
  const useLock = !!GameConfig.FIRE_BACKGROUND.LOCK_TO_FIRST_FRAME
    // Use a single integer crop width for all frames to keep dx constant; keep < min frame width to allow centering
    let effectiveCropW = 0
    if (CROP_TARGET_W > 0) {
      const desired = Math.floor(CROP_TARGET_W)
      const safeMax = Math.max(0, minW - 2) // 2px margin avoids hard edge clamp
      effectiveCropW = Math.min(desired, safeMax)
      if (effectiveCropW < 8) effectiveCropW = 0 // too small to be useful; disable crop
    }
    for (const r of rects) {
      const { x: sx, y: sy, w, h } = r
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const pivot = bottomCenters[frameIndex++]
      const cropW = effectiveCropW > 0 ? effectiveCropW : 0
      const targetPivot = useLock ? firstPivot : pivot
      // Align so that targetPivot lands exactly at maxW/2
      let dx = 0
      let srcLeft = 0
      if (cropW > 0) {
        srcLeft = Math.max(0, Math.min(w - cropW, Math.round(targetPivot - cropW / 2)))
  dx = Math.round((canvasW - cropW) / 2)
      } else {
  dx = Math.round(canvasW / 2 - targetPivot)
        srcLeft = 0
      }
  ctx.clearRect(0, 0, canvasW, h)
      if (cropW > 0) {
  ctx.drawImage(bitmap, sx + srcLeft, sy, cropW, h, dx, 0, cropW, h)
      } else {
  ctx.drawImage(bitmap, sx, sy, w, h, dx, 0, w, h)
      }
      const tex = Texture.from(canvas)
      frames.push(tex)
    }

  // Frames are normalized; no additional drift correction required

    this.createInstances(frames)

    this.isInitialized = true
  }

  // Build textures from a GIF file if available; falls back to null on failure
  private async buildFromGif(url: string): Promise<Texture[] | null> {
    try {
      // Dynamic import so app works without the package if not used
      const mod: any = await import('gifuct-js')
      const parseGIF = mod.parseGIF as (buf: ArrayBuffer) => any
      const decompressFrames = mod.decompressFrames as (gif: any, build: boolean) => any[]
      const resp = await fetch(encodeURI(url))
      if (!resp.ok) return null
      const buf = await resp.arrayBuffer()
      const gif = parseGIF(buf)
      const frames = decompressFrames(gif, true)
      if (!frames || !frames.length) return null
      // Logical canvas size
      const logicalW = (gif.lsd && gif.lsd.width) || frames[0].dims.width
      const logicalH = (gif.lsd && gif.lsd.height) || frames[0].dims.height
      const composedCanvases: HTMLCanvasElement[] = []
      const base = document.createElement('canvas')
      base.width = logicalW
      base.height = logicalH
      const bctx = base.getContext('2d')!
      bctx.clearRect(0, 0, logicalW, logicalH)
      let prevImageData = bctx.getImageData(0, 0, logicalW, logicalH)
      for (const f of frames) {
        // Apply disposal
        const disposal = f.disposalType || 0
        if (disposal === 2) {
          // Restore to background color (clear rect of previous frame area)
          bctx.putImageData(prevImageData, 0, 0)
          bctx.clearRect(0, 0, logicalW, logicalH)
        }
        // Draw patch
        const imgData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height)
        const tmp = document.createElement('canvas')
        tmp.width = f.dims.width
        tmp.height = f.dims.height
        const tctx = tmp.getContext('2d')!
        tctx.putImageData(imgData, 0, 0)
        bctx.drawImage(tmp, f.dims.left, f.dims.top)
        // Snapshot composed
        const snap = document.createElement('canvas')
        snap.width = logicalW
        snap.height = logicalH
        const sctx = snap.getContext('2d')!
        sctx.drawImage(base, 0, 0)
        composedCanvases.push(snap)
        // Save current for potential disposal restore
        prevImageData = bctx.getImageData(0, 0, logicalW, logicalH)
      }

      // Normalize/crop similar to PNG path
      const bandHcfg = GameConfig.FIRE_BACKGROUND.BASE_BAND_HEIGHT ?? 18
      const alphaThresh = GameConfig.FIRE_BACKGROUND.BASE_ALPHA_THRESHOLD ?? 96
      const densFrac = GameConfig.FIRE_BACKGROUND.BASE_BAND_DENSITY_FRACTION ?? 0.6
      const bottomCenters: number[] = []
      for (const cv of composedCanvases) {
        const w = cv.width, h = cv.height
        const ctx = cv.getContext('2d')!
        const img = ctx.getImageData(0, 0, w, h)
        const startY = Math.max(0, h - bandHcfg)
        const dens = new Array<number>(w).fill(0)
        for (let y = startY; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4
            const a = img.data[idx + 3]
            if (a > alphaThresh) dens[x]++
          }
        }
        let maxD = 0
        for (let x = 0; x < w; x++) if (dens[x] > maxD) maxD = dens[x]
        const thr = Math.max(1, Math.floor(maxD * densFrac))
        let bestL = 0, bestR = -1, curL = 0
        let inRun = false
        for (let x = 0; x < w; x++) {
          if (dens[x] >= thr) { if (!inRun) { inRun = true; curL = x } }
          else if (inRun) { const curR = x - 1; if (curR - curL > bestR - bestL) { bestL = curL; bestR = curR } inRun = false }
        }
        if (inRun) { const curR = w - 1; if (curR - curL > bestR - bestL) { bestL = curL; bestR = curR } }
        let pivot: number
        if (bestR >= bestL) pivot = (bestL + bestR) / 2
        else { let sumX = 0, count = 0; for (let x = 0; x < w; x++) { sumX += x * dens[x]; count += dens[x] } pivot = count > 0 ? sumX / count : (w / 2) }
        bottomCenters.push(pivot)
      }
      const maxW = Math.max(...composedCanvases.map(c => c.width))
      const canvasW = (maxW % 2 === 1) ? (maxW + 1) : maxW
      const minW = Math.min(...composedCanvases.map(c => c.width))
      const CROP_TARGET_W = GameConfig.FIRE_BACKGROUND.CROP_WIDTH || 0
      let effectiveCropW = 0
      if (CROP_TARGET_W > 0) {
        const desired = Math.floor(CROP_TARGET_W)
        const safeMax = Math.max(0, minW - 2)
        effectiveCropW = Math.min(desired, safeMax)
        if (effectiveCropW < 8) effectiveCropW = 0
      }
      const firstPivot = bottomCenters[0]
      const useLock = !!GameConfig.FIRE_BACKGROUND.LOCK_TO_FIRST_FRAME
      const textures: Texture[] = []
      let idx = 0
      for (const src of composedCanvases) {
        const w = src.width, h = src.height
        const targetPivot = useLock ? firstPivot : bottomCenters[idx++]
        const cropW = effectiveCropW > 0 ? effectiveCropW : 0
        let dx = 0, srcLeft = 0
        const out = document.createElement('canvas')
        out.width = canvasW
        out.height = h
        const octx = out.getContext('2d')!
        if (cropW > 0) { srcLeft = Math.max(0, Math.min(w - cropW, Math.round(targetPivot - cropW / 2))); dx = Math.round((canvasW - cropW) / 2) }
        else { dx = Math.round(canvasW / 2 - targetPivot) }
        octx.clearRect(0, 0, canvasW, h)
        if (cropW > 0) octx.drawImage(src, srcLeft, 0, cropW, h, dx, 0, cropW, h)
        else octx.drawImage(src, 0, 0, w, h, dx, 0, w, h)
        textures.push(Texture.from(out))
      }
      return textures
    } catch (e) {
      return null
    }
  }

  private createInstances(frames: Texture[]): void {
    const instances = GameConfig.FIRE_BACKGROUND.INSTANCES
    instances.forEach(cfg => {
      const wrapper = new Container()
  // Authoring coordinates: stored as base positions; actual wrapper.x/y may be
  // recomputed on resize depending on coord space (design vs background)
  wrapper.x = cfg.x
  wrapper.y = cfg.y
      wrapper.alpha = cfg.alpha ?? 1
      const widthScale = (cfg as any).widthScale as number | undefined
      const heightScale = (cfg as any).heightScale as number | undefined
      if (widthScale !== undefined || heightScale !== undefined) {
        // Non-uniform scale when custom width/height scale are provided
        const sx = widthScale ?? cfg.scale
        const sy = heightScale ?? cfg.scale
        wrapper.scale.set(sx, sy)
      } else {
        wrapper.scale.set(cfg.scale)
      }
      if (cfg.rotation) wrapper.angle = cfg.rotation

      const anim = new AnimatedSprite(frames)
      anim.anchor.set(0.5, 1)
      anim.roundPixels = true
      anim.animationSpeed = cfg.animationSpeed ?? 0.5
      anim.loop = true
      anim.x = 0
      anim.y = 0
      anim.onFrameChange = undefined as any
      anim.play()

      wrapper.addChild(anim)
      this.container.addChild(wrapper)
      this.sprites.push(anim)
      this.wrappers.push({ node: wrapper, baseX: cfg.x, baseY: cfg.y })
    })
  }

  // Recompute wrapper positions from authored base values based on chosen coordinate space
  // - coordSpace='design': base values are in design (1920x1080) coordinates; convert to background texture space
  // - coordSpace='background': base values are already in background texture pixels; assign directly
  public updatePlacementForBackground(
    texW: number,
    texH: number,
    designW: number,
    designH: number,
    coordSpace: 'design' | 'background' = 'design'
  ): void {
    if (!this.wrappers.length) return
    const sx = texW / designW
    const sy = texH / designH
    for (const w of this.wrappers) {
      if (coordSpace === 'design') {
        w.node.x = w.baseX * sx
        w.node.y = w.baseY * sy
      } else {
        w.node.x = w.baseX
        w.node.y = w.baseY
      }
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true })
    this.sprites = []
  }
}
