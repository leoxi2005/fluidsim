import { PALETTES, type Palette } from '../../shared/palettes'

export type RGB = [number, number, number]

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function getPalette(key: string): Palette {
  return PALETTES[key] ?? PALETTES.tealInk
}

/** piecewise-linear sample along the palette's gradient stops, t in 0–1 */
export function samplePalette(palette: Palette, t: number): RGB {
  const stops = palette.stops
  const clamped = Math.min(Math.max(t, 0), 1)
  const scaled = clamped * (stops.length - 1)
  const i = Math.min(Math.floor(scaled), stops.length - 2)
  const f = scaled - i
  const a = hexToRgb(stops[i])
  const b = hexToRgb(stops[i + 1])
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

/** triangle wave 0→1→0 — cycles the gradient without a seam at the wrap point */
export function pingPong(x: number): number {
  const f = x % 2
  const p = f < 0 ? f + 2 : f
  return p <= 1 ? p : 2 - p
}
