import type { AppState, AudioLevels, NdiFrameMeta, NdiStatus, PresetEntry } from './params'
import type { DeepPartial } from './merge'

export type StatePatch = DeepPartial<AppState>

export type Action =
  | { type: 'randomSplats'; count: number }
  | { type: 'clearDye' }
  | { type: 'toggleFullscreen' }

export const IPC = {
  stateGet: 'state:get',
  statePatch: 'state:patch',
  stateChanged: 'state:changed',
  action: 'action',
  fpsReport: 'fps:report',
  fpsChanged: 'fps:changed',
  audioReport: 'audio:report',
  audioChanged: 'audio:changed',
  ndiStart: 'ndi:start',
  ndiStop: 'ndi:stop',
  ndiStatus: 'ndi:status',
  ndiFrame: 'ndi:frame',
  presetsAll: 'presets:all',
  presetsSave: 'presets:save',
  presetsDelete: 'presets:delete'
} as const

/** Bridge exposed by preload as window.liquid */
export interface LiquidApi {
  getState(): Promise<AppState>
  patchState(patch: StatePatch): void
  onStateChanged(cb: (patch: StatePatch) => void): () => void
  sendAction(action: Action): void
  onAction(cb: (action: Action) => void): () => void
  reportFps(fps: number): void
  onFps(cb: (fps: number) => void): () => void
  reportAudioLevels(levels: AudioLevels): void
  onAudioLevels(cb: (levels: AudioLevels) => void): () => void
  ndiStart(cfg: { name: string; width: number; height: number; fps: number }): Promise<{ ok: boolean; error?: string }>
  ndiStop(name: string): Promise<void>
  ndiStatus(): Promise<NdiStatus>
  /** hot path — RGBA pixels straight out of readPixels (bottom-up) */
  ndiFrame(meta: NdiFrameMeta, data: Uint8Array): void
  presetsAll(): Promise<PresetEntry[]>
  /** save-or-overwrite; returns the updated list */
  presetsSave(entry: PresetEntry): Promise<PresetEntry[]>
  presetsDelete(name: string): Promise<PresetEntry[]>
}
