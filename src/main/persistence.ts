// Disk persistence in userData: settings.json (auto-saved app state, debounced)
// and presets.json (named scene snapshots for the 1–9 hotkeys).

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { AppState, PresetEntry } from '../shared/params'

const settingsPath = (): string => join(app.getPath('userData'), 'settings.json')
const presetsPath = (): string => join(app.getPath('userData'), 'presets.json')

export function loadSettings(): Partial<AppState> | null {
  try {
    if (!existsSync(settingsPath())) return null
    return JSON.parse(readFileSync(settingsPath(), 'utf8')) as Partial<AppState>
  } catch (err) {
    console.warn('[persist] failed to read settings:', (err as Error).message)
    return null
  }
}

let saveTimer: NodeJS.Timeout | null = null

export function scheduleSaveSettings(getState: () => AppState): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    flushSettings(getState())
  }, 500)
}

export function flushSettings(state: AppState): void {
  try {
    writeFileSync(settingsPath(), JSON.stringify(state, null, 2))
  } catch (err) {
    console.warn('[persist] failed to write settings:', (err as Error).message)
  }
}

// --- presets ------------------------------------------------------------------

let presets: PresetEntry[] | null = null

function loadPresets(): PresetEntry[] {
  if (presets) return presets
  try {
    presets = existsSync(presetsPath())
      ? (JSON.parse(readFileSync(presetsPath(), 'utf8')) as PresetEntry[])
      : []
  } catch (err) {
    console.warn('[persist] failed to read presets:', (err as Error).message)
    presets = []
  }
  return presets
}

function writePresets(): void {
  try {
    writeFileSync(presetsPath(), JSON.stringify(presets ?? [], null, 2))
  } catch (err) {
    console.warn('[persist] failed to write presets:', (err as Error).message)
  }
}

export function allPresets(): PresetEntry[] {
  return loadPresets()
}

/** save-or-overwrite by name, keeps list order (order = hotkey slots 1–9) */
export function savePreset(entry: PresetEntry): PresetEntry[] {
  const list = loadPresets()
  const existing = list.findIndex((p) => p.name === entry.name)
  if (existing >= 0) list[existing] = entry
  else list.push(entry)
  writePresets()
  return list
}

export function deletePreset(name: string): PresetEntry[] {
  const list = loadPresets()
  const idx = list.findIndex((p) => p.name === name)
  if (idx >= 0) list.splice(idx, 1)
  writePresets()
  return list
}
