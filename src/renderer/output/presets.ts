// Preset snapshot + crossfade engine. Numeric leaves lerp over the fade;
// discrete values (booleans, enums, res-changing ints) switch at the midpoint.

import type { AppState, PresetData } from '../../shared/params'
import type { StatePatch } from '../../shared/api'

// lerping these would re-init framebuffers every frame — snap at midpoint instead
const SNAP_KEYS = new Set(['simRes', 'dyeRes'])

type AnyObj = Record<string, unknown>

export function snapshotPreset(state: AppState): PresetData {
  const a = state.audio
  return JSON.parse(
    JSON.stringify({
      sim: state.sim,
      visual: state.visual,
      mappings: state.mappings,
      emitters: state.emitters,
      audioTuning: {
        sub: a.sub,
        bass: a.bass,
        mid: a.mid,
        treble: a.treble,
        beatSensitivity: a.beatSensitivity
      }
    })
  ) as PresetData
}

/** reshape PresetData into a StatePatch (audioTuning → audio subset) */
export function presetToPatch(p: PresetData): StatePatch {
  return {
    sim: p.sim,
    visual: p.visual,
    mappings: p.mappings,
    emitters: p.emitters,
    audio: {
      sub: p.audioTuning.sub,
      bass: p.audioTuning.bass,
      mid: p.audioTuning.mid,
      treble: p.audioTuning.treble,
      beatSensitivity: p.audioTuning.beatSensitivity
    }
  } as StatePatch
}

/** clone current state values matching the patch's shape (the fade's "from") */
function captureCurrent(live: AnyObj, target: AnyObj): AnyObj {
  const out: AnyObj = {}
  for (const key of Object.keys(target)) {
    const tv = target[key]
    const lv = live[key]
    if (tv !== null && typeof tv === 'object' && lv !== null && typeof lv === 'object') {
      out[key] = captureCurrent(lv as AnyObj, tv as AnyObj)
    } else {
      out[key] = lv
    }
  }
  return out
}

function applyLerp(live: AnyObj, from: AnyObj, to: AnyObj, k: number): void {
  for (const key of Object.keys(to)) {
    const tv = to[key]
    const fv = from[key]
    if (tv !== null && typeof tv === 'object') {
      applyLerp(live[key] as AnyObj, fv as AnyObj, tv as AnyObj, k)
    } else if (typeof tv === 'number' && typeof fv === 'number' && !SNAP_KEYS.has(key)) {
      live[key] = fv + (tv - fv) * k
    } else {
      live[key] = k >= 0.5 ? tv : fv
    }
  }
}

export class PresetFader {
  private from: AnyObj | null = null
  private target: StatePatch | null = null
  private t = 0
  private dur = 0

  get active(): boolean {
    return this.target !== null
  }

  start(state: AppState, preset: PresetData, durSec: number): void {
    this.target = presetToPatch(preset)
    this.from = captureCurrent(state as unknown as AnyObj, this.target as AnyObj)
    this.t = 0
    this.dur = Math.max(durSec, 0.001)
  }

  /** advance the fade; returns the final patch once, when the fade completes */
  update(state: AppState, dt: number): StatePatch | null {
    if (!this.target || !this.from) return null
    this.t += dt
    const k = Math.min(this.t / this.dur, 1)
    // ease in-out reads smoother than linear on exposure/color moves
    const eased = k * k * (3 - 2 * k)
    applyLerp(state as unknown as AnyObj, this.from, this.target as AnyObj, eased)
    if (k >= 1) {
      const finished = this.target
      this.target = null
      this.from = null
      return finished
    }
    return null
  }
}
