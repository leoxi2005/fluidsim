// NDI sender wrapper around `@stagetimerio/grandiose` (N-API binding).
// Receives RGBA buffers from the output renderer (WebGL bottom-left origin),
// converts to BGRA + flips vertically in one pass, pushes video frames to NDI.
// Ported from the proven illogical-control implementation.

import { createRequire } from 'module'
import type { NdiFrameMeta, NdiStatus } from '../shared/params'

const req = createRequire(__filename)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let grandiose: any = null
let loadError: Error | null = null
try {
  grandiose = req('@stagetimerio/grandiose')
} catch (err) {
  loadError = err as Error
  console.error('[ndi] grandiose failed to load:', loadError.message)
}

function bgraFourCC(): number {
  return (
    grandiose.FOURCC_BGRA ??
    grandiose.FOURCC_VIDEO_TYPE_BGRA ??
    grandiose.BGRA ??
    0x41524742 // ASCII 'BGRA' little-endian fallback
  )
}

function progressiveFormat(): number {
  return grandiose.FORMAT_TYPE_PROGRESSIVE ?? grandiose.FRAME_FORMAT_TYPE_PROGRESSIVE ?? 1
}

interface SenderEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sender: any
  width: number
  height: number
  fps: number
  busy: boolean
  frames: number
  dropped: number
  packBuf: Buffer | null
}

const senders = new Map<string, SenderEntry>()

export function isAvailable(): boolean {
  return !!grandiose
}

export function status(): NdiStatus {
  return {
    available: !!grandiose,
    loadError: loadError ? String(loadError.message || loadError) : null,
    senders: Array.from(senders.entries()).map(([name, e]) => ({
      name,
      width: e.width,
      height: e.height,
      fps: e.fps,
      frames: e.frames,
      dropped: e.dropped
    }))
  }
}

export async function startSender(cfg: { name: string; width: number; height: number; fps: number }): Promise<void> {
  if (!grandiose) {
    throw new Error(
      `NDI not available: grandiose failed to load${loadError ? ` (${loadError.message})` : ''}. ` +
        'Check that the NDI runtime is installed.'
    )
  }
  if (senders.has(cfg.name)) return

  // reserve the slot BEFORE awaiting — concurrent starts would otherwise both
  // pass the has() check and leak a duplicate native sender
  const entry: SenderEntry = {
    sender: null,
    width: cfg.width,
    height: cfg.height,
    fps: cfg.fps || 30,
    busy: false,
    frames: 0,
    dropped: 0,
    packBuf: null
  }
  senders.set(cfg.name, entry)
  try {
    const r = grandiose.send({ name: cfg.name, clockVideo: false, clockAudio: false })
    entry.sender = r && typeof r.then === 'function' ? await r : r
  } catch (err) {
    senders.delete(cfg.name)
    throw err
  }
  console.log(`[ndi] sender started: "${cfg.name}" ${cfg.width}x${cfg.height} @${cfg.fps}fps`)
}

export function stopSender(name: string): void {
  const e = senders.get(name)
  if (!e) return
  try {
    if (typeof e.sender?.destroy === 'function') e.sender.destroy()
    else if (typeof e.sender?.close === 'function') e.sender.close()
  } catch (err) {
    console.warn('[ndi] error closing sender', name, (err as Error).message)
  }
  senders.delete(name)
  console.log(`[ndi] sender stopped: "${name}"`)
}

export function stopAll(): void {
  for (const name of Array.from(senders.keys())) stopSender(name)
}

/** RGBA bottom-up → BGRA top-down in one pass, into a reused buffer */
function packBgraFlipped(e: SenderEntry, rgba: Buffer, w: number, h: number): Buffer {
  const bytes = w * h * 4
  if (!e.packBuf || e.packBuf.length !== bytes) e.packBuf = Buffer.allocUnsafe(bytes)
  const out = e.packBuf
  const stride = w * 4
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * stride
    const dst = y * stride
    for (let x = 0; x < stride; x += 4) {
      out[dst + x] = rgba[src + x + 2]
      out[dst + x + 1] = rgba[src + x + 1]
      out[dst + x + 2] = rgba[src + x]
      out[dst + x + 3] = rgba[src + x + 3]
    }
  }
  return out
}

export function sendFrame(meta: NdiFrameMeta, rgba: Buffer): void {
  const e = senders.get(meta.name)
  if (!e || !e.sender || !grandiose) return
  // drop frames while the previous async send is in flight (back-pressure)
  if (e.busy) {
    e.dropped++
    return
  }
  if (rgba.length < meta.width * meta.height * 4) return

  e.width = meta.width
  e.height = meta.height
  // renderer now packs BGRA+flip on the GPU; the CPU path stays as fallback
  const data = meta.packed ? rgba : packBgraFlipped(e, rgba, meta.width, meta.height)

  const frame = {
    type: 'video',
    xres: meta.width,
    yres: meta.height,
    frameRateN: Math.round((meta.fps || e.fps) * 1000),
    frameRateD: 1000,
    fourCC: bgraFourCC(),
    pictureAspectRatio: meta.width / meta.height,
    frameFormatType: progressiveFormat(),
    lineStrideBytes: meta.width * 4,
    data
  }

  try {
    const r = e.sender.video(frame)
    if (r && typeof r.then === 'function') {
      e.busy = true
      r.then(() => {
        e.busy = false
        e.frames++
      }).catch((err: Error) => {
        e.busy = false
        console.warn('[ndi] video() rejected:', err.message)
      })
    } else {
      e.frames++
    }
  } catch (err) {
    e.busy = false
    console.warn('[ndi] video() threw:', (err as Error).message)
  }
}
